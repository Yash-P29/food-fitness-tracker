# food-fitness-tracker

FaF is a modern full-stack Food + Workout tracker where you can log meals, track calories, log workouts, maintain streaks, and plan workouts for each weekday using a Base Workout system.

It combines **food + exercise tracking in one dashboard**, with a clean UI and smart features like autocomplete, timeline history, and weekly workout planning.

---

## ✨ Features

### 🧠 Smart Logging
- Log **Food** with grams → calories calculated automatically
- Log **Strength workouts** (weight + reps)
- Log **Cardio workouts** (duration)

### 🔍 Autocomplete Search
- Food search suggestions while typing
- Exercise search suggestions (Strength + Cardio)

### 📌 Base Workout System (Weekly Plan)
- Set a default workout plan for each weekday (Mon–Sun)
- Reuses your plan automatically every week
- Mark a day as **Rest Day**
- Today Plan shows what you should do today

### 📜 Timeline + History
- Daily Timeline merges food + workout logs
- Edit or delete entries
- History panel shows Food and Workout logs separately

### 🔥 Streak + Goals
- Workout streak tracking
- Daily goals for burned calories + eaten calories
- Shows goal progress on dashboard

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- Axios
- Custom UI styling (Charcoal theme + gradients)

### Backend
- Python (FastAPI)
- MySQL (or compatible SQL database)

### Data
- Strength exercise dataset (CSV)
- Cardio dataset (CSV)

---

## 📁 Project Structure

```txt
FaF food and fitness tracker/
│
├── exercise_python/      # Workout backend (FastAPI)
├── food_backend/         # Food backend (FastAPI)
└── react/frontend/       # React UI (Vite)
