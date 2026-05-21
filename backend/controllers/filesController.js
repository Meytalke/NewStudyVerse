const File = require('../models/File');

// ודאי שכתוב exports. לפני שם הפונקציה
exports.getGroupFiles = async (req, res) => {
    try {
        const files = await File.find({ groupId: req.params.groupId })
            .populate('uploadedBy', 'firstName lastName')
            .sort({ createdAt: -1 });
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching files' });
    }
};

exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const newFile = new File({
            name: req.file.originalname,
            url: req.file.path,
            type: req.file.mimetype,
            size: req.file.size,
            groupId: req.params.groupId,
            uploadedBy: req.user.id
        });

        await newFile.save();
        res.status(201).json(newFile);
    } catch (error) {
        res.status(500).json({ message: 'Error uploading file' });
    }
};

// ודאי שגם זו קיימת אם השתמשת בה ב-Router
exports.deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.fileId);
        if (!file) return res.status(404).json({ message: 'File not found' });
        
        await File.findByIdAndDelete(req.params.fileId);
        res.json({ message: 'File deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting file' });
    }
};