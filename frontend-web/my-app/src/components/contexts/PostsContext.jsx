import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { postsService,likesService,commentsService } from '../services/api'; 
import AuthContext from './AuthContext'; 

const PostsContext = createContext();

export const PostsProvider = ({ children, groupId = null }) => {
    const [posts, setPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [postsError, setPostsError] = useState(null);
    const [currentPost, setCurrentPost] = useState(null);
    const [isLoadingCurrentPost, setIsLoadingCurrentPost] = useState(false);
    const [currentPostError, setCurrentPostError] = useState(null);

    const { user } = useContext(AuthContext); 

    const fetchPosts = useCallback(async () => {
        if (!user) {
            setPostsError('Please log in to view posts.');
            setIsLoadingPosts(false);
            return;
        }

        setIsLoadingPosts(true);
        setPostsError(null);
        try {
            let response;
            if (groupId) {
                response = await postsService.getGroupPosts(groupId);
            } else {
                response = await postsService.getFeedPosts(); 
            }
            setPosts(response.data);
        } catch (err) {
            console.error('Error fetching posts:', err.response?.data || err.message);
            setPostsError(err.response?.data?.message || 'Failed to fetch posts.');
            setPosts([]); 
        } finally {
            setIsLoadingPosts(false);
        }
    }, [groupId, user]); 

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]); 

    const addPost = useCallback(async (formData) => { 
        setIsLoadingPosts(true); 
        setPostsError(null);
        try {
            const newPost = await postsService.createPost(formData);
            const createdGroupId = formData.get('groupId'); 
            if (!createdGroupId || createdGroupId === groupId) { 
                 setPosts(prevPosts => [newPost, ...prevPosts]);
            }
            
            setIsLoadingPosts(false); 
            return newPost; 
        } catch (err) {
            console.error('Error adding post:', err.response?.data || err.message);
            setPostsError(err.response?.data?.message || 'Failed to add post.');
            setIsLoadingPosts(false);
            throw err; 
        }
    }, [groupId, setPosts]);

    const updatePost = useCallback(async (postId, updatedData) => {
        try {
            const updatedPost = await postsService.updatePost(postId, updatedData);
            setPosts(prevPosts => prevPosts.map(post => 
                post._id === postId ? updatedPost : post
            ));
            if (currentPost && currentPost._id === postId) {
                setCurrentPost(updatedPost);
            }
            return updatedPost;
        } catch (err) {
            console.error('Error updating post:', err.response?.data || err.message);
            setPostsError(err.response?.data?.message || 'Failed to update post.');
            throw err;
        }
    }, [currentPost, posts, setPosts, setCurrentPost]); 


    const deletePost = useCallback(async (postId) => {
        try {
            await postsService.deletePost(postId);
            setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
            if (currentPost && currentPost._id === postId) {
                setCurrentPost(null);
            }
        } catch (err) {
            console.error('Error deleting post:', err.response?.data || err.message);
            setPostsError(err.response?.data?.message || 'Failed to delete post.');
            throw err;
        }
    }, [currentPost, posts, setPosts, setCurrentPost]); 


    const fetchPostDetails = useCallback(async (postIdToFetch) => {
    setIsLoadingCurrentPost(true);
    setCurrentPostError(null);

    try {
        const postFromContext = posts.find(p => p._id === postIdToFetch);
        if (postFromContext) {
            console.log(`PostsContext: Found post ${postIdToFetch} in existing posts array. Setting as currentPost.`);
            setCurrentPost(postFromContext);
            return postFromContext; 
        } else {
            console.log(`PostsContext: Post ${postIdToFetch} NOT found in posts array. Fetching from API.`);
            const response = await postsService.getPostById(postIdToFetch);
            setCurrentPost(response.data);
            return response.data; 
        }
    } catch (err) {
        console.error('Error fetching current post details:', err.response?.data || err.message);
        setCurrentPostError(err.response?.data?.message || 'Failed to fetch post details.');
        setCurrentPost(null);
        throw err; 
    } finally {
        setIsLoadingCurrentPost(false);
    }
}, [posts, setCurrentPost, setIsLoadingCurrentPost, setCurrentPostError]); 


    const toggleLike = useCallback(async (postId) => {
        if (!user) {
            alert('You must be logged in to like a post.');
            return;
        }
        try {
            let postToUpdate = null;
            if (currentPost && currentPost._id === postId) {
                postToUpdate = currentPost;
            } else {
                postToUpdate = posts.find(p => p._id === postId);
            }
            
            if (!postToUpdate) {
                console.warn(`PostsContext: Post with ID ${postId} not found in state for like toggle. Cannot proceed.`);
                throw new Error('Post data not available for like/unlike. Please try refreshing.');
            }

            let response = await likesService.toggleLike('post', postId); 
            const updatedPost = response.data; 
            console.log('PostsContext: Updated post received from API (after .data access):', updatedPost);

            if (!updatedPost || !updatedPost.title || !updatedPost.content || !updatedPost.createdAt || !updatedPost.author) {
                console.error('PostsContext: Received updatedPost is incomplete even after .data access!', updatedPost);
                throw new Error('Incomplete post data received from server after like. Please refresh.');
            }

            if (currentPost && currentPost._id === postId) {
                setCurrentPost(updatedPost);
            }
            
            setPosts(prevPosts => {
                const newPosts = prevPosts.map(p => 
                    p._id === postId ? updatedPost : p
                );
                console.log('PostsContext: New posts array after toggleLike update:', newPosts);
                return newPosts;
            });
            
            return updatedPost;
        } catch (err) {
            console.error('PostsContext: Error toggling like:', err.response?.data || err.message);
            throw err;
        }
    }, [user, currentPost, posts, setPosts, setCurrentPost]);

    const addComment = useCallback(async (postId, text) => {
        if (!user) {
            throw new Error('You must be logged in to comment.');
        }
        try {
            console.log('PostsContext: Attempting to add comment:', text, 'to postId:', postId);
            const res = await commentsService.addComment(postId, user.user_id, text); 
            const updatedPost = res.data;
            
            console.log('PostsContext: Received updatedPost from backend after adding comment:', updatedPost);
            if (currentPost && currentPost._id === postId) {
                console.log('PostsContext: Updating currentPost with new data.');
                setCurrentPost(updatedPost);
            } else {
                console.log('PostsContext: Not updating currentPost (either not set or different postId).');
            }

            setPosts(prevPosts => {
                console.log('PostsContext: Updating main posts list.');
                const newPosts = prevPosts.map(p => {
                    if (p._id === postId) {
                        console.log('PostsContext: Found matching post in list, replacing with updatedPost.');
                        return updatedPost;
                    }
                    return p;
                });
                console.log('PostsContext: New posts list state:', newPosts);
                return newPosts;
            });
            return updatedPost;
        } catch (err) {
            console.error('PostsContext: Error adding comment:', err.response?.data || err.message);
            throw err;
        }
    }, [user, currentPost, posts, setPosts, setCurrentPost]);


    const _populatePostData = useCallback((data) => {
    const processSinglePost = (post) => {
        if (!post) return null;

        const newPost = {
            ...post,
            hasLiked: user ? post.likes.some(like => like.user_id === user._id) : false,
            likesCount: post.likes ? post.likes.length : 0,
            comments: post.comments.map(comment => ({
                ...comment,
                hasLiked: user ? comment.likes.some(like => like.user_id === user._id) : false,
                likesCount: comment.likes ? comment.likes.length : 0,
                user: comment.user ? { ...comment.user, user_id: comment.user._id || comment.user.user_id } : comment.user
            }))
        };
        return newPost;
    };

    if (Array.isArray(data)) {
        return data.map(processSinglePost);
    } else {
        return processSinglePost(data);
    }
}, [user]); 

