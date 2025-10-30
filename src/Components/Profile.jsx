import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const base_url =process.env.REACT_APP_BACKEND_URL;

  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [requestStatus, setRequestStatus] = useState("Not connected");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id);

        const res = await axios.get(`${base_url}/api/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.success) {
          setUser(res.data.user);
          setUserPosts(res.data.posts);

          const isConnected = res.data.user.connections?.includes(payload.id);
          setRequestStatus(isConnected ? "Connected" : "Not connected");
        }
      } catch (err) {
        console.error("❌ Profile Fetch Error:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  const handleConnect = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${base_url}/api/alumni/send-request`,
        { email: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Request sent!");
      setRequestStatus("Request Sent");
    } catch (err) {
      console.error("❌ Connect Error:", err.response?.data || err);
      alert("Failed to send request.");
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${base_url}/api/alumni/disconnect`,
        { userId: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Disconnected successfully!");
      setRequestStatus("Not connected");
    } catch (err) {
      console.error("❌ Disconnect Error:", err.response?.data || err);
      alert("Failed to disconnect.");
    }
  };

  const renderImage = (path) => {
    if (!path) return "/assets/default-profile.png";
    if (path.startsWith("http")) return path;
    return `${base_url}/uploads/${path}`;
  };

  if (loading) return <div>Loading profile...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="profile-container">
      <div className="profile-header">
        <img
          src={renderImage(user.userimg)}
          alt={user.username}
          className="profile-img"
        />
        <div className="profile-info">
          <h2>{user.username}</h2>
          <p>{user.email}</p>
          <p>Batch: {user.admissionyear}</p>
          <p>Connections: {user.connections?.length || 0}</p>
          <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>

          <div className="profile-actions" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            {currentUserId === user._id ? (
              <span>My Profile</span>
            ) : requestStatus === "Not connected" ? (
              <button onClick={handleConnect}>Connect</button>
            ) : requestStatus === "Request Sent" ? (
              <button disabled>Request Sent</button>
            ) : requestStatus === "Connected" ? (
              <>
                <button onClick={() => navigate(`/chat/${user._id}`)}>Message</button>
                <button
                  onClick={handleDisconnect}
                  style={{ backgroundColor: "#dc3545", color: "#fff" }}
                >
                  Disconnect
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <h3 className="section-title">Posts by {user.username}</h3>
      <div className="profile-posts">
        {userPosts.length ? (
          userPosts.map((post) => (
            <div key={post._id} className="profile-post-card">
              <h4>{post.title}</h4>
              <p>{post.description}</p>
              {post.postimg && (
                <img
                  src={renderImage(post.postimg)}
                  alt="Post"
                  className="profile-post-img"
                />
              )}
            </div>
          ))
        ) : (
          <p>No posts yet.</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
