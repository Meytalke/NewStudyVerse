import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {Users, Calendar,BookOpen,ArrowLeft} from 'lucide-react';
import { useGroups } from '../contexts/GroupsContext';
import { useAuth } from '../contexts/AuthContext';
import './GroupDetails.css';

const GroupDetails = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getGroupById } = useGroups();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroupDetails = async () => {
      setIsLoading(true);
      try {
        const response = await getGroupById(groupId);
        console.log(response);
        setGroup(response);
      } catch (error) {
        console.error('Error fetching group details:', error);
        setGroup(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupDetails();
  }, [groupId, getGroupById]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="not-found-container">
        <div className="not-found-icon">😕</div>
        <h3 className="not-found-title">Group Not Found</h3>
        <p className="not-found-message">
          The group you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link to="/groups" className="back-to-groups-link">
          Back to Groups
        </Link>
      </div>
    );
  }

  const handleGoBack = () => {
    navigate('/groups');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="group-details-container ltr">
      <button onClick={handleGoBack} className="back-button">
        <ArrowLeft size={16} className="back-button-icon" /> Back to Groups
      </button>

      <div className="group-card">
        <div className="group-header">
          <h1 className="group-name">{group.name}</h1>
          <p className="group-description">{group.description}</p>
        </div>

        <div className="group-info">
          <div className="info-item">
            <BookOpen size={20} className="info-icon course-icon" />
            <span className="info-label">Course:</span> <span className="info-value course-value">{group.courseCode}</span>
          </div>

          <div className="info-item">
            <Users size={20} className="info-icon members-icon" />
            <span className="info-label">Members:</span> <span className="info-value members-value">{group.members?.length}</span>
          </div>

          <div className="info-item">
            <Calendar size={20} className="info-icon created-icon" />
            <span className="info-label">Created:</span> <span className="info-value created-value">{formatDate(group.createdAt)}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Admin:</span> <span className="info-value admin-value">{group.creator?.username}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Institution:</span> <span className="info-value institution-value">{group.institution}</span>
          </div>

          <div className="info-item">
            <span className="info-label">Privacy:</span> <span className="info-value privacy-value">{group.isPrivate ? 'Private' : 'Public'}</span>
          </div>
        </div>

        <div className="group-members">
            <h2 className="group-members-title">Members</h2>
            <div className="members-grid">
                {group?.members && Array.isArray(group.members) && group.members.length > 0 ? (
                    group.members.map((member) => (
                        <Link
                            key={member._id}
                            to={`/profile/${member._id}`}
                            className="member-link"
                        >
                            <div className="member-avatar">
                                {member.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="member-username">{member.username}</div>
                        </Link>
                    ))
                ) : (
                    <p className="no-members">No members in this group yet.</p>
                )}
            </div>
        </div>

        <div className="group-posts">
          <h2 className="group-posts-title">Posts</h2>
          <div>
            <p className="posts-count">Number of posts: <span className="posts-count-value">{group?.postCount !== undefined ? group.postCount : 0}</span></p>
            <Link
              to={`/groups/${group?._id}/dashboard`}
              className="view-posts-link"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;