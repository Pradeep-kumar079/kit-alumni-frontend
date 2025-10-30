import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Students.css";
import Navbar from "./Navbar";

const Students = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🌐 Backend URL for Render deployment
  const base_url = process.env.REACT_APP_BACKEND_URL;


  useEffect(() => {
    const fetchStudentBatches = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("⚠️ No token found. Please login.");
          return;
        }

        const res = await axios.get(`${base_url}/api/student/all-students`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("📦 API Response:", res.data);

        if (res.data.success) {
          if (res.data.batches && res.data.batches.length > 0) {
            // ✅ Use batch array directly from backend
            setBatches(res.data.batches);
          } else if (res.data.students && res.data.students.length > 0) {
            // ✅ Fallback: group manually if only students array exists
            const grouped = {};
            res.data.students.forEach((s) => {
              if (!grouped[s.admissionyear]) grouped[s.admissionyear] = [];
              grouped[s.admissionyear].push(s);
            });

            const batchList = Object.keys(grouped).map((year) => ({
              admissionyear: year,
              students: grouped[year],
            }));

            setBatches(batchList);
          } else {
            console.warn("⚠️ No batch or student data found in response");
            setBatches([]);
          }
        } else {
          console.error("❌ API did not return success true");
        }
      } catch (err) {
        console.error("❌ Fetch error:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentBatches();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="batch-container">
      <Navbar />
      <h2>Find Batch By Admission Year :</h2>

      {batches.length === 0 ? (
        <p className="no-batch">No batches found yet.</p>
      ) : (
        <div className="allbatchs">
          {batches.map((batch, index) => (
            <div
              key={index}
              className="batch-box"
              onClick={() => navigate(`/findstudent/${batch.admissionyear}`)}
            >
              <h3>{batch.admissionyear}</h3>
              {/* <p>{batch.students?.length || 0} Students</p> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Students;
