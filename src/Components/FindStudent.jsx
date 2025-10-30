import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Students.css";

const FindStudent = () => {
  const { admissionyear } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
 const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const DEFAULT_IMG = "/Assets/travel-back.jpg";

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${BACKEND_URL}/api/student/all-students`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const batch = res.data.batches.find(
          (b) => b.admissionyear.toString() === admissionyear
        );
        if (batch) setStudents(batch.students || []);

        // Decode token to get current user ID
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id);
      }
    } catch (err) {
      console.error("❌ Error fetching students:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [admissionyear]);

  const handleRequest = async (email) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BACKEND_URL}/api/student/send-request`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Request sent!");
      fetchStudents();
    } catch (err) {
      console.error("❌ Request error:", err.response?.data || err);
      alert("Failed to send request.");
    }
  };

  const handleDisconnect = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "/api/student/disconnect",
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("🔌 Disconnected successfully!");
      fetchStudents();
    } catch (err) {
      console.error("❌ Disconnect error:", err.response?.data || err);
      alert("Failed to disconnect.");
    }
  };

  const goToProfile = (userId) => navigate(`/profile/${userId}`);

  if (loading) return <div className="loading">Loading...</div>;
  if (!students.length)
    return <div className="no-batch">No students found for {admissionyear}</div>;

  // ✅ Group by branch
  const groupedByBranch = students.reduce((acc, s) => {
    if (!acc[s.branch]) acc[s.branch] = [];
    acc[s.branch].push(s);
    return acc;
  }, {});

  return (
    <div className="batch-container">
      <h2>Students in {admissionyear}</h2>

      {Object.entries(groupedByBranch).map(([branch, list]) => (
        <div key={branch} className="branch-group">
          <h3>{branch}</h3>
          <div className="table-wrapper">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Admission Year</th>
                  <th>Email</th>
                  <th>Connections</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <img
                        src={student.userimg || DEFAULT_IMG}
                        alt={student.username}
                        className="profile-img"
                        onClick={() => goToProfile(student._id)}
                        style={{
                          cursor: "pointer",
                          height: "50px",
                          width: "50px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    </td>
                    <td
                      onClick={() => goToProfile(student._id)}
                      style={{ cursor: "pointer", color: "#2563eb" }}
                    >
                      {student.username}
                    </td>
                    <td>{student.role}</td>
                    <td>{student.admissionyear}</td>
                    <td>{student.email}</td>
                    <td>{student.connections?.length || 0}</td>
                    <td>
                      {currentUserId === student._id ? (
                        "Myself"
                      ) : student.requestStatus === "Not connected" ? (
                        <button onClick={() => handleRequest(student.email)}>
                          Connect
                        </button>
                      ) : student.requestStatus === "Request Sent" ? (
                        <button disabled>Request Sent</button>
                      ) : student.requestStatus === "Connected" ? (
                        <>
                          <button disabled>Connected</button>
                          <button
                            onClick={() => handleDisconnect(student._id)}
                            className="disconnect-btn"
                            style={{
                              backgroundColor: "#dc3545",
                              color: "white",
                              marginLeft: "8px",
                            }}
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{student.requestStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FindStudent;
