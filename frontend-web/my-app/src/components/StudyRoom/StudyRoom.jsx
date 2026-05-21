import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/contexts/AuthContext';
import { Maximize, Minimize, ArrowLeft } from 'lucide-react';

const StudyRoom = () => {
  const { roomName } = useParams(); 
  const { user } = useAuth();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  useEffect(() => {
    const scriptId = 'jitsi-external-api';
    let script = document.getElementById(scriptId);

    const loadJitsi = () => {
      if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
        if (apiRef.current) apiRef.current.dispose();

        apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: `StudyVerse-${roomName}`,
          parentNode: jitsiContainerRef.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName: user?.username ? `${user.username}` : 'Student',
            email: user?.email
          },
          configOverwrite: {
            startWithAudioMuted: true,
            prejoinPageEnabled: false,
            requireDisplayName: true,
            etherpad_base: 'https://beta.etherpad.org/p/',
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'whiteboard','microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection', 
                'hangup', 'profile', 'chat', 'recording', 'sharedvideo', 
                'settings', 'raisehand', 'videoquality', 'filmstrip', 'tileview', 
                'videobackgroundblur', 'help', 'mute-everyone'
            ],
          }
        });

        apiRef.current.addEventListeners({
          readyToClose: () => {
            navigate(`/groups/${roomName}/dashboard`);
          }
        });
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = loadJitsi;
      document.body.appendChild(script);
    } else {
      loadJitsi();
    }

    return () => {
      if (apiRef.current) apiRef.current.dispose();
    };
  }, [roomName, user, navigate]);

  const containerStyle = isFullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
  } : {
    position: 'relative',
    height: '80vh',
    width: '100%',
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
  };

  return (
    <div style={{ padding: isFullScreen ? '0' : '20px' }}>
      {!isFullScreen && (
        <button 
          onClick={() => navigate(`/groups/${roomName}/dashboard`)} 
          className="back-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '15px',
            padding: '10px 18px',
            backgroundColor: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          <ArrowLeft size={18} /> Back to Group Dashboard
        </button>
      )}

      <div style={{ position: 'relative' }}>
        <button 
          onClick={toggleFullScreen}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            zIndex: 10000,
            backgroundColor: 'rgba(255,255,255,0.9)',
            color: '#1f2937',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          {isFullScreen ? <Minimize size={18} /> : <Maximize size={18} />}
          {isFullScreen ? 'Exit' : 'Full Screen'}
        </button>

        <div ref={jitsiContainerRef} style={containerStyle} />
      </div>
    </div>
  );
};

export default StudyRoom;