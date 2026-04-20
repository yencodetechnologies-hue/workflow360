const multer = require('multer');
const { storage } = require('../config/cloudinary');

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 } // 5MB limit
}).single('image');

const uploadImage = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).json({ message: err.message || err });
        } else {
            if (req.file == undefined) {
                res.status(400).json({ message: 'No file selected!' });
            } else {
                res.status(200).json({
                    message: 'File uploaded to Cloudinary!',
                    filePath: req.file.path // Cloudinary URL
                });
            }
        }
    });
};

module.exports = {
    uploadImage
};
