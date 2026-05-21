import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Sidebar from '../Layout/Sidebar';
import StatsChart from '../Dashboard/StatsChart';
import { useAuth } from '../contexts/AuthContext';
import { userService, statsService } from '../services/api';
import './DashboardPage.css';
import { useTranslation } from 'react-i18next'; // ייבוא ה-Hook

const DashboardPage = () => {
    const { t, i18n } = useTranslation(); // שימוש ב-translation
    const isRtl = i18n.language === 'he'; // בדיקה אם השפה היא עברית לעיצוב RTL
    const { user, loading: authLoading } = useAuth();

    const [userGroups, setUserGroups] = useState([]);
    const [userPosts, setUserPosts] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;

            setLoading(true);
            setError(null);
            try {
                const [groupsResponse, postsResponse, statsResponse] = await Promise.all([
                    userService.getUserGroups(user._id),
                    userService.getUserPosts(user._id),
                    statsService.getUserStats(user._id)
                ]);

                setUserGroups(groupsResponse.data);
                setUserPosts(postsResponse.data);
                setUserStats(statsResponse.data);
                setLoading(false);
            } catch (err) {
                console.error('DashboardPage Error:', err);
                setError(t('dashboard.error')); // תרגום שגיאה
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchDashboardData();
        }
    }, [user, authLoading, t]);

    if (!authLoading && !user) {
        return <Navigate to="/login" replace state={{ message: t('login.error.auth_required') }} />;
    }

    return (
        <div className={`dashboard-page ${isRtl ? 'rtl' : 'ltr'}`}>
            <div className="dashboard-content">
                <Sidebar active="dashboard" />
                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <h1 className="welcome-title">
                            {t('dashboard.title', { name: user?.username || 'Student' })}
                        </h1>
                        <p className="welcome-subtitle">{t('dashboard.subtitle')}</p>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>{t('dashboard.loading')}</p>
                        </div>
                    ) : error ? (
                        <div className="error-message">{error}</div>
                    ) : (
                        <>
                            <div className="dashboard-grid">
                                <div className="dashboard-card stats-overview">
                                    <h2>{t('dashboard.stats.title')}</h2>
                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-value">{userStats?.userGroupsCount || 0}</span> 
                                            <span className="stat-label">{t('dashboard.stats.groups')}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{userStats?.userPostsCount || 0}</span> 
                                            <span className="stat-label">{t('dashboard.stats.posts')}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{userStats?.totalComments || 0}</span>
                                            <span className="stat-label">{t('dashboard.stats.comments')}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-value">{userStats?.totalPostLikes || 0}</span>
                                            <span className="stat-label">{t('dashboard.stats.likes')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="dashboard-card activity-chart">
                                    <h2>{t('dashboard.activity.title')}</h2>
                                    <StatsChart
                                        type="userActivity"
                                        data={userStats?.activityOverTime || []}
                                    />
                                </div>

                                <div className="dashboard-card popular-content">
                                    <h2>{t('dashboard.popular.title')}</h2>
                                    {userStats?.popularPosts?.length > 0 ? (
                                        <div className="popular-posts-list">
                                            {userStats.popularPosts.map((post, index) => (
                                                <div key={post._id} className="popular-post-item">
                                                    <span className="post-rank">{index + 1}</span>
                                                    <div className="post-info">
                                                        <h3>{post.title}</h3>
                                                        <div className="post-meta-grid">
                                                            <div className="grid-label">{t('dashboard.stats.groups')}:</div>
                                                            <div className="grid-value">{post.group_name || 'N/A'}</div>

                                                            <div className="grid-label">{t('dashboard.stats.comments')}:</div>
                                                            <div className="grid-value">{post.comments || 0}</div> 

                                                            <div className="grid-label">{t('dashboard.stats.likes')}:</div>
                                                            <div className="grid-value">{post.likes || 0}</div>   
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-data-message">{t('dashboard.popular.no_data')}</p>
                                    )}
                                </div>

                                <div className="dashboard-card content-distribution">
                                    <h2>{t('dashboard.distribution.title')}</h2>
                                    <StatsChart
                                        type="contentDistribution"
                                        data={userStats?.contentDistribution || []}
                                    />
                                </div>
                            </div>

                            <div className="dashboard-recent-section">
                                <div className="dashboard-card recent-groups">
                                    <div className="card-header">
                                        <h2>{t('dashboard.my_groups.title')}</h2>
                                        <Link to="/groups" className="see-all-link">{t('dashboard.my_groups.see_all')}</Link>
                                    </div>

                                    {userGroups.length > 0 ? (
                                        <div className="recent-groups-grid">
                                            {userGroups.slice(0, 3).map(group => (
                                                <div key={group._id} className="recent-group-card">
                                                    <h3>{group.name}</h3>
                                                    <div className="group-meta">
                                                        <span className="institution-tag">{group.institution}</span>
                                                        <span className="course-tag">{group.course_code}</span>
                                                    </div>
                                                    <Link to={`/groups/${group._id}`} className="group-link">{t('dashboard.my_groups.view')}</Link>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-data-container">
                                            <p>{t('dashboard.my_groups.no_data')}</p>
                                            <Link to="/groups" className="btn btn-primary">{t('dashboard.my_groups.find')}</Link>
                                        </div>
                                    )}
                                </div>

                                <div className="dashboard-card recent-posts">
                                    <div className="card-header">
                                        <h2>{t('dashboard.recent_posts.title')}</h2>
                                    </div>

                                    {userPosts.length > 0 ? (
                                        <div className="recent-posts-list">
                                            {userPosts.slice(0, 5).map(post => (
                                                <div key={post._id} className="recent-post-item">
                                                    <div className="post-type-icon">
                                                        {post.type === 'summary' && '📚'}
                                                        {post.type === 'question' && '❓'}
                                                        {post.type === 'exercise' && '✏️'}
                                                        {post.type === 'resource' && '🔗'}
                                                        {post.type === 'Discussion' && '💬'}
                                                    </div>
                                                    <div className="post-info">
                                                        <h3>{post.title}</h3>
                                                        <div className="post-meta">
                                                            <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString(isRtl ? 'he-IL' : 'en-GB') : 'N/A'}</span>
                                                            <span>{t('dashboard.recent_posts.in_group', { groupName: post.groupId?.name || 'N/A' })}</span> 
                                                        </div>
                                                    </div>
                                                    <Link to={`/posts/${post._id}`} className="post-link">
                                                        <span className="view-icon">👁️</span>
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-data-container">
                                            <p>{t('dashboard.recent_posts.no_data')}</p>
                                            <Link to="/groups" className="btn btn-primary">{t('dashboard.recent_posts.find')}</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;