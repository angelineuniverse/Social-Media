import express from 'express';
import WhatsAppConnection from './controller.ts';
import multer from 'multer';
const wa = express.Router();
const _whatsapp: any = new WhatsAppConnection();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './storage/whatsapp/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const uploads = multer({
    limits: { fileSize: 5 * 1024 * 1024 }, //5Mb
    storage: storage,
});

wa.get('/init', _whatsapp.scanned);
wa.get('/logout', _whatsapp.logout);
wa.post('/host', _whatsapp.host);
wa.get('/onMessage', _whatsapp.onMessage)
wa.get('/getAllChat', _whatsapp.getAllChats);
wa.post('/sendMessage', uploads.array('file',5), _whatsapp.sendMessage);
wa.post('/getMessage', _whatsapp.getMessages);

wa.get('/profile/name', _whatsapp.getName);
wa.post('/profile/name', _whatsapp.setName);
wa.get('/profile/status', _whatsapp.getStatus);
wa.post('/profile/status', _whatsapp.setStatus);
wa.delete('/profile/remove', _whatsapp.removePicture);
wa.post('/profile/setPicture', uploads.single('file'),_whatsapp.setPicture);

wa.get('/label/all', _whatsapp.getAllLabel);
wa.post('/label/add', _whatsapp.addLabel);
wa.post('/label/onUpdate', _whatsapp.onUpdateLabel);
wa.post('/label/addOrRemove', _whatsapp.addOrRemoveLabel);
wa.post('/label/delete', _whatsapp.deleteLabel);

wa.get('/contact/all', _whatsapp.allContact);
wa.post('/contact/detail', _whatsapp.getContact);
wa.post('/contact/valid', _whatsapp.getValidContact);

wa.post('/status/imagecaption',uploads.array('file',5),_whatsapp.addImageWithCaption);
wa.post('/status/text',_whatsapp.addText);
wa.post('/status/video',uploads.array('file',5),_whatsapp.addVideo);


export default wa;