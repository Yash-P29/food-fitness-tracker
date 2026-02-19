import axios from "axios";

export const exerciseAPI = axios.create({
  baseURL: "https://food-fitness-tracker-psut.onrender.com",
});

export const foodAPI = axios.create({
  baseURL: "https://food-fitness-tracker-1.onrender.com",
});
