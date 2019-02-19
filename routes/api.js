const express = require('express');
const multer = require('multer');
const request = require('request-promise-native');

const storage = require('../storage');

const ResultModel = require('../models/result');

const router = express.Router();
const memoryStorage = multer.memoryStorage()
const upload = multer({ storage: memoryStorage, fileFilter: function(req, file, callback) {
    console.log(`Get file uploaded: ${JSON.stringify(file)}`);
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png" || file.mimetype == "image/bmp") {
        callback(null, true)
    } else {
        callback(Error(`MIME-Type "${file.mimetype}" unsupported!`), false)
    }
}});

const uploadImageToStorage = (filename, imageBuffer) => {
    return storage.updateResultImage(filename, imageBuffer);
}

const downloadImageFromStorage = (filename) => {
    return storage.downloadResultImage(filename);
}

const uploadImageToCustomVision = async(imageBuffer, mimetype) => {
    const options = {
        url: "https://southcentralus.api.cognitive.microsoft.com/customvision/v2.0/Prediction/cc81f88a-6d34-4e63-96be-24b1d08bd6b1/image",
        method: "POST",
        headers: {
            "Content-Type": "application/octet-stream",
            "Prediction-Key": "1de09a5eec784c479e0c892de903e560"
        },
        body: imageBuffer
    }

    try {
        const res = await request(options);
        console.log("Get response from CustomView API.");
        // console.log(`Response: ${res}`);
        const result = JSON.parse(res);
        result.created = new Date(result.created);
        result.mimetype = mimetype;

        // Store image to storage
        const filename = dateFormatStringForFilename(result.created) + getExtByMimeType(mimetype);
        await uploadImageToStorage(filename, imageBuffer);
        console.log(`Result image "${filename}" is uploaded.`);

        // Store result to database
        await ResultModel.create(result);
        console.log("Result saved.");
    } catch (error) {
        console.error(err)
    }
}

const getLatestResult = () => {
    return ResultModel.findOne({}, {}, { sort: { 'created' : -1 }, limit: 1}).exec();
}

const dateFormatStringForFilename = function(date) {
    return date.toISOString().replace('T', '_').replace(/:/g, '-').replace('.', '-').replace(/Z$/gi, '');
}

const getExtByMimeType = function(mimetype) {
    switch (mimetype) {
        case "image/jpeg":
        case "image/jpg":
            return ".jpg";
        case "image/png":
            return ".png";
        case "image/bmp":
            return ".bmp";
        default:
            return ".bin";
    }
}

const sum = function(numberArray) {
    let s = 0;
    numberArray.forEach(num => {
        s += num;
    });
    return s;
}

const average = function(numberArray) {
    if (numberArray.length == 0) {
        return 0;
    }
    if (numberArray.length == 1) {
        return numberArray[0];
    }
    return sum(numberArray) / numberArray.length;
}

const calculateProbabilityForPredictionResult = function(result) {
    // highest priority object list
    const fullPriObjList = ["person"];
    const pri10ObjList = ["iphone", "notebook"/*, "backpack"*/];
    const pri08ObjList = ["thermos"];

    // exclude object list
    const excludeObjList = ["desk", "chair"];

    const highPriObjs = [];
    const lowCPriObjs = [];

    for (const po of result.predictions) {
        if (po.probability < 0.7) {
            continue;
        }
        if (excludeObjList.includes(po.tagName)) {
            continue;
        }
        if (fullPriObjList.includes(po.tagName)) {
            return 1;
        }
        if (pri10ObjList.includes(po.tagName)) {
            highPriObjs.push(po.probability * 1);
        } else if (pri08ObjList.includes(po.tagName)) {
            lowCPriObjs.push(po.probability * 0.8);
        } else {
            lowCPriObjs.push(po.probability * 0.2);
        }
    }

    if (highPriObjs.length > 0) {
        return average(highPriObjs);
    }
    if (lowCPriObjs.length > 0) {
        return sum(lowCPriObjs);
    }
    return 0;
}

router.post('/upload-img', upload.single('img'), (req, res) => {
    uploadImageToCustomVision(req.file.buffer, req.file.mimetype);
    res.status(200).send({
        "filename": req.file.originalname,
        "mimetype": req.file.mimetype,
        "size": req.file.size,
        "time": (new Date()).toISOString()
    });
});

router.get('/seat-status', async(req, res) => {
    try {
        const result = await getLatestResult();
        const resBody = {
            "created": result.created,
            "prediction": calculateProbabilityForPredictionResult(result),
            "debug": result
        }
        // console.log(`Response body: ${JSON.stringify(resBody)}`);
        res.status(200).send(resBody);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.get('/latest-img', async(req, res) => {
    try {
        const result = await getLatestResult();
        const filename = dateFormatStringForFilename(result.created) + getExtByMimeType(result.mimetype);
        // console.log(`Request download image "${filename}" from storage.`);

        const imageBuffer = await downloadImageFromStorage(filename);
        // console.log(`Result image "${filename}" is downloaded.`);

        res.status(200).type(result.mimetype).send(imageBuffer);
    } catch (err) {
        console.error(err);
        res.sendStatus(404);
    }
});

module.exports = router;