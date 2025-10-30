import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./Chat.css";

// ✅ Auto-detect backend (Render or local)
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;


// ✅ Initialize socket connection
const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"], // allow fallback
  reconnection: true,
});

const Chat = ({ currentUserId, otherUserId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [receiver, setReceiver] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    socket.emit("user-online", currentUserId);

    const fetchReceiverAndMessages = async () => {
      try {
        const token = localStorage.getItem("token");

        // ✅ Fetch receiver info
        const receiverRes = await axios.get(`${BACKEND_URL}/api/user/${otherUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (receiverRes.data.success) setReceiver(receiverRes.data.user);

        // ✅ Fetch chat messages
        const chatRes = await axios.get(
          `${BACKEND_URL}/api/chat/${currentUserId}/${otherUserId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (chatRes.data.success) setMessages(chatRes.data.chats);
      } catch (err) {
        console.error("Error fetching chat data:", err);
      }
    };

    fetchReceiverAndMessages();

    // ✅ Socket listeners
    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data.chat]);
    });

    socket.on("message-edited", ({ chat }) => {
      setMessages((prev) => prev.map((m) => (m._id === chat._id ? chat : m)));
    });

    socket.on("message-deleted", ({ chatId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== chatId));
    });

    socket.on("userStatusUpdate", ({ userId, isOnline }) => {
      if (userId === otherUserId) setIsOnline(isOnline);
    });

    return () => {
      socket.off("receive-message");
      socket.off("message-edited");
      socket.off("message-deleted");
      socket.off("userStatusUpdate");
    };
  }, [currentUserId, otherUserId]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const msgData = {
      fromUserId: currentUserId,
      toUserId: otherUserId,
      message: input,
    };

    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { ...msgData, sender: currentUserId, _id: tempId },
    ]);

    try {
      const res = await axios.post(`${BACKEND_URL}/api/chat/send`, msgData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? res.data.chat : m))
      );
    } catch (err) {
      console.error("Send message error:", err);
    }

    socket.emit("send-message", msgData);
    setInput("");
  };

  const startEdit = (msg) => {
    if (!msg._id) return alert("This message isn't saved yet!");
    setEditingId(msg._id);
    setEditingText(msg.message);
  };

  const submitEdit = async (chatId) => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/chat/edit/${chatId}`,
        { message: editingText, userId: currentUserId },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setEditingId(null);
      setEditingText("");
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  const deleteMessage = async (chatId) => {
    if (!chatId) return alert("This message isn't saved yet!");
    try {
      await axios.delete(
        `${BACKEND_URL}/api/chat/delete/${chatId}/${currentUserId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setMessages((prev) => prev.filter((m) => m._id !== chatId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="whole-chat">
      <div className="chat-container">
        {/* ===== HEADER ===== */}
        <div className="chat-header">
          {receiver ? (
            <>
              <img
                src={
                  receiver.userimg
                    ? `${BACKEND_URL}/${receiver.userimg}`
                    : "/default.jpg"
                }
                alt={receiver.username}
                className="chat-header-img"
              />
              <div className="chat-header-info">
                <h3>{receiver.username}</h3>
                <p className={isOnline ? "status-online" : "status-offline"}>
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </>
          ) : (
            <p>Loading user...</p>
          )}
        </div>

        {/* ===== MESSAGES ===== */}
        <div className="chat-messages">
          {messages.map((msg, index) => {
            const isMe = msg.sender === currentUserId;
            return (
              <div
                key={msg._id || `temp-${index}`}
                className={`chat-message ${isMe ? "me" : "them"}`}
              >
                {editingId === msg._id ? (
                  <>
                    <input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                    />
                    <button onClick={() => submitEdit(msg._id)}>Save</button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span>{msg.message}</span>
                    {isMe && msg._id && (
                      <div className="chat-actions">
                        <button onClick={() => startEdit(msg)}>Edit</button>
                        <button onClick={() => deleteMessage(msg._id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ===== INPUT ===== */}
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>➤</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
