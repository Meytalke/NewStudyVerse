import { useState } from 'react';
import './AddCommentForm.css'; 

const AddCommentForm = ({ postId, onCommentSubmit }) => {
    const [commentText, setCommentText] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) {
            alert('Comment cannot be empty.');
            return;
        }
        await onCommentSubmit(commentText); 
        setCommentText(''); 
    };

    return (
        <form onSubmit={handleSubmit} className="add-comment-form">
            <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows="3"
            ></textarea>
            <button type="submit">Post Comment</button>
        </form>
    );
};

export default AddCommentForm;