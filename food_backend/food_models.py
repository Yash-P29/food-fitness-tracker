from datetime import date
from db import get_db
from food_service import get_food_row
import requests


# -------------------------
# Calories calculation
# -------------------------
def calculate_food_calories(food_name: str, grams: float) -> float:
    row = get_food_row(food_name)
    if row is None:
        raise ValueError("Food not found")

    calories_per_100g = float(row["calories_kcal"])
    return (calories_per_100g / 100.0) * grams


# -------------------------
# Log food entry
# -------------------------
def log_food_entry(user_id: int, food_name: str, grams: float):
    calories = calculate_food_calories(food_name, grams)

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO food_log (user_id, date, food_name, calories)
        VALUES (%s, %s, %s, %s)
        """,
        (user_id, date.today(), food_name, calories)
    )

    db.commit()
    cursor.close()
    db.close()

    # 🔁 notify exercise service (goal recompute)
    _notify_goal_recompute(user_id)

    return calories


# -------------------------
# Daily food calories
# -------------------------
def get_daily_food_calories(user_id: int, log_date):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT COALESCE(SUM(calories), 0) AS total
        FROM food_log
        WHERE user_id = %s AND date = %s
        """,
        (user_id, log_date)
    )

    row = cursor.fetchone()

    cursor.close()
    db.close()

    return float(row["total"]) if row and row["total"] is not None else 0.0


# -------------------------
# Delete food entry
# -------------------------
def delete_food_entry(entry_id: int, user_id: int):
    db = get_db()
    cursor = db.cursor()

    cursor.execute("DELETE FROM food_log WHERE id = %s", (entry_id,))
    db.commit()

    cursor.close()
    db.close()

    # 🔁 recompute goals after delete
    _notify_goal_recompute(user_id)


# -------------------------
# Food history
# -------------------------
def get_food_history(user_id: int, log_date=None):
    db = get_db()
    cursor = db.cursor()

    if log_date:
        cursor.execute(
            """
            SELECT id, food_name, calories, date
            FROM food_log
            WHERE user_id = %s AND date = %s
            ORDER BY id DESC
            """,
            (user_id, log_date)
        )
    else:
        cursor.execute(
            """
            SELECT id, food_name, calories, date
            FROM food_log
            WHERE user_id = %s
            ORDER BY id DESC
            """,
            (user_id,)
        )

    rows = cursor.fetchall()
    cursor.close()
    db.close()

    return [
        {
            "id": r["id"],
            "name": r["food_name"],
            "type": "food",
            "calories": float(r["calories"]),
            "time": "—",
            "date": str(r["date"]),
        }
        for r in rows
    ]


# -------------------------
# Internal helper
# -------------------------
def _notify_goal_recompute(user_id: int):
    try:
        requests.post(
            "http://127.0.0.1:8000/goals/recompute",
            params={
                "user_id": user_id,
                "date": str(date.today()),
            },
            timeout=2,
        )
    except Exception as e:
        print("Goal recompute failed:", e)
