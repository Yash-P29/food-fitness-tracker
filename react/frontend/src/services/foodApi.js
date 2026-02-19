import axios from "axios";

export const foodAPI = axios.create({
  baseURL: "http://127.0.0.1:8001",
});
