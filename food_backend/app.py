from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import date as dt
from db import get_db
from food_schema import FoodLog
from food_models import log_food_entry, get_daily_food_calories
from food_service import search_foods, get_food_details
from food_models import get_food_history
from food_models import delete_food_entry
app = FastAPI(title="Food API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Food API running"}

# --------------------
# Log food
# --------------------
@app.post("/food/log")
def log_food(user_id: int, data: FoodLog):
    calories = log_food_entry(
        user_id=user_id,
        food_name=data.food_name,
        grams=data.grams
    )

    return {
        "user_id": user_id,
        "food": data.food_name,
        "grams": data.grams,
        "calories": round(calories, 2)
    }

# --------------------
# Daily food calories
# --------------------
@app.get("/food/daily")
def food_daily(user_id: int, date: str | None = None):
    if date is None:
        date = dt.today()

    calories = get_daily_food_calories(user_id, date)

    return {
        "user_id": user_id,
        "date": str(date),
        "calories_consumed": round(calories, 2)
    }

# --------------------
# Search / details
# --------------------
@app.get("/food/search")
def food_search(q: str):
    return search_foods(q)

@app.get("/food/details")
def food_details(name: str):
    return get_food_details(name)
# -------------------- #
# Food search (autocomplete)
# -------------------- #
@app.get("/food/search")
def search_food(q: str):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT food_name
        FROM foods
        WHERE food_name LIKE %s
        ORDER BY food_name
        LIMIT 10
        """,
        (f"%{q}%",)
    )

    rows = cursor.fetchall()

    cursor.close()
    db.close()

    return [r[0] for r in rows]

@app.get("/food/history")
def food_history(user_id: int, date: str | None = None):
    if date is None:
        date = dt.today()
    return get_food_history(user_id, date)

@app.delete("/food/delete")
def delete_food(entry_id: int):
    db = get_db()
    cursor = db.cursor()

    cursor.execute("DELETE FROM food_log WHERE id = %s", (entry_id,))
    db.commit()

    cursor.close()
    db.close()
    return {"success": True}