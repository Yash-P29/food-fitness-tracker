from datetime import date
from database import get_db
from cardio_data import CARDIO_MAP


def calculate_cardio_calories(exercise: str, minutes: float, body_weight: float) -> float:
    exercise = exercise.lower()

    if exercise not in CARDIO_MAP:
        raise ValueError("Unknown cardio exercise")

    met = float(CARDIO_MAP[exercise]["met"])
    calories = met * body_weight * (minutes / 60)
    return calories


def log_cardio_entry(user_id: int, exercise: str, minutes: float, body_weight: float):
    calories = calculate_cardio_calories(exercise, minutes, body_weight)

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO workout_log
        (user_id, date, exercise_type, exercise_name, calories)
        VALUES (%s, %s, 'cardio', %s, %s)
        """,
        (user_id, date.today(), exercise, calories)
    )

    db.commit()
    cursor.close()
    db.close()
    return calories


def get_daily_cardio_calories(user_id: int, log_date):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT COALESCE(SUM(calories), 0)
        FROM workout_log
        WHERE user_id = %s AND date = %s AND exercise_type = 'cardio'
        """,
        (user_id, log_date)
    )

    row = cursor.fetchone()

    cursor.close()
    db.close()

    # ✅ FIX: handle dict cursor safely
    return float(list(row.values())[0]) if row else 0.0

