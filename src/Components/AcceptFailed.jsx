import React from "react";
import { Link } from "react-router-dom";

const AcceptFailed = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "80px" }}>
      <h1 style={{ color: "red" }}>❌ Connection Rejected or Expired</h1>
      <p>The request was rejected or the link is invalid.</p>
      <Link to="/students" style={{ color: "#007bff", textDecoration: "none" }}>
        Go back to Students
      </Link>
    </div>
  );
};

export default AcceptFailed;
