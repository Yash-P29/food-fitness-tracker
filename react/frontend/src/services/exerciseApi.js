import axios from "axios";

export const exerciseAPI = axios.create({
  baseURL: "https://food-fitness-tracker-psut.onrender.com",
});
