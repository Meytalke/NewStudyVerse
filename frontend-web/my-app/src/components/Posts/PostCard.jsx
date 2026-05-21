// import { useState, useContext } from 'react';
// import { Link } from 'react-router-dom';
// import AuthContext from '../contexts/AuthContext';
// import { postsService } from '../services/api';
// import './PostCard.css';

// const PostCard = ({ post, canDelete, onPostDeleted }) => {
//   const { user } = useContext(AuthContext);
//   const [showConfirmDelete, setShowConfirmDelete] = useState(false);
//   const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id));
//   const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
//   const [isExpanded, setIsExpanded] = useState(false);
  
//   const formatDate = (dateString) => {
//     const options = { 
//       year: 'numeric', 
//       month: 'long', 
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     };
//     return new Date(dateString).toLocaleDateString('en-US', options);
//   };

//   const getPostTypeIcon = () => {
//     switch (post.type) {
//       case 'summary':
//         return '📚';
//       case 'question':
//         return '❓';
//       case 'exercise':
//         return '✏️';
//       default:
//         return '📄';
//     }
//   };

//   const getPostTypeLabel = () => {
//     switch (post.type) {
//       case 'summary':
//         return 'Summary';
//       case 'question':
//         return 'Question';
//       case 'exercise':
//         return 'Exercise';
//       default:
//         return 'Post';
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       await postsService.deletePost(post._id);
//       if (onPostDeleted) {
//         onPostDeleted(post._id);
//       }
//     } catch (error) {
//       console.error('Error deleting post:', error);
//       alert('An error occurred while deleting the post');
//     }
//   };

//   const handleToggleLike = async () => {
//     if (!user) return;
    
//     try {
//       if (isLiked) {
//         await postsService.unlikePost(post._id);
//         setIsLiked(false);
//         setLikesCount(prev => prev - 1);
//       } else {
//         await postsService.likePost(post._id);
//         setIsLiked(true);
//         setLikesCount(prev => prev + 1);
//       }
//     } catch (error) {
//       console.error('Error toggling like:', error);
//     }
//   };

//   const toggleContent = () => {
//     setIsExpanded(!isExpanded);
//   };

//   const truncateContent = (content, maxLength = 200) => {
//     if (content.length <= maxLength) return content;
//     return content.substr(0, maxLength) + '...';
//   };

//   return (
//     <div className="post-card">
//       <div className="post-header">
//         <div className="post-meta">
//           <div className="post-type">
//             <span className="post-type-icon">{getPostTypeIcon()}</span>
//             <span className="post-type-label">{getPostTypeLabel()}</span>
//           </div>
//           <h2 className="post-title">{post.title}</h2>
//         </div>
        
//         <div className="post-actions">
//           {(canDelete || (user && post.author_id === user._id)) && (
//             <div className="delete-container">
//               {showConfirmDelete ? (
//                 <div className="confirm-delete">
//                   <span>Delete?</span>
//                   <button className="btn-confirm-yes" onClick={handleDelete}>Yes</button>
//                   <button className="btn-confirm-no" onClick={() => setShowConfirmDelete(false)}>No</button>
//                 </div>
//               ) : (
//                 <button 
//                   className="delete-btn" 
//                   onClick={() => setShowConfirmDelete(true)}
//                   aria-label="Delete post"
//                 >
//                   🗑️
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
      
//       <div className="post-author">
//         <img 
//           src={post.author_image || '/default-avatar.png'} 
//           alt={post.author_name || 'User'} 
//           className="author-image" 
//         />
//         <div className="author-info">
//           <span className="author-name">{post.author_name || 'User'}</span>
//           <span className="post-date">{formatDate(post.created_at)}</span>
//         </div>
//       </div>
      
//       <div className="post-content">
//         <div className={`post-text ${isExpanded ? 'expanded' : ''}`}>
//           {isExpanded ? post.content : truncateContent(post.content)}
//         </div>
        
//         {post.content.length > 200 && (
//           <button className="toggle-content-btn" onClick={toggleContent}>
//             {isExpanded ? 'Show Less' : 'Show More'}
//           </button>
//         )}
        
//         {post.tags && post.tags.length > 0 && (
//           <div className="post-tags">
//             {post.tags.map((tag, index) => (
//               <span key={index} className="tag">#{tag}</span>
//             ))}
//           </div>
//         )}
//       </div>
      
//       <div className="post-footer">
//         <div className="post-stats">
//           <button 
//             className={`like-btn ${isLiked ? 'liked' : ''}`}
//             onClick={handleToggleLike}
//             disabled={!user}
//           >
//             <span className="like-icon">❤️</span>
//             <span className="like-count">{likesCount}</span>
//           </button>
          
//           <div className="view-count">
//             <span className="view-icon">👁️</span>
//             <span>{post.views || 0}</span>
//           </div>
//         </div>
        
//         <Link to={`/posts/${post._id}`} className="view-details-btn">
//           View Full Post
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default PostCard;
