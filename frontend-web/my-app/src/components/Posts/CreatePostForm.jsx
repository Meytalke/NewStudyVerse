import { useState, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import {ArrowLeft } from 'lucide-react';
import './CreatePostForm.css'; 

import { Upload, XCircle } from 'lucide-react';

const CreatePostForm = ({ onPostCreated }) => {
    const { user } = useContext(AuthContext);
    const { addPost } = usePosts();
    const { groupId } = useParams();
    const navigate = useNavigate(); 

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('summary');
    const [tags, setTags] = useState('');
    const [mediaFile, setMediaFile] = useState(null); // State for the selected file
    const [filePreview, setFilePreview] = useState(null); // State for file preview URL
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null); // Ref for clearing file input

    const allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (allowedFileTypes.includes(file.type)) {
                setMediaFile(file);
                setFilePreview(URL.createObjectURL(file)); // Create a URL for preview
                setError(''); 
            } else {
                setMediaFile(null);
                setFilePreview(null);
                setError('Unsupported file type. Please upload an image (JPG, PNG, GIF) or a short video (MP4, WebM, MOV).');
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''; 
                }
            }
        } else {
            setMediaFile(null);
            setFilePreview(null);
        }
    };

    const handleRemoveFile = () => {
        setMediaFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; 
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        if (!user) {
            setError('You must be logged in to create a post.');
            setIsSubmitting(false);
            return;
        }

        if (!groupId) {
            setError('Group ID is missing. Cannot create post.');
            setIsSubmitting(false);
            return;
        }

        // Create FormData to send text data and file
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('type', type);
        formData.append('tags', tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '').join(',')); // Filter out empty tags
        formData.append('groupId', groupId); // Associate post with the group
        formData.append('author', user.user_id); // Assuming user._id or user.id is available
        console.log('Media file before appending to FormData:', mediaFile);
        if (mediaFile) {
            formData.append('media', mediaFile); 
        }
        console.log('--- FormData Contents ---');
        for (let [key, value] of formData.entries()) {
            if (key === 'media' && value instanceof File) {
                console.log(`${key}: File Name: ${value.name}, Type: ${value.type}, Size: ${value.size} bytes`);
            } else {
                console.log(`${key}:`, value);
            }
        }
        console.log('--- End FormData Contents ---');
        try {
            const createdPost = await addPost(formData);
            navigate(`/groups/${groupId}/dashboard`);
            if (onPostCreated) {
                onPostCreated(createdPost);
            }

            // Clear form fields
            setTitle('');
            setContent('');
            setTags('');
            setMediaFile(null);
            setFilePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (err) {
            console.error('Error creating post:', err.response ? err.response.data : err.message);
            setError(err.response?.data?.message || 'Failed to create post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate(-1); // Navigate to the dashboard route
    };
    return (
        <div className="create-post-form-container">
            <button onClick={handleBack} className="back-button">
                    <ArrowLeft size={20} />
                    Back
            </button>
            <h2 className="form-title">Create New Post</h2>
            <form onSubmit={handleSubmit} className="post-form">
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Summary of Chapter 5, Question about Flexbox"
                        required
                        aria-label="Post Title"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content">Content</label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your post content here..."
                        rows="8"
                        required
                        aria-label="Post Content"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="type">Post Type</label>
                    <select
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        aria-label="Select Post Type"
                    >
                        <option value="summary">Summary 📚</option>
                        <option value="question">Question ❓</option>
                        <option value="exercise">Exercise ✏️</option>
                        <option value="resource">Resource 🔗</option> 
                        <option value="discussion">Discussion 💬</option> 
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="tags">Tags (comma separated)</label>
                    <input
                        id="tags"
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="e.g., react, javascript, css, algorithms"
                        aria-label="Post Tags"
                    />
                </div>

                <div className="form-group file-upload-group">
                    <label htmlFor="media">Upload Media (Image or Short Video)</label>
                    <input
                        id="media"
                        type="file"
                        accept="image/*,video/mp4,video/webm,video/quicktime" 
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        aria-label="Upload Image or Video"
                    />
                    {filePreview && (
                        <div className="file-preview">
                            {mediaFile && mediaFile.type.startsWith('image/') ? (
                                <img src={filePreview} alt="Media Preview" className="uploaded-media-preview" />
                            ) : (
                                <video src={filePreview} controls className="uploaded-media-preview">
                                    Your browser does not support the video tag.
                                </video>
                            )}
                            <button type="button" onClick={handleRemoveFile} className="remove-file-button">
                                <XCircle size={20} /> Remove
                            </button>
                        </div>
                    )}
                    {!filePreview && (
                        <p className="file-upload-hint">
                            <Upload size={18} /> Max file size: 10MB. Formats: JPG, PNG, GIF, MP4, WebM, MOV.
                        </p>
                    )}
                </div>

                <button type="submit" className="submit-button" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <span className="spinner"></span> Creating Post...
                        </>
                    ) : (
                        'Create Post'
                    )}
                </button>
            </form>
        </div>
    );
};

export default CreatePostForm;