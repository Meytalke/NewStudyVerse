import { useState, useEffect, useRef ,useCallback} from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import MessageBubble from './MessageBubble';
import { Send,Trash2  } from 'lucide-react'; 
import './ChatWindow.css'; 
import { useTranslation } from 'react-i18next';

const ChatWindow = ({ conversationId }) => {
  const { currentUser } = useAuth(); 
  const { messages, loadingMessages, messagesError, sendMessage, typingStatus,deleteChat,fetchConversations ,sendTyping} = useChat();
  const { t, i18n } = useTranslation(); 
  const isRTL = i18n.language === 'he';
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null); // useRef hook to scroll to the bottom of the messages list

  const typingTimeoutRef = useRef(null);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const TYPING_DELAY = 1000;
  // Filtering messages relevant to the current conversation ID
  const currentConversationMessages = messages.filter(msg => msg.conversation === conversationId);
  console.log("ChatWindow render - currentUser.user_id:", currentUser?.user_id);

  // Effect to scroll to the bottom of the chat window whenever new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversationMessages]); 

  // Handler for sending a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() !== '') {
      sendMessage(conversationId, newMessage); 
      setNewMessage('');

      if (isTypingLocal) {
        sendTyping(conversationId, false);
        setIsTypingLocal(false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
    }
  }};
 
  const handleTyping = (e) => {
    const text = e.target.value;
    setNewMessage(text);
      if (!isTypingLocal && text.length > 0) {
          sendTyping(conversationId, true);
          setIsTypingLocal(true);
      }
      
      if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
          sendTyping(conversationId, false);
          setIsTypingLocal(false);
      }, TYPING_DELAY);

      if (text.length === 0 && isTypingLocal) {
          sendTyping(conversationId, false);
          setIsTypingLocal(false);
          if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
          }
      }
  };

  // Finding the active conversation details from the conversations list in ChatContext
  const activeConversation = useChat().conversations.find(conv => String(conv._id) === String(conversationId));
  console.log("Window: activeConversation: ", activeConversation)
  const otherParticipantId = activeConversation?.otherUserId;

  const isOtherUserTyping = typingStatus[conversationId]?.[otherParticipantId] &&
                            String(otherParticipantId) !== String(currentUser?.user_id);

  // Debugging useEffect: logs current user and message details for debugging purposes
  useEffect(() => {
    console.log('ChatWindow mounted/updated. CurrentUser:', currentUser); 
    console.log('ChatWindow: currentUser?.user_id:', currentUser?.user_id, 'Type:', typeof currentUser?.user_id); 
    console.log("currentConversationMessages:", currentConversationMessages); 
    if (currentConversationMessages.length > 0) {
        console.log('ChatWindow: First message sender:', currentConversationMessages[0].sender, 'Type:', typeof currentConversationMessages[0].sender);
        // Determine the sender ID for the first message
        const firstMessageSenderId = typeof currentConversationMessages[0].sender === 'object' && currentConversationMessages[0].sender !== null && currentConversationMessages[0].sender._id
            ? String(currentConversationMessages[0].sender._id) 
            : String(currentConversationMessages[0].sender); 

        // Current user ID for comparison
        const currentUserStringId = String(currentUser?.user_id); 

        console.log('ChatWindow: Comparing First message sender (stringified):', firstMessageSenderId, 'with CurrentUser ID (stringified):', currentUserStringId);
        console.log('ChatWindow: isOwn for first message (computed):', firstMessageSenderId === currentUserStringId);
    }
  }, [currentUser, currentConversationMessages]); // Dependencies: re-run when currentUser or messages change
  
  useEffect(() => {
    return () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            if (isTypingLocal) { 
                sendTyping(conversationId, false);
            }
        }
    };
  }, [conversationId, isTypingLocal, sendTyping]);
  // Handler for deleting the current chat conversation
  const handleDeleteChatClick = async () => {
        if (!activeConversation) { 
            alert('No active chat selected to delete.');
            return;
        }

        // Confirmation dialog before deleting the chat
        if (window.confirm(t('chat.confirm_delete', { userName: activeConversation.name=='null' ? t('chat.user_deleted_name') : activeConversation.name }))) {
            try {
                await deleteChat(activeConversation._id); 
                alert(t('chat.delete_success'));
                fetchConversations();
            } catch (error) {
                alert(error.message);
            }
        }
    };

  return (
    <div className="chat-main"> 
      <div className="chat-header">
        <div className="chat-user-info">
          <div className="user-avatar">
            {activeConversation?.name ? activeConversation.name=='null'?'DU':activeConversation.name[0].toUpperCase() : 'U'}
            <span className="online-indicator"></span>
          </div>
          <div className="user-details">
            <h3>{activeConversation 
             ? activeConversation.name=='null' ? t('chat.user_deleted') : activeConversation.name
             : t('chat.select_user')}
            </h3>
            <span className="user-status">
                {isOtherUserTyping ? t('chat.status_typing') : t('chat.status_active')}
            </span>
          </div>
        </div>
        <div className="chat-actions">
          <button className="btn-icon"
          onClick={handleDeleteChatClick}
          >                  
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {loadingMessages ? (
          <p className="chat-messages-loading-text">{t('chat.loading_messages')}</p>
        ) : messagesError ? (
          <p className="error-message">{t('chat.messages_error')}</p>
        ) : currentConversationMessages.length === 0 ? (
          <p className="no-messages-yet">{t('chat.start_conversation')}</p>
        ) : (
          currentConversationMessages.map((msg) => {
            // Debugging logs for message sender and current user IDs
            console.log(`--- Message Debug --- ID: ${msg._id}`);
            console.log(msg);
            console.log(`Raw msg.sender:`, msg.sender, `Type:`, typeof msg.sender);
            console.log(`Current User ID:`, currentUser?.user_id, `Type:`, typeof currentUser?.user_id); // **שינוי: currentUser.user_id**

            // Determine if the message is from the current user
            const senderIdString = typeof msg.sender === 'object' && msg.sender !== null
                ? String(msg.sender.user_id) 
                : String(msg.sender); 
            
            const currentUserIdString = String(currentUser?.user_id); 
            
            const ownMessage = senderIdString === currentUserIdString;
            console.log(`Comparing: "${senderIdString}" === "${currentUserIdString}" -> IsOwn: ${ownMessage}`);
            console.log(`---------------------`);

            return (
              <MessageBubble
                key={msg._id} 
                message={msg}
                isOwn={ownMessage} 
              />
            );
          })
        )}
        <div ref={messagesEndRef} className="messages-end-scroll-point" />
      </div>

      <form className="chat-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder={t('chat.placeholder_input')}
          className="chat-input"
          dir="auto"
        />
        <button type="submit" className="btn-send">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
