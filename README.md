✨ Features
Smart Logging
Log Food with grams → calories calculated automatically
Log Strength workouts (weight + reps)
Log Cardio workouts (duration)
Autocomplete Search
Food search suggestions while typing
Exercise search suggestions (Strength + Cardio)
Base Workout System (Weekly Plan)
Set a default workout plan for each weekday (Mon–Sun)
Reuses your plan automatically every week
Mark a day as Rest Day
Today Plan shows what you should do today
Timeline + History
Daily Timeline merges food + workout logs
Edit or delete entries
History panel shows Food and Workout logs separately
Streak + Goals
Workout streak tracking
Daily goals for burned calories + eaten calories
Shows goal progress on dashboard

Tech Stack
Frontend

React (Vite)

Axios

Custom UI styling (Charcoal theme + gradients)

Backend

Python (FastAPI)

MySQL (or compatible SQL database)

Data

Strength exercise dataset (CSV)

Cardio dataset (CSV)

Project Structure
FaF food and fitness tracker/
│
├── exercise_python/      # Workout backend (FastAPI)
├── food_backend/         # Food backend (FastAPI)
└── react/frontend/       # React UI (Vite)

Setup Instructions
1) Clone the repo
git clone https://github.com/Yash-P29/food-fitness-tracker.git
cd "FaF food and fitness tracker"

Backend Setup (Exercise API)
1) Go into exercise backend
cd exercise_python

2) Create virtual environment
python -m venv venv
venv\Scripts\activate

3) Install requirements
pip install -r requirements.txt

4) Run backend
uvicorn main:app --reload --port 8000


Exercise backend runs at:

http://127.0.0.1:8000
 Backend Setup (Food API)
1) Go into food backend
cd food_backend

2) Create virtual environment
python -m venv venv
venv\Scripts\activate

3) Install requirements
pip install -r requirements.txt

4) Run backend
uvicorn app:app --reload --port 8001


Food backend runs at:

http://127.0.0.1:8001

Frontend Setup (React)
1) Go into frontend
cd react/frontend

2) Install dependencies
npm install

3) Run frontend
npm run dev

Frontend runs at:

http://localhost:5173

Database Setup

Both backends use a SQL database.

You must configure:

exercise_python/database.py

food_backend/db.py

Make sure your database has the required tables:

food_log

workout_log

base_workouts

rest_days (optional depending on implementation)

goals (if used)

API Endpoints (Main)
Exercise Backend (:8000)
Endpoint	Method	Description
/workout/log-set	POST	Log strength/cardio
/workout/history	GET	Workout history by date
/workout/delete	DELETE	Delete workout entry
/workout/update	PUT	Update workout entry
/workout/streak	GET	Current streak
/workout/daily-summary	GET	Burned calories for day
/base-workout	GET	Fetch weekday plan
/base-workout/add	POST	Add exercise to weekday
/base-workout/delete	DELETE	Delete exercise from weekday
/base-workout/rest-day	POST	Toggle rest day
/today-plan	GET	Today's plan based on weekday
Food Backend (:8001)
Endpoint	Method	Description
/food/log	POST	Log food entry
/food/history	GET	Food history by date
/food/delete	DELETE	Delete food entry
/food/update	PUT	Update grams
/food/search	GET	Food autocomplete
/food/daily	GET	Daily eaten calories

🚀 Future Roadmap

Planned improvements:
Weekly analytics dashboard (graphs + trends)
Better streak logic for food + workouts
Smarter exercise calorie calculation UI
Authentication (multi-user)
Deployment: Render/Railway/Vercel

Mobile-first layout improvements

👤 Author

Yash Patil
VIT Pune
