import { useState } from 'react';
import { Edit, Trash2, Save, XCircle } from 'lucide-react'; 
import './CommentList.css'; 

const CommentList = ({ comments, currentUserId, onToggleCommentLike, onUpdateComment, onDeleteComment }) => {
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState(''); 

    if (!comments || comments.length === 0) {
        return <p>No comments yet.</p>;
    }

    const handleEditClick = (comment) => {
        setEditingCommentId(comment._id);
        setEditingCommentText(comment.text);
    };

    const handleSaveEdit = async (commentId) => {
        if (editingCommentText.trim() === '') {
            alert('Comment cannot be empty!'); 
            return;
        }
        try {
            await onUpdateComment(commentId, editingCommentText);
            setEditingCommentId(null); 
            setEditingCommentText('');
        } catch (error) {
            alert('Failed to update comment. Please try again.');
        }
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingCommentText('');
    };

    const handleDeleteClick = async (commentId) => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await onDeleteComment(commentId);
            } catch (error) {
                alert('Failed to delete comment. Please try again.');
            }
        }
    };

    return (
        <div className="comment-list">
            {comments.map(comment => (
                <div key={comment._id} className="comment-item">
                    <div className="comment-header">
                        <span className="comment-author">
                            {comment.user ? comment.user.username : 'Unknown User'}
                        </span>
                        <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    {editingCommentId === comment._id ? (
                        <div className="comment-edit-form">
                            <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows="3"
                                className="comment-edit-textarea"
                            />
                            <div className="comment-edit-actions">
                                <button onClick={() => handleSaveEdit(comment._id)} className="icon-button">
                                    <Save size={18} /> 
                                </button>
                                <button onClick={handleCancelEdit} className="icon-button">
                                    <XCircle size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="comment-text">{comment.text}</p>
                    )}

                    <div className="comment-actions">
                        <button
                            onClick={() => onToggleCommentLike(comment._id)}
                            className={`comment-like-button ${comment.hasLiked ? 'liked' : ''}`}
                        >
                            👍 {comment.likesCount || 0}
                        </button>

                        {currentUserId && comment.user && comment.user.user_id && currentUserId.toString() === comment.user.user_id.toString() && (
                            <>
                                {editingCommentId !== comment._id && (
                                    <button onClick={() => handleEditClick(comment)} className="icon-button">
                                        <Edit size={18} />
                                    </button>
                                )}
                                <button onClick={() => handleDeleteClick(comment._id)} className="icon-button">
                                    <Trash2 size={18} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CommentList;