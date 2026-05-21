import React from 'react';
import { useParams } from 'react-router-dom';
import StudyRoom from '../StudyRoom/StudyRoom'; // ודאי שהנתיב לקומפוננטה מהשלב הקודם נכון

const StudyRoomPage = () => {
  const { roomName } = useParams(); // מחלץ את שם החדר מה-URL

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <StudyRoom roomName={roomName} />
        </div>
      </div>
    </div>
  );
};

export default StudyRoomPage;