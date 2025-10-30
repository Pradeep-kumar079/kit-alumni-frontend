import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "./UserDetails.css";

// ✅ Your backend deployed on Render
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;


// ✅ Initialize socket connection
const socket = io(BACKEND_URL, {
  transports: ["websocket"],
  withCredentials: true,
});

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndConnections = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        // ✅ Always use full backend URL for Netlify → Render communication
        const userRes = await axios.get(`${BACKEND_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (userRes.data.success) {
          setUser(userRes.data.user);

          const connRes = await axios.get(
            `${BACKEND_URL}/api/user/connections/${userRes.data.user._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (connRes.data.success) setConnections(connRes.data.connections);

          // ✅ Notify socket that user is online
          socket.emit("user-online", userRes.data.user._id);
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndConnections();

    // ✅ Listen for real-time online/offline updates
    socket.on("userStatusUpdate", ({ userId, isOnline }) => {
      setConnections((prev) =>
        prev.map((conn) =>
          conn._id === userId ? { ...conn, isOnline } : conn
        )
      );
    });

    return () => {
      socket.off("userStatusUpdate");
    };
  }, []);

  const handleChat = (id) => {
    navigate(`/chat/${id}`);
  };

  if (loading) return <div className="loading">Loading user details...</div>;
  if (!user) return <div>No user details found</div>;

  return (
    <div className="userdetails-container">
      {/* ✅ User Card */}
      <div className="user-card">
        <img
          src={
            user.userimg
              ? `${BACKEND_URL}/uploads/${user.userimg}`
              : "/default-avatar.png"
          }
          alt="User"
          className="user-img"
        />
        <h2 className="user-name">{user.username}</h2>
        <p className="user-email">{user.email}</p>
        <p className="user-usn">USN: {user.usn}</p>
        <p className="user-role">Role: {user.role}</p>
      </div>

      {/* ✅ Connections Section */}
      <div className="connections-section">
        <h3 className="connections-title">Connections</h3>
        <div className="connections-cards">
          {connections.length > 0 ? (
            connections.map((conn) => (
              <div
                key={conn._id}
                className="connection-card"
                onClick={() => handleChat(conn._id)}
              >
                <div className="connection-avatar">
                  <img
                    src={
                      conn.userimg
                        ? `${BACKEND_URL}/uploads/${conn.userimg}`
                        : "/default-avatar.png"
                    }
                    alt={conn.username}
                    className="connection-img"
                  />
                  <span
                    className={`status-dot ${
                      conn.isOnline ? "online" : "offline"
                    }`}
                  ></span>
                </div>
                <div className="connection-info">
                  <h4 className="connection-name">{conn.username}</h4>
                  <p className="connection-usn">{conn.usn}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="no-connections">No connections found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
