import React from "react";
import { Link } from "react-router-dom";

const AcceptSuccess = () => {
  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "100px",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "green", marginBottom: "10px" }}>
        ✅ Connection Accepted!
      </h1>
      <p style={{ fontSize: "18px", color: "#333" }}>
        You’re now successfully connected with this user.
      </p>

      <Link
        to="/students"
        style={{
          display: "inline-block",
          marginTop: "20px",
          backgroundColor: "#007bff",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: "6px",
          textDecoration: "none",
          transition: "0.3s ease",
        }}
        onMouseEnter={(e) => (e.target.style.backgroundColor = "#0056b3")}
        onMouseLeave={(e) => (e.target.style.backgroundColor = "#007bff")}
      >
        Go Back to Students
      </Link>
    </div>
  );
};

export default AcceptSuccess;
