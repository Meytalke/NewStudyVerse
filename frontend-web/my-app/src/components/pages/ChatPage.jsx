import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import ChatWindow from '../Chat/ChatWindow';
import { Plus, ArrowLeft, X } from 'lucide-react'; 
import { format } from 'date-fns';
import { chatsService, userService } from '../services/api'; 

import './ChatPage.css'; 
import { useNavigate } from 'react-router-dom'; 

const ChatPage = () => {
    const { currentUser, isAuthenticated, loading: authLoading } = useAuth();
    const { 
        conversations, loadingConversations, conversationsError, 
        selectChat, activeChatId,
        fetchConversations, 
    } = useChat();

    const navigate = useNavigate(); 

    const [allUsers, setAllUsers] = useState([]); 
    const [showNewChatPanel, setShowNewChatPanel] = useState(false); 
    const [newChatError, setNewChatError] = useState(null);
    const [loadingUsers, setLoadingUsers] = useState(true); 

    // Effect to load existing conversations on component mount or currentUser change
    useEffect(() => {
        if (currentUser) {
            fetchConversations();
        }
    }, [currentUser, fetchConversations]);

    // Effect to load all users for starting a new chat, when the panel is opened
    useEffect(() => {
        const fetchAllUsersForNewChat = async () => {
            console.log("ChatPage: currentUser for fetching all users:", currentUser);
            if (!currentUser || !currentUser.user_id) { 
                setLoadingUsers(false);
                setNewChatError("Cannot load users: User not identified.");
                return;
            }
            setLoadingUsers(true);
            setNewChatError(null); 
            try {
                const response = await userService.getAllUsers();
                console.log("ChatPage: Fetched all users response.data:", response.data);
                const otherUsers = response.data.filter(user => String(user.user_id) !== String(currentUser.user_id)); 
                setAllUsers(otherUsers);
                console.log("ChatPage: Filtered other users:", otherUsers);
            } catch (err) {
                console.error('ChatPage: Failed to fetch all users:', err);
                setNewChatError(err.response?.data?.message || 'Failed to load users for new chat.');
                setAllUsers([]); 
            } finally {
                setLoadingUsers(false);
            }
        };

        // Only fetch users when the new chat panel is explicitly opened
        if (showNewChatPanel) { 
            fetchAllUsersForNewChat();
        }
    }, [currentUser, showNewChatPanel]); // Rerun when currentUser or panel visibility changes

    // Function to start a new chat
    const handleStartNewChat = useCallback(async (recipientId) => {
        console.log("ChatPage: handleStartNewChat called. recipientId:", recipientId, "currentUser:", currentUser);
        if (!currentUser || !currentUser.user_id) { 
            setNewChatError("Cannot start chat: User not identified.");
            return;
        }
        setNewChatError(null); // Clear previous errors
        try {
            // Check if a conversation with this user already exists
            const existingConversation = conversations.find(conv => {
            console.log(`--- Checking Conversation ID: ${conv._id} ---`);
            console.log("Conv participants (raw from DB):", conv.participants);
            
            const participantInConvA = conv.participants.some(p => {
                const pString = String(p);
                const currentUserStringId = String(currentUser.user_id); 
                console.log(`Comparing participant '${pString}' with currentUser.user_id '${currentUserStringId}': ${pString === currentUserStringId}`);
                return pString === currentUserStringId;
            });
            
            const participantInConvB = conv.participants.some(p => {
                const pString = String(p); 
                const recipientStringId = String(recipientId); 
                console.log(`Comparing participant '${pString}' with recipientId '${recipientStringId}': ${pString === recipientStringId}`);
                return pString === recipientStringId;
            });

            console.log(`Conversation ${conv._id}: Has currentUser? ${participantInConvA}, Has recipient? ${participantInConvB}`);
            console.log(`--- End Conversation Check ---`);

            return Array.isArray(conv.participants) && 
                   participantInConvA && 
                   participantInConvB &&
                   conv.type === 'direct'; 
        });

        if (existingConversation) {
            console.log("ChatPage: Existing conversation found, selecting:", existingConversation._id);
            selectChat(existingConversation._id); 
            fetchConversations(); 
            setShowNewChatPanel(false); 
            return;
        }

            // If no existing conversation, create a new one via API service
            const response = await chatsService.createChat(recipientId); 
            
            if (response && response.data && response.data._id) { 
                console.log("ChatPage: New conversation created, selecting:", response.data._id);
                selectChat(response.data._id); 
                fetchConversations(); 
                setShowNewChatPanel(false); 
            } else {
                setNewChatError("Failed to create new chat: Invalid response from server.");
                console.error("ChatPage: Invalid response creating new chat:", response);
            }
        } catch (error) {
            console.error('ChatPage: Failed to create new chat:', error.response?.data?.message || error.message);
            setNewChatError(error.response?.data?.message || 'Failed to start new chat.');
        }
    }, [currentUser, conversations, selectChat, fetchConversations]); 

    // Handle back button click
    const handleBack = () => {
        navigate('/dashboard'); 
    };

    if (authLoading) {
        return <div className="chat-page-container"><p className="loading-state-text">Loading authentication...</p></div>;
    }

    if (!isAuthenticated || !currentUser) {
        // if not authenticated
        return <div className="chat-page-container"><p className="not-authenticated-text">Please log in to view chats.</p></div>;
    }

    // Main render for the ChatPage
    return (
        <div className="chat-page-container">
            <div className="chat-sidebar">
                <button onClick={handleBack} className="back-button">
                    <ArrowLeft size={20} />
                    Back
                </button>
                
                <h2 className="chat-sidebar-title">Chats</h2>
                
                <button
                    onClick={() => setShowNewChatPanel(true)}
                    className="start-new-chat-button"
                >
                    <Plus size={20} className="start-new-chat-icon" />
                    Start New Chat
                </button>

                {loadingConversations ? (
                    <p className="no-conversations-message">Loading conversations...</p>
                ) : conversationsError ? (
                    <p className="no-conversations-message error-message">{conversationsError}</p>
                ) : conversations.length === 0 ? (
                    <p className="no-conversations-message">No conversations yet. Click 'Start New Chat' to begin!</p>
                ) : (
                    <ul className="conversation-list">
                        {conversations.map(conv => (
                            <li
                                key={conv._id}
                                className={`conversation-item ${activeChatId === conv._id ? 'active' : ''}`}
                                onClick={() => selectChat(conv._id)}
                            >
                                <div className="conversation-avatar-placeholder">
                                    {conv.name ?conv.name =='null'? 'DU': conv.name[0].toUpperCase() : 'U'}
                                </div>
                                <div className="conversation-details-wrapper">
                                    <h4 className="conversation-name">{conv.name =='null'? 'Deleted User': conv.name|| 'Unknown Conversation'}</h4>
                                    <p className="conversation-last-message">{conv.lastMessage || 'No messages yet.'}</p>
                                </div>
                                {conv.lastMessageTime && (
                                    <span className="conversation-timestamp">
                                        {format(new Date(conv.lastMessageTime), 'HH:mm')}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Right Main Area: Chat Window or Placeholder */}
            <div className="chat-main">
                {activeChatId ? (
                    // Render ChatWindow only if a conversation is selected
                    <ChatWindow conversationId={activeChatId} />
                ) : (
                    // Placeholder when no chat is selected
                    <div className="no-chat-selected-panel">
                        <h2 className="no-chat-selected-title">Welcome to StudyVerse Chat!</h2>
                        <p className="no-chat-selected-text">
                            Select a conversation from the left sidebar to start chatting,
                            or click the "Start New Chat" button to find new connections.
                        </p>
                    </div>
                )}
            </div>

            {/* New Chat Modal/Panel - Conditionally rendered */}
            {showNewChatPanel && (
                <div className="new-chat-modal-overlay">
                    <div className="new-chat-modal-content">
                        <div className="new-chat-modal-header">
                            <h3 className="new-chat-modal-title">Start a New Chat</h3>
                            <button
                                onClick={() => setShowNewChatPanel(false)}
                                className="new-chat-modal-close-button"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        {newChatError && (
                            <p className="new-chat-error-message">{newChatError}</p>
                        )}
                        {loadingUsers ? ( // Use local loadingUsers state
                            <p className="new-chat-loading-message">Loading users...</p>
                        ) : allUsers.length === 0 ? ( // Use local allUsers state
                            <p className="new-chat-no-users-message">No users available to start a conversation.</p>
                        ) : (
                            <ul className="new-chat-users-list">
                                {/* Map over allUsers (filtered) */}
                                {allUsers.map(user => (
                                    <li
                                        key={user.user_id} 
                                        className="new-chat-user-item"
                                        onClick={() => handleStartNewChat(user.user_id)}
                                    >
                                        <div className="new-chat-user-avatar-placeholder">
                                            {user.username?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="new-chat-user-name">{user.username=='null'? 'Deleted User': user.username || 'Unknown User'}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
