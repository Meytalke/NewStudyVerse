import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext'; 
import { usePosts } from '../contexts/PostsContext'; 
import { ArrowLeft } from 'lucide-react';
import './PostDetails.css'; 

import AddCommentForm from './AddCommentForm'; 
import CommentList from './CommentList'; 

const PostDetails = () => {
    const navigate = useNavigate();
    const { postId } = useParams(); 
    const { user } = useContext(AuthContext); 
    const [groupId, setGroupId] = useState(null); 

    const {
        currentPost,
        isLoadingCurrentPost,
        currentPostError,
        fetchPostDetails,
        toggleLike, 
        addComment, 
        toggleCommentLike, 
        updateComment, 
        deleteComment 
    } = usePosts();

    console.log('PostDetails rendered. postId:', postId, 'isLoadingCurrentPost:', isLoadingCurrentPost, 'currentPost (title):', currentPost?.title);
    console.log('PostDetails - currentPost.hasLiked:', currentPost?.hasLiked, 'currentPost.likesCount:', currentPost?.likesCount);
    console.log('Current logged-in user ID (user?._id):', user?.user_id); 

    useEffect(() => {
        console.log('PostDetails useEffect for fetching triggered.');
        if (postId) {
            console.log('PostDetails: Calling fetchPostDetails(', postId, ') unconditionally.');
            fetchPostDetails(postId);
        }
    }, [postId, fetchPostDetails]); 

    useEffect(() => {
        if (currentPost && currentPost._id === postId && currentPost.groupId) {
            console.log('currentPost and groupId available, setting groupId state:', currentPost.groupId);
            setGroupId(currentPost.groupId);
        } else if (currentPostError) {
            setGroupId(null); 
        }
    }, [currentPost, postId, currentPostError]);

    const handleTogglePostLike = async () => {
        if (!user) {
            alert('You must be logged in to like a post.');
            return;
        }
        try {
            await toggleLike(postId);
        } catch (error) {
            console.error('Error toggling like in PostDetails:', error);
            alert('Failed to update like status. Please try again.');
        }
    };

    const handleAddComment = async (commentText) => {
        if (!user) {
            alert('You must be logged in to add a comment.');
            return;
        }
        try {
            await addComment(postId, commentText);
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment. Please try again.');
        }
    };

    const handleToggleCommentLike = async (commentId) => {
        if (!user) {
            alert('You must be logged in to like a comment.');
            return;
        }
        try {
            await toggleCommentLike(postId, commentId);
        } catch (error) {
            console.error('Error toggling like for comment:', error);
            alert('Failed to like/unlike comment. Please try again.');
        }
    };

    const handleUpdateComment = async (commentId, newText) => {
        if (!user) {
            alert('You must be logged in to edit a comment.');
            return;
        }
        try {
            await updateComment(postId, commentId, newText);
        }
        catch (error) {
            console.error('Error updating comment in PostDetails:', error);
            alert('Failed to update comment. Please try again.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!user) {
            alert('You must be logged in to delete a comment.');
            return;
        }
        try {
            await deleteComment(postId, commentId); 
        }
        catch (error) {
            console.error('Error deleting comment in PostDetails:', error);
            alert('Failed to delete comment. Please try again.');
        }
    };

    if (isLoadingCurrentPost) {
        return <div className="post-details-container loading">Loading post details...</div>;
    }

    if (currentPostError || !currentPost || currentPost._id !== postId) {
        return <div className="post-details-container not-found">
            {currentPostError ? `Error: ${currentPostError}` : 'Post not found or still loading.'}
        </div>;
    }

    return (
        <div className="post-details-container">
            <div className="post-details-card">
                {groupId && (
                    <button
                        onClick={() => navigate(`/groups/${groupId}/dashboard`)}
                        className="back-button"
                    >
                        <ArrowLeft size={16} className="back-button-icon" /> Back to Posts
                    </button>
                )}
                <div className="post-header">
                    <h2 className="post-title">{currentPost.title}</h2>
                    <div className="post-meta">
                        {currentPost.author && (
                            <span className="post-author">
                                By: {currentPost.author.username || 'Unknown Author'}
                            </span>
                        )}
                        {currentPost.createdAt && (
                            <span className="post-date">
                                On: {new Date(currentPost.createdAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                <div className="post-content">
                    <p>{currentPost.content}</p>
                    {currentPost.mediaUrl && (
                        <div className="post-media">
                            {currentPost.mediaType === 'image' ? (
                                <img src={currentPost.mediaUrl} alt={currentPost.title} className="post-image" />
                            ) : currentPost.mediaType === 'video' ? (
                                <video controls src={currentPost.mediaUrl} className="post-video">
                                    Your browser does not support the video tag.
                                </video>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="post-footer">
                    <button
                        className={`like-btn ${currentPost.hasLiked ? 'liked' : ''}`}
                        onClick={handleTogglePostLike}
                    >
                        ❤️ {currentPost.likes ? currentPost.likes.length : 0} Likes
                    </button>
                </div>

                <div className="comments-section">
                    <h3>Comments</h3>
                    <AddCommentForm postId={postId} onCommentSubmit={handleAddComment} />

                    {currentPost.comments && currentPost.comments.length > 0 ? (
                        <CommentList
                            comments={currentPost.comments}
                            currentUserId={user?.user_id} 
                            onToggleCommentLike={handleToggleCommentLike}
                            onUpdateComment={handleUpdateComment}
                            onDeleteComment={handleDeleteComment} 
                        />
                    ) : (
                        <p>No comments yet. Be the first to comment!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostDetails;