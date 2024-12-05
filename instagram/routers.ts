import express from 'express';
import multer from 'multer';
const wa = express.Router();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './storage/instagram/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const uploads = multer({
    limits: { fileSize: 20 * 1024 * 1024 }, //20Mb
    storage: storage,
});