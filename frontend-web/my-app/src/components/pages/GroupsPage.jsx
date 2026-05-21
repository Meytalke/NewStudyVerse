import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Layout/Sidebar';
import GroupList from '../Groups/GroupList';
import CreateGroupForm from '../Groups/CreateGroupForm';
import AuthContext from '../contexts/AuthContext';
import './GroupsPage.css';
import Switch from 'react-switch';
import { useGroups } from '../contexts/GroupsContext';

const GroupsPage = () => {
  const { groups: contextGroups, loadingGroups, getGroups: contextGetGroups } = useGroups();
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchParams, setSearchParams] = useState({
    institution: '',
    courseCode: '',
    isPrivate: '',
    myGroups: false,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const filterGroups = useCallback(() => {
    let results = contextGroups; 

    if (searchParams.institution) {
      results = results.filter(group =>
        group.institution.toLowerCase().includes(searchParams.institution.toLowerCase())
      );
    }

    if (searchParams.courseCode) {
      results = results.filter(group =>
        group.courseCode.toLowerCase().includes(searchParams.courseCode.toLowerCase())
      );
    }

    if (searchParams.isPrivate !== '') {
      results = results.filter(
        group => group.isPrivate === (searchParams.isPrivate === 'true')
      );
    }

    if (searchParams.myGroups && user) {
      results = results.filter(group => group.creator === user.user_id);
    }

    setFilteredGroups(results);
  }, [contextGroups, searchParams, user]); 

  useEffect(() => {
  }, []); 

  useEffect(() => {
    filterGroups();
  }, [contextGroups, searchParams, filterGroups]);

  const handleSearchChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMyGroupsChange = (checked) => {
    setSearchParams(prev => ({
      ...prev,
      myGroups: checked
    }));
  };

  const handleClearSearch = () => {
    setSearchParams({
      institution: '',
      courseCode: '',
      isPrivate: '',
      myGroups: false,
    });
  };

  const toggleCreateForm = () => {
    if (!user) {
      navigate('/login', { state: { from: '/groups', message: 'You must be logged in to create a group' } });
      return;
    }
    const shouldShowForm = !showCreateForm;
    setShowCreateForm(shouldShowForm);
    setShowSearch(!shouldShowForm); 
  };

  return (
    <div className="groups-page">
      <div className="page-container">
        <Sidebar active="groups" />
        <main className="groups-main">
          <div className="page-header">
            <h1 className="page-title">Study Groups</h1>
            <button
              className="create-group-btn"
              onClick={toggleCreateForm}
            >
              {showCreateForm ? 'Cancel' : 'Create New Group'}
            </button>
          </div>

          {showCreateForm && (
            <div className="full-width-form-container">
              <CreateGroupForm
                onGroupCreated={(newGroup) => {
                  setShowCreateForm(false);
                  setShowSearch(true);
                }}
                onCancel={() => {
                  setShowCreateForm(false);
                  setShowSearch(true); 
                }}
              />
            </div>
          )}

          {!showCreateForm && (
            <div className="search-and-results">
              <div className="search-section">
                <form className="search-form">
                  <div className="form-group">
                    <label htmlFor="institution">Academic Institution</label>
                    <input
                      type="text"
                      id="institution"
                      name="institution"
                      value={searchParams.institution}
                      onChange={handleSearchChange}
                      placeholder="e.g., Tel Aviv University"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="courseCode">Course Code</label>
                    <input
                      type="text"
                      id="courseCode"
                      name="courseCode"
                      value={searchParams.courseCode}
                      onChange={handleSearchChange}
                      placeholder="e.g., CS101"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="isPrivate">Group Type</label>
                    <select
                      id="isPrivate"
                      name="isPrivate"
                      value={searchParams.isPrivate}
                      onChange={handleSearchChange}
                    >
                      <option value="">All</option>
                      <option value="false">Public</option>
                      <option value="true">Private</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="myGroupsSwitch" className="my-groups-label">My Groups</label>
                    <Switch
                      onChange={handleMyGroupsChange}
                      checked={searchParams.myGroups || false}
                      id="myGroupsSwitch"
                    />
                  </div>

                  <div className="search-buttons">
                    <button type="button" className="btn btn-secondary" onClick={handleClearSearch}>Clear</button>
                  </div>
                </form>
              </div>

              <div className="groups-results">
                {loadingGroups ? (
                  <div className="loading-spinner"></div>
                ) : filteredGroups.length > 0 ? (
                  <>
                    <GroupList groups={filteredGroups} />
                  </>
                ) : (
                  <div className="no-results">
                    <p>No groups matched your search.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GroupsPage;