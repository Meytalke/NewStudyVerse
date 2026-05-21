import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { chatsService } from '../services/api';
import {
    socket,
    configureSocket,
    joinChatRoom,
    leaveChatRoom,
    markMessagesAsRead as socketMarkMessagesAsRead,
    listenForNewMessages,
    listenForMessagesRead,
    offListener,
    listenForTypingNotifications,
    sendTypingNotification,
} from '../services/socket';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
    const { isAuthenticated, currentUser, token } = useAuth();
    const [chatsError, setChatsError] = useState(null);
    const [chatActionLoading, setChatActionLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [conversationsError, setConversationsError] = useState(null);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [messagesError, setMessagesError] = useState(null);
    const [typingStatus, setTypingStatus] = useState({});

    const getParticipantId = useCallback((p) => {
        if (typeof p === 'object' && p !== null) {
            return p.user_id ? String(p.user_id) : String(p._id);
        }
        return String(p);
    }, []);

    const handleNewMessage = useCallback((newMessage) => {
        console.log(`[ChatContext Socket Event] Received 'new_message' from socket:`, newMessage);
        const normalizedNewMessage = {
            ...newMessage,
            sender: newMessage.sender && typeof newMessage.sender === 'object' ?
                {
                    _id: newMessage.sender._id || newMessage.sender.user_id,
                    username: newMessage.sender.username,
                    user_id: newMessage.sender.user_id
                } : { _id: newMessage.sender, user_id: newMessage.sender },
            receiver: newMessage.receiver && typeof newMessage.receiver === 'object' ?
                {
                    _id: newMessage.receiver._id || newMessage.receiver.user_id,
                    username: newMessage.receiver.username,
                    user_id: newMessage.receiver.user_id
                } : { _id: newMessage.receiver, user_id: newMessage.receiver },
            isOptimistic: false
        };

        setMessages(prevMessages => {
            if (String(normalizedNewMessage.conversation) !== String(activeChatId)) {
                console.log(`[ChatContext Socket Event] New message ${normalizedNewMessage._id} not for active chat ${activeChatId}. Skipping message state update.`);
                return prevMessages;
            }
            const optimisticIndex = prevMessages.findIndex(
                (msg) => msg.isOptimistic && String(msg._id) === String(normalizedNewMessage.tempId)
            );

            if (optimisticIndex > -1) {
                const updatedMessages = [...prevMessages];
                updatedMessages[optimisticIndex] = normalizedNewMessage;
                console.log(`[ChatContext Socket Event] Replaced optimistic message (tempId: ${normalizedNewMessage.tempId}) with actual message (ID: ${normalizedNewMessage._id}).`);
                return updatedMessages;
            } else {
                const messageExistsByRealId = prevMessages.some(
                    (msg) => String(msg._id) === String(normalizedNewMessage._id) && !msg.isOptimistic
                );
                if (!messageExistsByRealId) {
                    console.log(`[ChatContext Socket Event] Adding new message from other source/user: ${normalizedNewMessage._id}.`);
                    return [...prevMessages, normalizedNewMessage];
                }
                console.log(`[ChatContext Socket Event] Message ${normalizedNewMessage._id} already exists (real ID), skipping addition.`);
                return prevMessages;
            }
        });

        setConversations(prev => prev.map(conv =>
            String(conv._id) === String(normalizedNewMessage.conversation)
            ? {
                ...conv,
                lastMessage: normalizedNewMessage.text,
                lastMessageTime: normalizedNewMessage.createdAt,
                updatedAt: normalizedNewMessage.createdAt
            }
            : conv
        ));

        const isForCurrentUser = String(normalizedNewMessage.receiver.user_id) === String(currentUser?.user_id); 
        const isInActiveChat = String(normalizedNewMessage.conversation) === String(activeChatId);
        const isNotYetReadByCurrentUser = !normalizedNewMessage.readBy || !normalizedNewMessage.readBy.includes(String(currentUser?.user_id));

        if (isForCurrentUser && isInActiveChat && isNotYetReadByCurrentUser) {
            console.log(`[ChatContext] Message <span class="math-inline">\{normalizedNewMessage\.\_id\} is for current user \(</span>{currentUser?.user_id}) in active chat ${activeChatId}. Marking as read.`);
            socketMarkMessagesAsRead(String(normalizedNewMessage.conversation), [String(normalizedNewMessage._id)]);

            setMessages(prevMessages => prevMessages.map(msg => {
                if (String(msg._id) === String(normalizedNewMessage._id)) {
                    return { ...msg, readBy: [...new Set([...(msg.readBy || []), String(currentUser?.user_id)])] };
                }
                return msg;
            }));
        } else {
            console.log(`[ChatContext] Message ${normalizedNewMessage._id} NOT marked as read. Conditions:`);
            console.log(` - isForCurrentUser: ${isForCurrentUser} (Receiver: ${String(normalizedNewMessage.receiver.user_id)}, Current User ID: ${String(currentUser?.user_id)})`);
            console.log(` - isInActiveChat: ${isInActiveChat} (Message Chat: ${String(normalizedNewMessage.conversation)}, Active Chat ID: ${String(activeChatId)})`);
            console.log(` - isNotYetReadByCurrentUser: ${isNotYetReadByCurrentUser} (Message ReadBy: ${JSON.stringify(normalizedNewMessage.readBy)}, Current User External ID: ${currentUser?.user_id})`);
        }
    }, [activeChatId, currentUser, socketMarkMessagesAsRead]); 

    const handleMessagesRead = useCallback((data) => {
        console.log(`[ChatContext Socket Event] Received 'messages_read' for chat ${data.chatId}, reader ${data.readerId}, IDs: ${data.messageIds}`);
        setMessages(prevMessages =>
            prevMessages.map(msg =>
                (String(msg.conversation) === String(data.chatId) &&
                 data.messageIds.includes(String(msg._id)) &&
                 !msg.readBy.includes(String(data.readerId)))
                    ? { ...msg, readBy: [...new Set([...(msg.readBy || []), String(data.readerId)])] }
                    : msg
            )
        );
    }, []); 

    const handleTypingNotification = useCallback(({ chatId, userId, isTyping }) => {
        console.log(`[ChatContext Socket Event] Received 'typing' notification for chat ${chatId}, user ${userId}: ${isTyping}`);
        setTypingStatus(prev => {
            const newChatTypingStatus = { ...prev[chatId] };

            if (isTyping) {
                newChatTypingStatus[userId] = true;
            } else {
                delete newChatTypingStatus[userId];
            }

            if (Object.keys(newChatTypingStatus).length === 0) {
                const newState = { ...prev };
                delete newState[chatId];
                return newState;
            }

            return {
                ...prev,
                [chatId]: newChatTypingStatus
            };
        });
    }, []); 

    useEffect(() => {
        if (socket) {
            listenForTypingNotifications(socket, handleTypingNotification);

            return () => {
                socket.off('typing', handleTypingNotification);
            };
        }
    }, [socket, handleTypingNotification]);

    // Main useEffect for socket connection and event listeners
    useEffect(() => {
        if (!socket || !currentUser || !currentUser._id) return;

        if (isAuthenticated && currentUser && currentUser.user_id && token) {
            console.log(`[ChatContext useEffect] User authenticated. Configuring and connecting socket for user ${currentUser.user_id}.`);
            configureSocket(token);
            if (!socket.connected) {
                console.log('[ChatContext useEffect] Socket not connected, attempting to connect...');
                socket.connect();
            } else {
                console.log('[ChatContext useEffect] Socket already connected.');
            }

            // Set up socket event listeners - העברת הפונקציות ה-callback שהוגדרו
            listenForNewMessages(socket, handleNewMessage);
            listenForMessagesRead(socket, handleMessagesRead);
            listenForTypingNotifications(socket, handleTypingNotification);

        } else if (socket.connected) {
            console.log('[ChatContext useEffect] User not authenticated or ID missing, disconnecting socket.');
            socket.disconnect();
            setMessages([]);
            setConversations([]);
            setActiveChatId(null);
            setTypingStatus({});
        }

        return () => {
            console.log(`[ChatContext Cleanup] ${new Date().toISOString()} - Cleaning up socket listeners.`);
            offListener(socket, 'new_message', handleNewMessage);
            offListener(socket, 'messages_read', handleMessagesRead);
            offListener(socket, 'typing', handleTypingNotification);
        };
    }, [isAuthenticated, currentUser, token, activeChatId, getParticipantId, handleNewMessage, handleMessagesRead, handleTypingNotification]); 

    // useCallback hook to memoize fetchConversations function
    const fetchConversations = useCallback(async () => {
        console.log('ChatContext: fetchConversations called. currentUser.user_id:', currentUser?.user_id);
        if (!isAuthenticated || !currentUser || !currentUser.user_id) {
            console.log('ChatContext: fetchConversations aborted - not authenticated or no currentUser ID.');
            setConversations([]);
            setLoadingConversations(false);
            return;
        }
        setLoadingConversations(true);
        setConversationsError(null);
        try {
            const response = await chatsService.getChats();
            console.log('ChatContext: Raw conversations fetched:', response.data);

            const processedConversations = response.data.map(conv => {
                if (conv.type === 'direct' && Array.isArray(conv.participants) && conv.participants.length === 2) {
                    const otherParticipant = conv.participants.find(p => getParticipantId(p) !== String(currentUser.user_id)); 
                    const otherUserId = otherParticipant ? getParticipantId(otherParticipant) : null;
                    const otherUserName = conv.name;
                    return {
                        ...conv,
                        otherUserId: otherUserId,
                        name: otherUserName
                    };
                }
                return conv;
            });
            setConversations(processedConversations);
            console.log('ChatContext: Successfully fetched and PROCESSED conversations:', processedConversations.length, 'conversations.');
            console.log('ChatContext: Processed Conversations Data (Sample):', processedConversations.slice(0, 2));
        } catch (err) {
            console.error('ChatContext: Failed to fetch conversations:', err);
            setConversationsError(err.response?.data?.message || 'Failed to load conversations.');
            setConversations([]);
        } finally {
            console.log('ChatContext: fetchConversations finished. Setting loadingConversations to false.');
            setLoadingConversations(false);
        }
    }, [isAuthenticated, currentUser, getParticipantId]);

    // useEffect to fetch conversations when currentUser changes (e.g., after login/logout)
    useEffect(() => {
        console.log(`[ChatContext Top-level useEffect] ${new Date().toISOString()} - Triggered by currentUser change. Current user:`, currentUser);
        if (currentUser && currentUser.user_id) {
            fetchConversations();
        } else {
            setConversations([]);
            setLoadingConversations(false);
        }
    }, [currentUser, fetchConversations]);

    // useCallback for selecting a chat and fetching its messages
    const selectChat = useCallback(async (chatId) => {
        if (activeChatId === chatId) return; // Do nothing if already active

        // If there was a previous active chat, leave its room
        if (activeChatId && socket.connected && currentUser && currentUser.user_id) {
            leaveChatRoom(activeChatId);
            console.log(`[ChatContext SelectChat] Left previous chat room: ${activeChatId}`);
        }

        setActiveChatId(chatId);
        setMessages([]);
        setLoadingMessages(true);
        setMessagesError(null);

        console.log(`[ChatContext SelectChat] selectChat called. activeChatId set to: ${chatId}. Conversations state length: ${conversations.length}.`);

        try {
            const response = await chatsService.getChatMessages(chatId);
            const initialMessages = response.data.map(msg => ({ ...msg, isOptimistic: false }));
            setMessages(initialMessages);
            console.log(`[ChatContext SelectChat] Fetched messages for chat ${chatId}: ${initialMessages.length} messages.`);

            // Join the new chat room and mark unread messages as read
            if (socket.connected && currentUser && currentUser.user_id) {
                joinChatRoom(chatId);
                console.log(`[ChatContext SelectChat] Joined chat room: ${chatId}`);

                // Identify unread messages for the current user
                const unreadMessages = response.data.filter(msg =>
                    getParticipantId(msg.receiver) === String(currentUser.user_id) && !msg.readBy.includes(String(currentUser.user_id))
                ).map(msg => msg._id);

                if (unreadMessages.length > 0) {
                    console.log(`[ChatContext SelectChat] Found ${unreadMessages.length} unread messages. Marking as read.`);
                    socketMarkMessagesAsRead(chatId, unreadMessages, currentUser.user_id);
                } else {
                    console.log(`[ChatContext SelectChat] No unread messages found for chat ${chatId}.`);
                }
            } else {
                console.warn(`[ChatContext SelectChat] Socket not connected or user not identified for chat room join or mark read for chat ${chatId}.`);
            }
        } catch (err) {
            console.error(`ChatContext: Failed to fetch messages for chat ${chatId}:`, err);
            setMessagesError(err.response?.data?.message || 'Failed to load messages.');
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }, [activeChatId, currentUser, socketMarkMessagesAsRead, conversations, getParticipantId]);

    // useCallback for sending a message
    const sendMessage = useCallback(async (conversationId, text) => {
        if (!currentUser || !currentUser.user_id) {
            console.error('ChatContext: Cannot send message, currentUser or user_id is not defined.');
            setMessagesError("Cannot send message: User not identified.");
            return;
        }

        console.log(`[ChatContext SendMessage] sendMessage called for chat ${conversationId}.`);

        // Find the active conversation to get the receiver's ID
        const activeConversation = conversations.find(c => String(c._id) === String(conversationId));
        const receiverId = activeConversation?.otherUserId;

        console.log("[ChatContext SendMessage] Active Conversation:", activeConversation);
        console.log("[ChatContext SendMessage] Receiver ID (otherUserId - User.user_id):", receiverId);

        if (!receiverId) {
            console.error("[ChatContext SendMessage] Cannot send message, receiver ID not found for conversation:", conversationId);
            setMessagesError("Cannot send message: Invalid conversation.");
            return;
        }

        // Create an optimistic message to immediately update UI
        const tempMessage = {
            _id: Date.now().toString(),
            conversation: conversationId,
            sender: {
                _id: currentUser._id,
                username: currentUser.username,
                user_id: currentUser.user_id
            },
            receiver: receiverId,
            text: text,
            createdAt: new Date().toISOString(),
            readBy: [currentUser.user_id],
            isOptimistic: true // Mark as optimistic
        };

        setMessages(prev => [...prev, tempMessage]);
        console.log('[ChatContext SendMessage] Optimistically added temp message:', tempMessage);

        if (socket.connected) {
            // Emit new_message via socket if connected
            socket.emit('new_message', {
                conversationId: conversationId,
                receiverId: receiverId,
                text: text,
                tempId: tempMessage._id
            });
            console.log('[ChatContext SendMessage] Message emitted via socket.');

        } else {
            console.warn('[ChatContext SendMessage] Socket not connected, attempting to send message via HTTP API.');
            try {
                const response = await chatsService.sendMessage(conversationId, { content: text, receiverId });
                setMessages(prev => prev.map(msg => (String(msg._id) === String(tempMessage._id) ? { ...response.data, isOptimistic: false } : msg)));
                console.log('[ChatContext SendMessage] Message sent via HTTP API:', response.data);
            } catch (err) {
                console.error('[ChatContext SendMessage] Failed to send message via HTTP API:', err);
                setMessagesError(err.response?.data?.message || "Failed to send message via HTTP.");
                setMessages(prev => prev.filter(msg => String(msg._id) !== String(tempMessage._id)));
            }
        }
    }, [socket, currentUser, conversations]);

    // useCallback for marking messages as read
    const markAsRead = useCallback(async (conversationId, messageIds) => {
        if (!isAuthenticated || !currentUser || !currentUser.user_id || !socket.connected || messageIds.length === 0) {
            console.warn('[ChatContext MarkRead] Aborting markAsRead: authentication, user ID, socket connection, or message IDs missing.');
            return;
        }

        console.log(`[ChatContext MarkRead] Marking messages ${messageIds} in chat ${conversationId} as read by ${currentUser.user_id} via socket.`);
        socketMarkMessagesAsRead(conversationId, messageIds); // Emit read status via socket

        // Optimistically update UI to show messages as read
        setMessages(prevMessages =>
            prevMessages.map(msg =>
                (String(msg.conversation) === String(conversationId) &&
                 messageIds.includes(String(msg._id)) &&
                 !msg.readBy.includes(String(currentUser.user_id)))
                    ? { ...msg, readBy: [...msg.readBy, String(currentUser.user_id)] }
                    : msg
            )
        );
        console.log(`[ChatContext MarkRead] Optimistically updated UI for messages ${messageIds}.`);
    }, [isAuthenticated, currentUser, socket, getParticipantId, socketMarkMessagesAsRead]);

    // useCallback for sending typing notifications
    const sendTyping = useCallback((conversationId, isTyping) => {
        if (socket.connected && currentUser && currentUser.user_id) {
            sendTypingNotification(conversationId, isTyping);
            console.log(`ChatContext: Sent typing status for ${currentUser.user_id} in chat ${conversationId}: ${isTyping}`);
        } else {
            console.warn('ChatContext: Cannot send typing notification, socket not connected or user not identified.');
        }
    }, [socket, currentUser, sendTypingNotification]);

    // Value object provided by the ChatContext
    const deleteChat = useCallback(async (chatId) => {
        setChatActionLoading(true);
        setChatsError(null);
        try {
            await chatsService.deleteChat(chatId);
            console.log(`Chat ${chatId} deleted successfully.`);
            return true;
        } catch (error) {
            console.error('ChatContext: Error deleting chat:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete chat.';
            setChatsError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setChatActionLoading(false);
        }
    }, []);

    const value = {
        messages,
        conversations,
        loadingConversations,
        conversationsError,
        loadingMessages,
        messagesError,
        activeChatId,
        typingStatus,
        fetchConversations,
        selectChat,
        sendMessage,
        markAsRead,
        sendTyping,
        deleteChat,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to consume the ChatContext
export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};