import { useState, useEffect, useCallback, useContext } from 'react';
import { usePosts } from '../contexts/PostsContext'; 
import AuthContext from '../contexts/AuthContext'; 
import Switch from 'react-switch';
import { postType } from '../utils/types';

const PostFilterAndSearch = ({ setFilteredPosts }) => {
    const { posts, isLoadingPosts } = usePosts(); 
    const { user } = useContext(AuthContext); 

    const [searchParams, setSearchParams] = useState({
        title: '',
        tags: '',
        postType: '',
        myPosts: false,
    });

    const applyFilters = useCallback(() => {
        console.log("--- Applying Filters ---");
        console.log("Current Posts:", posts); 
        console.log("Search Params:", searchParams); 
        console.log("Current User:", user);
        let results = posts;

        if (searchParams.myPosts && user) {

            console.log("Filtering by My Posts. user._id:", user._id);
            console.log("Filtering by My Posts. user.id:", user.id);
            console.log("Filtering by My Posts. user.user_id:", user.user_id);

            results = results.filter(post => {
                console.log("Filtering by My Posts. post.author:", post.author);
                return post.author && (post.author.user_id === user.user_id);
            });
            console.log("My Posts Filtered Results Count:", results.length);
        }

        if (searchParams.postType) {
            console.log("Filtering by Post Type:", searchParams.postType);
            results = results.filter(post => post.type === searchParams.postType);
            console.log("Post Type Filtered Results Count:", results.length);
        }

        if (searchParams.title) {
            const searchTerm = searchParams.title.toLowerCase();
            console.log("Filtering by Title/Content. Search Term:", searchTerm);
            results = results.filter(post => 
                post.title.toLowerCase().includes(searchTerm) ||
                (post.content && post.content.toLowerCase().includes(searchTerm)) 
            );
            console.log("Title Filtered Results Count:", results.length);
        }

        if (searchParams.tags) {
            const searchTags = searchParams.tags.toLowerCase().split(',').map(tag => tag.trim()).filter(tag => tag);
            console.log("Filtering by Tags. Search Tags:", searchTags);
            if (searchTags.length > 0) {
                results = results.filter(post => 
                    post.tags && Array.isArray(post.tags) && post.tags.some(tag => 
                        searchTags.some(st => String(tag).toLowerCase().includes(st))
                    )
                );
                console.log("Tags Filtered Results Count:", results.length);
            }
        }
        console.log("Final Filtered Posts Count:", results.length);
        setFilteredPosts(results); 
    }, [posts, searchParams, user, setFilteredPosts]);

    useEffect(() => {
        applyFilters();
    }, [posts, searchParams, applyFilters]);

    const handleSearchChange = (e) => {
        const { name, value } = e.target;
        console.log(`Input changed: ${name}, Value: ${value}`); 
        setSearchParams(prevParams => ({
            ...prevParams,
            [name]: value,
        }));
    };

    const handleMyPostsToggle = () => {
        console.log("My Posts Toggle clicked!");
        setSearchParams(prevParams => ({
            ...prevParams,
            myPosts: !prevParams.myPosts,
        }));
    };

    const handleClearSearch = () => {
        setSearchParams({
            title: '',
            tags: '',
            postType: '',
            myPosts: false,
        });
    };

    return (
        <div className="post-search-section">
            <form className="post-search-form">
                <div className="form-group">
                    <label htmlFor="postType">Post Type</label>
                    <select
                        id="postType"
                        name="postType"
                        value={searchParams.postType}
                        onChange={handleSearchChange}
                        className="post-filter-select"
                    >
                        {postType.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="title">Title / Content</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={searchParams.title}
                        onChange={handleSearchChange}
                        placeholder="Search by title or content"
                        className="post-search-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="tags">Tags (comma separated)</label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={searchParams.tags}
                        onChange={handleSearchChange}
                        placeholder="e.g., react, javascript"
                        className="post-search-input"
                    />
                </div>
                
                <div className="form-group my-posts-toggle">
                    <label htmlFor="myPostsToggle" className="my-posts-label">My Posts</label>
                    <Switch
                        id="myPostsToggle" 
                        onChange={handleMyPostsToggle} 
                        checked={searchParams.myPosts || false} 
                    />
                </div>

                <div className="search-buttons">
                    <button type="button" className="btn btn-secondary clear-button" onClick={handleClearSearch}>Clear Filters</button>
                </div>
            </form>
            {isLoadingPosts && <p className="loading-message">Loading all posts for filtering...</p>}
        </div>
    );
};

export default PostFilterAndSearch;