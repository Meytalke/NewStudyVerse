import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying your email...');

  // State to track the success status of the verification (null: pending, true: success, false: error)
  const [success, setSuccess] = useState(null);

  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const navigate = useNavigate();

  // useEffect to perform email verification when the component mounts or token changes
  useEffect(() => {
    const verify = async () => {
      try {
        // Calling the backend API to verify the email with the provided token
        const response = await authService.verifyEmail(token);        
        setMessage(response.data.message);
        setSuccess(true);
        setAlreadyVerified(response.data.alreadyVerified || false);

        // Pause for 3 seconds to allow the user to read the error message
        if (response.data.message === 'Email verified successfully' && !response.data.alreadyVerified) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          navigate('/login');
        }
      } catch (error) {
        setMessage(
          error.response?.data?.message || 'Verification failed. The link may have expired.'
        );
        await new Promise(resolve => setTimeout(resolve, 3000));
        setSuccess(false);
      }
    };

    verify();
  }, [token, navigate]);// Dependencies: re-run effect if token or navigate changes

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>
        {success === true 
          ? alreadyVerified ? 'ℹ️ Already Verified' : '✅ Success!' // Display 'Already Verified' if applicable
          : success === false 
            ? '❌ Error' 
            : '⏳ Verifying...'
        }
      </h2>      
      <p>{message}</p>
    </div>
  );
};

export default VerifyEmail;