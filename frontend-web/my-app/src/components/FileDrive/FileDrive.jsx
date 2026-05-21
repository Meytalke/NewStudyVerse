import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, File as FileIcon, Eye, Image as ImageIcon } from 'lucide-react';
import './FileDrive.css';
import { filesService } from '../services/api';

const FileDrive = ({ groupId }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    // 1. Fetch group files on component load
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await filesService.getGroupFiles(groupId);
                setFiles(response.data);
            } catch (err) {
                console.error("Error fetching files:", err);
            }
        };
        fetchFiles();
    }, [groupId]);

    // Ensure URL is secure (HTTPS)
    const getSecureUrl = (url) => {
        if (!url) return '';
        return url.replace('http://', 'https://');
    };

    // Handle File Preview (Opens in a new tab)
    const handlePreview = (url) => {
        const secureUrl = getSecureUrl(url);
        
        // If it's a PDF, use Google Docs Viewer to bypass CORS/Browser issues
        if (url.toLowerCase().endsWith('.pdf')) {
            window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(secureUrl)}&embedded=true`, '_blank');
        } else {
            // For images and other files, open directly
            window.open(secureUrl, '_blank');
        }
    };

    // Handle File Download
    const handleDownload = async (url, fileName) => {
        const secureUrl = getSecureUrl(url);
        
        // Cloudinary trick: adding 'fl_attachment' forces the server to trigger a download
        const cloudinaryDownloadUrl = secureUrl.replace('/upload/', '/upload/fl_attachment/');

        try {
            const response = await fetch(secureUrl, { mode: 'cors' });
            if (!response.ok) throw new Error('Network response was not ok');
            
            const blob = await response.blob();
            if (blob.size === 0) throw new Error('Blob is empty');

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.warn("Direct download failed, redirecting to Cloudinary attachment link", error);
            // Fallback: Use the Cloudinary attachment URL if fetch fails
            window.location.href = cloudinaryDownloadUrl;
        }
    };

    // Handle File Upload
    const handleFileUpload = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('groupId', groupId);

        setUploading(true);
        try {
            const response = await filesService.uploadFile(groupId, formData);
            setFiles([response.data, ...files]); 
            alert("File uploaded successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to upload file. Please check server settings.");
        } finally {
            setUploading(false);
        }
    };

    // Helper to get icon based on file extension
    const getFileIcon = (fileName) => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) 
            return <ImageIcon size={24} color="#10b981" />;
        if (ext === 'pdf') 
            return <FileText size={24} color="#ef4444" />;
        return <FileIcon size={24} color="#6b7280" />;
    };

    return (
        <div className="file-drive-container">
            <div className="drive-header">
                <h3>Group Drive</h3>
                <label className="upload-label">
                    {uploading ? (
                        "Uploading..."
                    ) : (
                        <>
                            <Upload size={18} /> 
                            <span>Upload File</span>
                        </>
                    )}
                    <input 
                        type="file" 
                        onChange={handleFileUpload} 
                        disabled={uploading} 
                        hidden 
                    />
                </label>
            </div>

            <div className="files-grid">
                {files.length === 0 ? (
                    <p className="no-files">No files found. Start by uploading one!</p>
                ) : (
                    files.map((file) => (
                        <div key={file._id} className="file-card">
                            <div className="file-info">
                                {getFileIcon(file.name)}
                                <div className="file-details">
                                    <span className="file-name" title={file.name}>
                                        {file.name}
                                    </span>
                                    <span className="file-meta">
                                        {new Date(file.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="file-actions">
                                <button 
                                    className="action-btn" 
                                    onClick={() => handlePreview(file.url)} 
                                    title="View"
                                >
                                    <Eye size={18} />
                                </button>
                                <button 
                                    className="action-btn" 
                                    onClick={() => handleDownload(file.url, file.name)} 
                                    title="Download"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FileDrive;