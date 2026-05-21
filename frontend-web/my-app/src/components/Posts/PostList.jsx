import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PostsContext from '../contexts/PostsContext';
import AuthContext from '../contexts/AuthContext';
import './PostList.css';

const PostList = ({ posts }) => {
    const { toggleLike, deletePost, addComment, deleteComment,
         toggleCommentLike } = useContext(PostsContext); 
    const { user } = useContext(AuthContext); 
    const navigate = useNavigate();

    if (!posts || posts.length === 0) {
        return <div className="no-content-message">No posts found matching your criteria.</div>;
    }

    const handleViewPost = (postId) => {
        navigate(`/posts/${postId}`);
    };

    const handleToggleLike = async (postId) => {
        if (!user) {
            alert('You must be logged in to like a post.');
            return;
        }
        try {
            await toggleLike(postId);
        } catch (err) {
            console.error('Error toggling like:', err);
            alert(err.message || 'Failed to like/unlike post.');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!user) {
            alert('You must be logged in to delete a post.');
            return;
        }
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await deletePost(postId);
                alert('Post deleted successfully!');
            } catch (err) {
                console.error('Error deleting post:', err);
                alert(err.message || 'Failed to delete post.');
            }
        }
    };

    const handleEditPost = (postId) => {
        navigate(`/edit-post/${postId}`); 
    };


    console.log("PostList received posts. Count:", posts.length, "Posts:", posts);
    return (
        <div className="posts-list">
            {posts.map(post => (
                <div key={post._id} className="post-card">
                    <h3 className="post-card-title">{post.title}</h3>
                    <p className="post-card-meta">
                        By {post.author ? post.author.username : 'Unknown User'} on {new Date(post.createdAt).toLocaleDateString()}
                        {post.type && <span className="post-type"> ({post.type})</span>}
                    </p>
                    <p className="post-card-content">
                        {post.content ? post.content.substring(0, 200) : ''}
                        {post.content && post.content.length > 200 ? '...' : ''}
                        </p>

                    <div className="post-actions">
                        <button onClick={() => handleViewPost(post._id)} className="view-post-button">Read More</button>
                        <button
                            onClick={() => handleToggleLike(post._id)}
                            className={`like-button ${
                                user && post.likes && Array.isArray(post.likes) &&
                                post.likes.some(like => like._id === user.user_id)
                                    ? 'liked'
                                    : ''
                            }`}
                        >
                            <span className="heart-icon">❤️</span> {post.likes ? post.likes.length : 0} Likes
                        </button>
                        {user && post.author && user.user_id === post.author.user_id && (
                            <>
                                <button onClick={() => handleEditPost(post._id)} className="edit-post-button">Edit</button> 
                                <button onClick={() => handleDeletePost(post._id)} className="delete-post-button">Delete</button>
                            </>
                        )}
                    </div>

                    {post.mediaUrl && (
                        <div className="post-image-container">
                            {post.mediaType === 'image' ? (
                                <img src={post.mediaUrl} alt={post.title} className="post-image" />
                            ) : post.mediaType === 'video' ? (
                                <video controls src={post.mediaUrl} className="post-video">
                                    Your browser does not support the video tag.
                                </video>
                            ) : null}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PostList;