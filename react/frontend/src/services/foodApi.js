import axios from "axios";

export const foodAPI = axios.create({
  baseURL: "https://food-fitness-tracker-1.onrender.com",
});
