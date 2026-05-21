import { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroups } from '../contexts/GroupsContext'; 
import AuthContext from '../contexts/AuthContext';
import { PostsProvider } from '../contexts/PostsContext';
import PostFilterAndSearch from '../Posts/PostFilterAndSearch'; 
import PostList from '../Posts/PostList'; 
import { 
    Users, MessageSquare, Calendar, Unlock, BookOpen, 
    PlusCircle, Settings, LogOut, Trash2, Video // הוספת Video
} from 'lucide-react';
import './GroupDashboardPage.css';
import FileDrive from '../FileDrive/FileDrive';
const GroupDashboardPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { getGroupById, isUserInGroup, isGroupOwner, leaveGroup, deleteGroup,getGroups } = useGroups();
    
    const [filteredPosts, setFilteredPosts] = useState([]); 

    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');

    useEffect(() => {
        const fetchGroupData = async () => {
            setLoading(true);
            setError(null);
            try {
                const fetchedGroup = await getGroupById(groupId);
                setGroup(fetchedGroup);
                console.log("Group:", group);

                if (user && fetchedGroup) {
                    const currentUserIsMember = isUserInGroup(fetchedGroup);
                    const currentUserIsOwner = isGroupOwner(fetchedGroup);

                    if (!currentUserIsMember && !currentUserIsOwner) {
                        navigate(`/groups/${groupId}`); 
                        return;
                    }
                } else if (!user) {
                    navigate('/login', { state: { message: 'You must be logged in to view group content.' } });
                    return;
                }

            } catch (err) {
                console.error('Error loading group:', err.response ? err.response.data : err.message);
                setError(err.response?.data?.message || 'Failed to load group data.');
                if (err.response?.status === 404 || err.response?.data?.message.includes('Not authorized')) {
                    navigate('/groups');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchGroupData();
    }, [groupId, user, getGroupById, isUserInGroup, isGroupOwner, navigate]);

    const handleLeaveGroup = async () => {
        if (window.confirm("Are you sure you want to leave this group?")) {
            try {
                const userIdToUse = user._id || user.id;
                if (!userIdToUse) {
                    alert('User ID not found. Please log in again.');
                    return;
                }
                await leaveGroup(groupId, userIdToUse);
                alert('You have left the group.');
                getGroups();
                navigate('/groups');
            } catch (err) {
                console.error('Error leaving group:', err);
                alert(err.response?.data?.message || 'Failed to leave group.');
            }
        }
    };

    const handleDeleteGroup = async () => {
        if (window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
            try {
                await deleteGroup(groupId);
                alert('Group deleted successfully!');
                navigate('/groups');
            } catch (err) {
                console.error('Error deleting group:', err);
                alert(err.response?.data?.message || 'Failed to delete group.');
            }
        }
    };

    const handleCreatePost = () => {
        navigate(`/groups/${groupId}/create-post`);
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading group...</p>
        </div>
    );
    if (error) return <div className="error-message">Error: {error}</div>;
    if (!group) return null; 

    const currentUserIsMember = isUserInGroup(group);
    const currentUserIsOwner = isGroupOwner(group);

    if (!currentUserIsMember && !currentUserIsOwner) {
        return <div className="unauthorized-message">You are not authorized to view this group's content.</div>;
    }

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-GB', options);
    };

    const handleJoinStudyRoom = () => {
        navigate(`/study-room/${groupId}`);
    };

    return (
        <div className="group-dashboard-container" dir="ltr">
            <header className="group-dashboard-header">
                <button onClick={() => navigate('/groups')} className="back-button">
                    &larr; Back to all Groups
                </button>
                <h1 className="group-title">{group.name}</h1>
                <div className="header-actions">
                    {currentUserIsOwner && (
                        <button onClick={() => navigate(`/groups/${groupId}/settings`)} className="header-action-button">
                            <Settings size={20} /> Settings
                        </button>
                    )}
                    {/*( TODO
                         <button onClick={() => alert('Feature to request ownership coming soon!')} className="header-action-button request-ownership-button">
                             Want to be Owner?
                         </button>
                     ) */}
                    {currentUserIsMember && !currentUserIsOwner && (
                        <button onClick={handleLeaveGroup} className="header-action-button leave-button">
                            <LogOut size={20} /> Leave Group
                        </button>
                    )}
                    {currentUserIsOwner && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="header-action-button delete-button">
                            <Trash2 size={20} /> Delete Group
                        </button>
                    )}
                </div>
            </header>

            {showDeleteConfirm && (
                <div className="delete-confirm-modal-overlay">
                    <div className="delete-confirm-modal">
                        <p>Are you sure you want to delete "{group.name}"? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button onClick={handleDeleteGroup} className="confirm-delete-btn">Yes, Delete</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="cancel-delete-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="group-info-section">
                <div className="study-room-banner" onClick={handleJoinStudyRoom} style={{
                    cursor: 'pointer',
                    background: 'rgba(16, 185, 129, 0.08)', // רקע בהיר מאוד
                    border: '1.5px solid #10b981',
                    padding: '8px 20px', // קטן יותר אנכית, רחב יותר אופקית
                    borderRadius: '50px', // הופך את זה לצורה של קפסולה/עיגול
                    marginBottom: '20px',
                    display: 'inline-flex', 
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease', 
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)', // צל ירוק עדין
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                }}>
                    <div style={{ background: '#10b981', padding: '10px', borderRadius: '50%', color: 'white' }}>
                        <Video size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: '#065f46' }}>Live Study Session</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#065f46' }}>Click to join the video chat with your group members.</p>
                    </div>
                </div>
            <p className="group-description">{group?.description}</p> 
            <div className="group-info-section">
                <p className="group-description">{group?.description}</p> 
                <div className="group-meta">
                    <span><BookOpen size={16} /> {group?.courseCode}</span>
                    <span><Unlock size={16} /> {group?.institution}</span>
                    <span>
                        <Users size={16} />
                        {console.log("[GroupComponent] Members count:", group?.members ? group.members.length : 0)}
                        {group?.members ? group.members.length : 0} Members
                    </span>
                    <span>
                        <MessageSquare size={16} />
                        {console.log("[GroupComponent] Post count:", group?.postCount !== undefined ? group.postCount : 0)}
                        {group?.postCount !== undefined ? group.postCount : 0} Posts
                    </span>
                    <span>
                        <Calendar size={14} />
                        {console.log("[GroupComponent] Created at:", group?.createdAt)}
                        {formatDate(group?.createdAt)}
                    </span>
                </div>
            </div>
        </div>

            <nav className="group-dashboard-nav">
                <button
                    className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    <MessageSquare size={18} /> Posts
                </button>
                <button className={`nav-item ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
                    <BookOpen size={18} /> Drive
                </button>
                {/* <button
                    className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('events')}
                    disabled 
                >
                    <Calendar size={18} /> Events
                </button> */}
            </nav>

            <div className="group-content">
                {activeTab === 'posts' && (
                    <PostsProvider groupId={groupId}> 
                        <button onClick={handleCreatePost} className="create-post-button">
                            <PlusCircle size={20} /> Create New Post
                        </button>
                        <PostFilterAndSearch setFilteredPosts={setFilteredPosts} />

                        
                        <h2 className="content-section-title">Latest Posts</h2>
                        <PostList posts={filteredPosts} /> 
                    </PostsProvider>
                )}

                {activeTab === 'files' && <FileDrive groupId={groupId} />}
                {/* {activeTab === 'events' && (
                    <>
                        <h2 className="content-section-title">Upcoming Events</h2>
                        <div className="no-content-message">No upcoming events scheduled.</div>
                        <button className="create-event-button">
                            <PlusCircle size={20} /> Create New Event
                        </button>
                    </>
                )} */}
            </div>
        </div>
    );
};

export default GroupDashboardPage;