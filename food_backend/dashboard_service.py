import requests
from datetime import date
from food_models import get_daily_food_calories

EXERCISE_BASE_URL = "http://127.0.0.1:8000"

def get_dashboard(user_id: int):
    today = date.today().isoformat()

    # Food calories (local DB / CSV)
    calories_eaten = get_daily_food_calories(user_id, today)

    # Exercise calories (API calls)
    burned = requests.get(
        f"{EXERCISE_BASE_URL}/workout/daily-summary",
        params={"user_id": user_id, "date": today}
    ).json()["calories_burned"]

    weekly_avg = requests.get(
        f"{EXERCISE_BASE_URL}/workout/weekly-average",
        params={"user_id": user_id}
    ).json()["weekly_avg_calories"]

    streak = requests.get(
        f"{EXERCISE_BASE_URL}/workout/streak",
        params={"user_id": user_id}
    ).json()["current_streak_days"]

    return {
        "user_id": user_id,
        "date": today,
        "calories_eaten": round(calories_eaten, 2),
        "calories_burned": round(burned, 2),
        "net_calories": round(calories_eaten - burned, 2),
        "weekly_avg_burned": round(weekly_avg, 2),
        "workout_streak": streak
    }
