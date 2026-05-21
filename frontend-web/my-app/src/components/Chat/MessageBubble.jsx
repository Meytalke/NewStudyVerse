import { format } from 'date-fns'; 
import { Check, CheckCheck } from 'lucide-react';
import './MessageBubble.css'; 

// MessageBubble functional component, receives message object and isOwn boolean as props
const MessageBubble = ({ message, isOwn }) => {
  // Format the message's creation timestamp to HH:mm
  const formattedTime = message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : '';
  // Determine if the message has been read by at least one other participant.
  const isRead = message.readBy && message.readBy.length > 1; 
  // const senderInitial = message.sender?.username?.[0]?.toUpperCase() || 'U';

  return (
    <div className={`message-container ${isOwn ? 'own-message' : 'other-message'}`}>
      {/* {!isOwn && (
        <div className="message-avatar other-avatar">
          {senderInitial}
        </div>
      )} */}

      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
        <p className="message-text">{message.text}</p>
        <div className="message-meta">
          <span className="message-time">{formattedTime}</span>
          {isOwn && (
            <span className="message-status">
              {isRead ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
