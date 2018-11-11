const format = require('util').format;
const Multer = require('multer');
const moment = require('moment');

require('dotenv').config();

const multer = Multer({
    storage: Multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    }
});

const rp = require('request-promise');
const subscriptionKey = process.env.COGNITIVE_SUBSCRIPTION_KEY;

var express = require('express');
var router = express.Router();
var fs = require('fs');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage({
    keyFilename: './happiness-store-firebase-adminsdk-wtpia-44298a1dc2.json'
});
const bucket = storage.bucket('happiness-store.appspot.com');


const reqestFaceDitection = async function(imageUrl){
    const uriBase = process.env.FACE_API_URL;

    // Request parameters.
    const params = {
        'returnFaceId': 'true',
        'returnFaceLandmarks': 'false',
        'returnFaceAttributes': 'age,gender,headPose,smile,facialHair,glasses,' +
            'emotion,hair,makeup,occlusion,accessories,blur,exposure,noise'
    };
    
    const options = {
        method: 'POST',
        timeout: 30 * 1000,
        uri: uriBase,
        qs: params,
        body: '{"url": ' + '"' + imageUrl + '"}',
        headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key' : subscriptionKey
        }
    };
    
    try{
        const body = await rp(options);
        console.log(body);
        let json = JSON.parse(body);
        console.log('JSON Response\n');
        console.log(json);
        return json;
    }
    catch(err){
        console.log('Error: ', err);
        throw err;
    }
}


router.post('/', multer.single('thumbnail'), async function (req, res, next) {
    let now = moment();
    var imageName = 'image' + now.format('YYYYMMDDhhmmss') + '.png'; 
    if(req.file.originalname.match('.jpg$') !== null || req.file.originalname.match('.jpeg$') !== null){
        var imageName = 'image' + now.format('YYYYMMDDhhmmss') + '.jpg';
    }
    const blob = bucket.file(imageName);
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => {
        next(err);
    });

    blobStream.on('finish', async () => {
        console.log('finish upload')
        // The public URL can be used to directly access the file via HTTP.
        const publicUrl = format(`https://storage.googleapis.com/${bucket.name}/${blob.name}`);
        console.log(publicUrl);
        let json = null;
        try{
            json = await reqestFaceDitection(publicUrl);
        }
        catch(err){
            next(err);
            return;
        }
        console.log(json);
        res.json(json);
        // res.status(200).send(publicUrl);
    });

    blobStream.end(req.file.buffer);
});


module.exports = router;