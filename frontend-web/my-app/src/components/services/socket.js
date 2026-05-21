import { io } from 'socket.io-client';

const socketURL = 'http://localhost:5000'; 

console.log(`[Socket Service Init] ${new Date().toISOString()} - Attempting to connect to socket URL: ${socketURL}`);

// Initialize the Socket.IO client
const socket = io(socketURL, {
    autoConnect: false, 
    reconnection: true, // Enable automatic reconnection attempts
    reconnectionAttempts: 5, // Number of reconnection attempts before giving up
    reconnectionDelay: 1000, // Delay in milliseconds between reconnection attempts
    transports: ['websocket', 'polling'], // Prioritize WebSocket
});

// Configures the socket with an authentication token.
const configureSocket = (token) => {
    console.log(`[Socket Service] ${new Date().toISOString()} - configureSocket called. Token present: ${!!token}`);
    if (token) {
        socket.auth = { token }; // Set the authentication token for the socket
        console.log('[Socket Service] Socket authentication token set.');
    } else {
        socket.auth = {};
        console.warn('[Socket Service] No token provided to configureSocket. Socket connection might fail auth.');
    }
};

// Emits an event to join a specific chat room.
const joinChatRoom = (chatId) => {
    if (socket.connected) { 
        socket.emit('join_chat_room', chatId); 
        console.log(`[Socket Service] Emitted 'join_chat_room' for chat: ${chatId}`);
    } else {
        console.warn('[Socket Service] Cannot join chat room, socket not connected.');
    }
};

// Emits an event to leave a specific chat room.
const leaveChatRoom = (chatId) => {
    if (socket.connected) { 
        socket.emit('leave_chat_room', chatId); 
        console.log(`[Socket Service] Emitted 'leave_chat_room' for chat: ${chatId}`);
    } else {
        console.warn('[Socket Service] Cannot leave chat room, socket not connected.');
    }
};

// Emits an event to mark messages as read within a chat.
const markMessagesAsRead = (chatId, messageIds) => {
    if (socket.connected) { 
        socket.emit('mark_read', { conversationId: chatId, messageIds });
        console.log(`[Socket Service] Emitted 'mark_read' for chat ${chatId}, message IDs: ${messageIds}`);
    } else {
        console.warn('[Socket Service] Cannot mark messages as read, socket not connected.');
    }
};

// Sets up a listener for 'new_message' events.
const listenForNewMessages = (s, callback) => { 
    if (s) { 
        s.on('new_message', (message) => {
            console.log('[Socket Service] Received new_message:', message);
            callback(message);
        });
    }
};

// Sets up a listener for 'messages_read' events.
const listenForMessagesRead = (s, callback) => {
    if (s) {
        s.on('messages_read', (data) => {
            console.log('[Socket Service] Received messages_read:', data);
            callback(data);
        });
    }
};

// Turns off a specific event listener on a socket instance.
const offListener = (s, eventName, handler) => {
    if (s) {
        s.off(eventName, handler);
        console.log(`[Socket Service] Turned off listener for event: ${eventName}`);
    }
};

//Sets up a listener for 'typing' notifications. -TODO
const listenForTypingNotifications = (s, callback) => { 
    if (s) { 
        s.on('typing', (data) => {
            console.log('[Socket Service] Received typing notification:', data);
            callback(data);
        });
    }
};

// Emits a 'typing' notification to a specific chat room. - TODO
const sendTypingNotification = (chatId, isTyping) => {
    if (socket.connected) { 
        socket.emit('typing', { conversationId: chatId, isTyping });
        console.log(`[Socket Service] Emitted 'typing' status for chat ${chatId}: ${isTyping}`);
    } else {
        console.warn('[Socket Service] Cannot send typing notification, socket not connected.');
    }
};

// Event listener for successful socket connection
socket.on('connect', () => {
    console.log(`[Socket Service] Socket Connected with ID ${socket.id}. Current time: ${new Date().toISOString()}`);
});

// Event listener for socket connection errors
socket.on('connect_error', (err) => {
    console.error(`[Socket Service] Connection Error: ${err.message}. Current time: ${new Date().toISOString()}`);
    if (err.message === 'Authentication error: Invalid token.') {
        console.error('[Socket Service] JWT authentication failed. User needs to re-authenticate.');
    }
});

// Event listener for socket disconnection
socket.on('disconnect', (reason) => {
    console.log(`[Socket Service] Disconnected: ${reason}. Current time: ${new Date().toISOString()}`);
});

export {
    socket,
    configureSocket,
    joinChatRoom,
    leaveChatRoom,
    markMessagesAsRead,
    listenForNewMessages,
    listenForMessagesRead,
    offListener,
    listenForTypingNotifications,
    sendTypingNotification,
};