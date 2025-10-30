import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const AcceptRequest = ({ refreshStudents }) => {
  const { token } = useParams();
  const navigate = useNavigate();

  // ✅ Backend auto-detect (local vs deployed)
  const backend =  process.env.REACT_APP_BACKEND_URL;


  useEffect(() => {
    const acceptRequest = async () => {
      try {
        await axios.get(`${backend}/api/student/accept-request/${token}`);
        alert("✅ Connection accepted!");
        if (refreshStudents) refreshStudents(); // update batch list in parent
        navigate("/students"); // redirect back to batches
      } catch (err) {
        console.error(err.response?.data || err);
        alert("Failed to accept request.");
        navigate("/students");
      }
    };

    acceptRequest();
  }, [token, refreshStudents, navigate, backend]);

  return <div>Processing request...</div>;
};

export default AcceptRequest;
