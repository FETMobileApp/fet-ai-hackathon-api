const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResultSchema = new Schema({
    id: { type: String, required: true },
    project: String,
    iteration: String,
    created: { type: Date, required: true },
    mimetype: String,
    predictions: [{
        probability: { type: Number, required: true },
        tagId: String,
        tagName: { type: String, required: true },
        boundingBox: {
            left: Number,
            top: Number,
            width: Number,
            height: Number
        }
    }]
});

const resultModel = mongoose.model('Result', ResultSchema, 'results');

module.exports = resultModel;