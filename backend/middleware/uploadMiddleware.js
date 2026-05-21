const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2; 

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'studyverse_drive',
        resource_type: 'auto', // קריטי עבור PDF וקבצים שאינם תמונות
        access_mode: 'public', // מבטיח שהקובץ יהיה נגיש לצפייה
    },
});

const upload = multer({ storage: storage });
module.exports = upload;