const deleteComment = useCallback(async (postId, commentId) => {
    if (!user) {
        throw new Error('You must be logged in to delete a comment.');
    }
    try {
        console.log(`PostsContext: Attempting to delete comment ${commentId} from post ${postId}`);
        const response = await commentsService.deleteComment(commentId);
        const updatedPost = _populatePostData(response.data);

        console.log('PostsContext: Received updatedPost from backend after deleting comment:', updatedPost);

        if (currentPost && currentPost._id === postId) {
            console.log('PostsContext: Updating currentPost with new data.');
            setCurrentPost(updatedPost);
        } else {
            console.log('PostsContext: Not updating currentPost (either not set or different postId).');
        }
        setPosts(prevPosts => {
            console.log('PostsContext: Updating main posts list.');
            const newPosts = prevPosts.map(p =>
                p._id === postId ? updatedPost : p
            );
            console.log('PostsContext: New posts list state:', newPosts);
            return newPosts;
        });
        return updatedPost;
    } catch (err) {
        console.error('PostsContext: Error deleting comment:', err.response?.data || err.message);
        throw err;
    }
}, [user, currentPost, _populatePostData]); 

const updateComment = useCallback(async (postId, commentId, newText) => {
    if (!user) {
        throw new Error('You must be logged in to update a comment.');
    }
    try {
        console.log(`PostsContext: Attempting to update comment ${commentId} on post ${postId} with text: "${newText}"`);
        const response = await commentsService.updateComment(commentId, { text: newText });
        const updatedPost = _populatePostData(response.data);

        console.log('PostsContext: Received updatedPost from backend after updating comment:', updatedPost);

        if (currentPost && currentPost._id === postId) {
            console.log('PostsContext: Updating currentPost with new data.');
            setCurrentPost(updatedPost);
        } else {
            console.log('PostsContext: Not updating currentPost (either not set or different postId).');
        }

        setPosts(prevPosts => {
            console.log('PostsContext: Updating main posts list.');
            const newPosts = prevPosts.map(p =>
                p._id === postId ? updatedPost : p
            );
            console.log('PostsContext: New posts list state:', newPosts);
            return newPosts;
        });
        return updatedPost;
    } catch (error) {
        console.error('PostsContext: Error updating comment:', error.response?.data || error.message);
        throw error;
    }
}, [user, currentPost, _populatePostData]);

    const toggleCommentLike = useCallback(async (postId, commentId) => {
        if (!user) {
            alert('You must be logged in to like a comment.');
            return;
        }
        try {
            console.log('PostsContext: Attempting to toggle like for commentId:', commentId, 'on postId:', postId);
            const res = await likesService.toggleLike('comment', commentId);
            const updatedPost = res.data;
            console.log('PostsContext: Received updatedPost from backend after toggling comment like:', updatedPost);

            if (currentPost && currentPost._id === postId) {
                console.log('PostsContext: Updating currentPost with new data.');
                setCurrentPost(updatedPost);
            } else {
                console.log('PostsContext: Not updating currentPost (either not set or different postId).');
            }
            
            setPosts(prevPosts => {
                console.log('PostsContext: Updating main posts list.');
                const newPosts = prevPosts.map(p => {
                    if (p._id === postId) {
                        console.log('PostsContext: Found matching post in list, replacing with updatedPost.');
                        return updatedPost;
                    }
                    return p;
                });
                console.log('PostsContext: New posts list state:', newPosts);
                return newPosts;
            });
            
            return updatedPost;
        } catch (err) {
            console.error('PostsContext: Error toggling like for comment:', err.response?.data || err.message);
            throw err;
        }
    }, [user, currentPost, posts, setPosts, setCurrentPost]);

    const contextValue = {
        posts,
        isLoadingPosts,
        postsError,
        fetchPosts, 
        addPost,
        updatePost,
        deletePost,   
        currentPost,
        isLoadingCurrentPost,
        currentPostError,
        fetchPostDetails,
        
        toggleLike,    
        addComment, 
        updateComment,
        deleteComment,
        toggleCommentLike
    };

    return (
        <PostsContext.Provider value={contextValue}>
            {children}
        </PostsContext.Provider>
    );
};

export const usePosts = () => {
    return useContext(PostsContext);
};

export default PostsContext;