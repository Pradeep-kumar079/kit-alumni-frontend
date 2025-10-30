import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";
import "./Students.css";

const FindAlumni = () => {
  const { admissionyear } = useParams();
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  // ✅ Automatically detect API base (local or Render)
  const API_BASE = process.env.REACT_APP_BACKEND_URL;


  // ✅ Fallback for missing profile images
  const defaultImg = "/assets/default-profile.png";

  const fetchAlumni = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get(`${API_BASE}/api/alumni/all-alumni`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const batch = res.data.batches.find(
          (b) => b.admissionyear.toString() === admissionyear
        );
        if (batch) setAlumniList(batch.alumni || []);
        else setAlumniList([]);

        // ✅ Decode token to get current user id
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id);
      }
    } catch (err) {
      console.error("❌ Fetch alumni error:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, [admissionyear]);

  const handleRequest = async (email) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/api/alumni/send-request`,
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Request sent!");
      fetchAlumni();
    } catch (err) {
      console.error("❌ Request error:", err.response?.data || err);
      alert("Failed to send request.");
    }
  };

  const handleDisconnect = async (userId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/api/alumni/disconnect`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("❎ Disconnected successfully!");
      fetchAlumni();
    } catch (err) {
      console.error("❌ Disconnect error:", err.response?.data || err);
      alert("Failed to disconnect.");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!alumniList.length)
    return <div className="no-batch">No alumni found for {admissionyear}</div>;

  // ✅ Group alumni by branch
  const groupedByBranch = alumniList.reduce((acc, a) => {
    if (!acc[a.branch]) acc[a.branch] = [];
    acc[a.branch].push(a);
    return acc;
  }, {});

  return (
    <div className="batch-container">
      <Navbar />
      <h2>Alumni in {admissionyear}</h2>

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
                {list.map((alumni) => (
                  <tr key={alumni._id}>
                    <td>
                      <img
                        src={
                          alumni.userimg
                            ? `${API_BASE}/uploads/${alumni.userimg}`
                            : defaultImg
                        }
                        alt={alumni.username}
                        className="profile-img"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/profile/${alumni._id}`)}
                      />
                    </td>
                    <td>{alumni.username}</td>
                    <td>{alumni.role}</td>
                    <td>{alumni.admissionyear}</td>
                    <td>{alumni.email}</td>
                    <td>{alumni.connections?.length || 0}</td>
                    <td>
                      {currentUserId === alumni._id ? (
                        "Myself"
                      ) : alumni.requestStatus === "Not connected" ? (
                        <button onClick={() => handleRequest(alumni.email)}>
                          Connect
                        </button>
                      ) : alumni.requestStatus === "Request Sent" ? (
                        <button disabled>Request Sent</button>
                      ) : alumni.requestStatus === "Connected" ? (
                        <>
                          <button disabled>Connected</button>
                          <button
                            onClick={() => handleDisconnect(alumni._id)}
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
                    <td>{alumni.requestStatus}</td>
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

export default FindAlumni;
