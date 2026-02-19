from database import get_db

def get_food_history_simple(user_id: int, log_date: str):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT id, food_name, calories, date
        FROM food_log
        WHERE user_id = %s AND date = %s
        ORDER BY id DESC
        """,
        (user_id, log_date),
    )

    rows = cursor.fetchall()
    cursor.close()
    db.close()

    return [
        {
            "id": r["id"],
            "type": "food",
            "name": r["food_name"],
            "calories": float(r["calories"]),
            "date": str(r["date"]),
        }
        for r in rows
    ]


def get_workout_history_simple(user_id: int, log_date: str):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT id, exercise_name, exercise_type, calories, date
        FROM workout_log
        WHERE user_id = %s AND date = %s
        ORDER BY id DESC
        """,
        (user_id, log_date),
    )

    rows = cursor.fetchall()
    cursor.close()
    db.close()

    return [
        {
            "id": r["id"],
            "type": "exercise",
            "subtype": r["exercise_type"],
            "name": r["exercise_name"],
            "calories": float(r["calories"]),
            "date": str(r["date"]),
        }
        for r in rows
    ]


def get_daily_timeline(user_id: int, log_date: str):
    food = get_food_history_simple(user_id, log_date)
    workouts = get_workout_history_simple(user_id, log_date)

    # merge
    merged = food + workouts

    # sort by id descending (approx timeline)
    merged.sort(key=lambda x: x["id"], reverse=True)

    return merged
