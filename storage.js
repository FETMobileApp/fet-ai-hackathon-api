const storage = require('azure-storage');
const stream = require('stream');

const connectionString = "DefaultEndpointsProtocol=https;AccountName=airg19storage;AccountKey=PQFlqEXDRqPcAgcG8c+OJ/ymM33Ki9b8oS4Y0eQAH830v4Ixqs9NOOn0lCmGwytcBp0rn9lgBkko2H9QI6l4Tw==;EndpointSuffix=core.windows.net";
const containerName = "result-images";

const blobService = storage.createBlobService(connectionString);

const listContainers = async () => {
    return new Promise((resolve, reject) => {
        blobService.listContainersSegmented(null, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.entries);
            }
        });
    });
};

exports.updateResultImage = async(filename, imageBuffer) => {
    return new Promise((resolve, reject) => {
        blobService.createBlockBlobFromText(containerName, filename, imageBuffer, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

exports.downloadResultImage = async(filename) => {
    return new Promise((resolve, reject) => {
        let bufferArray = [];
        const ws = new stream.Writable({
            write(chunk, encoding, callback) {
                bufferArray.push(...chunk)
                callback();
            }
        });
        ws.on('finish', () => {
            let dataBuffer = Buffer.from(bufferArray);
            resolve(dataBuffer);
         });
        ws.on('error', (err) => {
            reject(err);
        });
        blobService.getBlobToStream(containerName, filename, ws, (err, data) => {
            if (err) {
                reject(err);
            }
        });
    });
};

exports.connect = async() => {
    const containers = await listContainers();
    const isContainerNotExist = containers.length < 1 || containers.findIndex((container) => container.name === containerName) === -1;
    if (isContainerNotExist) {
        throw Error(`Container "${containerName}" does not exist!`);
    }
};