import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext'; 
import './EditPost.css'; 
import { ArrowLeft,Upload, XCircle, Image as ImageIcon, Video } from 'lucide-react'; 

const EditPost = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { fetchPostDetails, updatePost } = usePosts(); 

    const [groupId, setGroupId] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('summary');
    const [tags, setTags] = useState('');
    const [mediaFile, setMediaFile] = useState(null); // For new file upload
    const [filePreview, setFilePreview] = useState(null); // For displaying existing/new media
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [originalAuthorId, setOriginalAuthorId] = useState(null);
    const [loading, setLoading] = useState(true);

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

    // Effect for loading post data 
    useEffect(() => {
        const loadPostData = async () => {
            try {
                setLoading(true);
                setError(null);

                const fetchedPostData = await fetchPostDetails(postId); 
                if (!fetchedPostData) {
                    setError("Post not found or could not be loaded.");
                    setLoading(false);
                    return;
                }

                setGroupId(fetchedPostData.groupId)
                setTitle(fetchedPostData.title);
                setContent(fetchedPostData.content);
                setType(fetchedPostData.type || 'summary');
                setTags(fetchedPostData.tags ? fetchedPostData.tags.join(', ') : '');
                
                if (fetchedPostData.mediaUrl) { 
                    setFilePreview(fetchedPostData.mediaUrl);
                } else {
                    setFilePreview(null); 
                }

                setOriginalAuthorId(fetchedPostData.author); // Store original author ID

            } catch (err) {
                console.error("Failed to load post for editing:", err);
                setError(err.response?.data?.message || "Failed to load post for editing. Please try again.");
                navigate(`/groups/${groupId}/dashboard`);  
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            loadPostData();
        }
    }, [postId, navigate, user, fetchPostDetails]); 

    // Form Submission Handler 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        // Create FormData to send text data and file (if any)
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('type', type);
        formData.append('tags', tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '').join(','));
        
        const shouldAppendRemoveMedia = (filePreview === null);
        console.log(`Condition for appending 'removeMedia': (filePreview === null && originalAuthorId !== null) = ${shouldAppendRemoveMedia}`);
        if (mediaFile) {
        formData.append('media', mediaFile);
        console.log('Frontend: Appending mediaFile to formData.');
        } else if (shouldAppendRemoveMedia) { 
            formData.append('removeMedia', 'true');
            console.log('Frontend: Appending removeMedia: "true" to formData.'); 
        } else {
            console.log('Frontend: Neither new media nor removeMedia flag appended. Keeping existing media state.');
        }
        try {
            await updatePost(postId, formData); 
            alert('Post updated successfully!');
            navigate(`/groups/${groupId}/dashboard`); 
        } catch (err) {
            console.error('Error updating post:', err.response ? err.response.data : err.message);
            setError(err.response?.data?.message || 'Failed to update post. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="edit-post-container">Loading post...</div>;
    }

    if (error) {
        return <div className="edit-post-container error-message">{error}</div>;
    }
    
    //Check for authorization
    if (!user) {
        return <div className="edit-post-container unauthorized-message">You are not authorized to edit this post.</div>;
    }

    return (
        <div className="edit-post-container">
            {groupId && (
                    <button
                        onClick={() => navigate(`/groups/${groupId}/dashboard`)}
                        className="back-button"
                    >
                        <ArrowLeft size={16} className="back-button-icon" /> Back to Posts
                    </button>
                )}
            <h2 className="form-title">Edit Post</h2>
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
                        <option value="general">General 📄</option> 
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
                            {filePreview.startsWith('data:') || mediaFile ? ( 
                                mediaFile && mediaFile.type.startsWith('image/') ? (
                                    <img src={filePreview} alt="Media Preview" className="uploaded-media-preview" />
                                ) : (
                                    <video src={filePreview} controls className="uploaded-media-preview">
                                        Your browser does not support the video tag.
                                    </video>
                                )
                            ) : ( // Existing URL from backend
                                filePreview.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    <img src={filePreview} alt="Current Media" className="uploaded-media-preview" />
                                ) : (
                                    <video src={filePreview} controls className="uploaded-media-preview">
                                        Your browser does not support the video tag.
                                    </video>
                                )
                            )}
                            <button type="button" onClick={handleRemoveFile} className="remove-file-button">
                                <XCircle size={20} /> Remove Media
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
                            <span className="spinner"></span> Saving Changes...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>          
            </form>
        </div>
    );
};

export default EditPost;