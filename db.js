const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dbUrl = "mongodb://airg19db:u7Bn3fiOvrDcp0NhEUoGLffisAAB3ANqSm99Q6iqjTPGZUuNsJhX0kJhhe0fJNLNzAxqWccZddASTzlx1cIzPg%3D%3D@airg19db.documents.azure.com:10255/?ssl=true";
const dbName = "airg19"

exports.connect = async() => {
    return await mongoose.connect(dbUrl, {dbName: dbName, useNewUrlParser: true})
}