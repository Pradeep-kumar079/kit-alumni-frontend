import axios from "axios";

const API = axios.create({
  baseURL: "https://kit-alumni-backend.onrender.com/api",
  withCredentials: true,
});

export default API;
