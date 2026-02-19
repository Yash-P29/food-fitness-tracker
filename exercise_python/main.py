from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import date

from schemas import SetLog, CardioLog

from models import (
    # workout
    log_set,
    get_daily_calories,
    get_weekly_average,
    get_workout_streak,
    get_workout_history,
    update_workout_entry,

    # goals
    get_user_goals,
    update_user_goals,
    get_goal_progress,
    update_goal_completion,

    # base workout
    get_base_workout,
    add_base_workout_item,
    delete_base_workout_item,
    get_rest_day,
    set_rest_day,
    add_week_skip,
    get_today_plan,
)


from strength_data import load_strength, STRENGTH_MAP
from cardio_data import CARDIO_MAP, load_cardio
from cardio_models import log_cardio_entry, get_daily_cardio_calories

from database import get_db
from today_plan_models import (
    get_today_plan,
    set_daily_override,
    set_skip_day
)


# -------------------- #
# Lifespan
# -------------------- #
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_strength()
    load_cardio()
    yield


app = FastAPI(lifespan=lifespan)

# -------------------- #
# CORS
# -------------------- #
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


# -------------------- #
# Root
# -------------------- #
@app.get("/")
def root():
    return {"message": "Exercise API running"}


# =========================================================
# WORKOUT LOGGING
# =========================================================

@app.post("/workout/log-set")
def log_workout_set(user_id: int, body_weight: float, data: SetLog):
    calories = log_set(
        user_id=user_id,
        log_date=date.today(),
        data=data,
        body_weight=body_weight,
    )

    update_goal_completion(user_id, date.today())

    return {
        "status": "success",
        "calories_burned": round(calories, 2),
    }


@app.post("/cardio/log")
def log_cardio(user_id: int, body_weight: float, data: CardioLog):
    calories = log_cardio_entry(
        user_id=user_id,
        exercise=data.exercise,
        minutes=data.duration_minutes,
        body_weight=body_weight,
    )

    update_goal_completion(user_id, date.today())

    return {
        "status": "success",
        "calories_burned": round(calories, 2),
    }


# =========================================================
# WORKOUT HISTORY (CRUD)
# =========================================================

@app.get("/workout/history")
def workout_history(user_id: int, date: str | None = None):
    if date is None:
        date = date.today()
    return get_workout_history(user_id, date)


@app.put("/workout/update")
def update_workout(
    entry_id: int,
    reps: int | None = None,
    weight_kg: float | None = None,
    duration_min: float | None = None,
):
    success = update_workout_entry(
        entry_id=entry_id,
        reps=reps,
        weight_kg=weight_kg,
        duration_min=duration_min,
    )

    if not success:
        return {"status": "no_changes"}

    return {"status": "updated"}


@app.delete("/workout/delete")
def delete_workout(entry_id: int):
    db = get_db()
    cursor = db.cursor()

    cursor.execute("DELETE FROM workout_log WHERE id = %s", (entry_id,))
    db.commit()

    cursor.close()
    db.close()

    update_goal_completion(1, date.today())

    return {"status": "deleted"}


# =========================================================
# DAILY + WEEKLY STATS
# =========================================================

@app.get("/workout/daily-summary")
def daily_summary(user_id: int, date: str | None = None):
    if date is None:
        date = date.today()

    strength = get_daily_calories(user_id, date)
    cardio = get_daily_cardio_calories(user_id, date)

    return {
        "user_id": user_id,
        "calories_burned": round(strength + cardio, 2),
    }


@app.get("/workout/weekly-average")
def weekly_average(user_id: int):
    avg = get_weekly_average(user_id)
    return {"weekly_avg_calories": round(avg, 2)}


@app.get("/workout/streak")
def workout_streak(user_id: int):
    return {"current_streak_days": get_workout_streak(user_id)}


# =========================================================
# EXERCISE SEARCH (AUTOCOMPLETE)
# =========================================================

@app.get("/search/exercises")
def search_exercises(q: str):
    q = q.lower().strip()

    strength = [e for e in STRENGTH_MAP.keys() if q in e]
    cardio = [e for e in CARDIO_MAP.keys() if q in e]

    results = (
        [{"name": e, "type": "strength"} for e in strength] +
        [{"name": e, "type": "cardio"} for e in cardio]
    )

    # optional: limit results
    return results[:20]


@app.get("/exercises/strength")
def list_strength_exercises(q: str | None = None):
    exercises = sorted(STRENGTH_MAP.keys())
    if q:
        q = q.lower()
        exercises = [e for e in exercises if q in e]
    return exercises


@app.get("/exercises/cardio")
def list_cardio_exercises(q: str | None = None):
    exercises = sorted(CARDIO_MAP.keys())
    if q:
        q = q.lower()
        exercises = [e for e in exercises if q in e]
    return exercises

@app.get("/search/exercises")
def search_exercises(q: str):
    q = q.lower().strip()

    strength = [e for e in STRENGTH_MAP.keys() if q in e]
    cardio = [e for e in CARDIO_MAP.keys() if q in e]

    results = (
        [{"name": e, "type": "strength"} for e in strength] +
        [{"name": e, "type": "cardio"} for e in cardio]
    )

    return results[:20]


# =========================================================
# GOALS
# =========================================================

@app.get("/goals")
def read_goals(user_id: int):
    return get_user_goals(user_id)


@app.post("/goals/update")
def update_goals(user_id: int, burn_goal: int, eat_goal: int):
    update_user_goals(user_id, burn_goal, eat_goal)
    update_goal_completion(user_id, date.today())
    return {"status": "ok"}


@app.get("/goals/progress")
def goal_progress(user_id: int, date: str):
    return get_goal_progress(user_id, date)


# =========================================================
# BASE WORKOUT TEMPLATE
# =========================================================

@app.get("/base-workout")
def read_base_workout(user_id: int, weekday: int):
    return {
        "weekday": weekday,
        "is_rest_day": get_rest_day(user_id, weekday),
        "items": get_base_workout(user_id, weekday),
    }


@app.post("/base-workout/add")
def add_base_workout(
    user_id: int,
    weekday: int,
    exercise_name: str,
    exercise_type: str,
    order_index: int = 0,
):
    add_base_workout_item(
        user_id=user_id,
        weekday=weekday,
        exercise_name=exercise_name,
        exercise_type=exercise_type,
        order_index=order_index,
    )
    return {"status": "ok"}


@app.delete("/base-workout/delete")
def remove_base_workout(item_id: int):
    delete_base_workout_item(item_id)
    return {"status": "deleted"}


@app.post("/base-workout/rest-day")
def toggle_rest_day(user_id: int, weekday: int, is_rest_day: bool):
    set_rest_day(user_id, weekday, is_rest_day)
    return {"status": "ok", "is_rest_day": is_rest_day}

# =========================================================
# TODAY PLAN
# =========================================================

@app.get("/today-plan")
def today_plan(user_id: int, date: str):
    return get_today_plan(user_id, date)


@app.post("/today-plan/rest-day")
def today_plan_rest_day(user_id: int, date: str, is_rest_day: bool):
    set_daily_override(user_id, date, is_rest_day)
    return {"status": "ok", "date": date, "is_rest_day": is_rest_day}


@app.post("/today-plan/skip")
def today_plan_skip(user_id: int, date: str):
    set_skip_day(user_id, date)
    return {"status": "ok", "date": date, "skipped_to": "tomorrow"}

# =========================================================
# TIMELINE (EXERCISE + FOOD)
# =========================================================

@app.get("/timeline")
def daily_timeline(user_id: int, date: str):
    from models import get_workout_history
    from food_backend.food_models import get_food_history

    exercises = get_workout_history(user_id, date)
    food = get_food_history(user_id, date)

    timeline = exercises + food
    timeline.sort(key=lambda x: x["id"], reverse=True)

    return timeline

from datetime import datetime

@app.get("/plan/today")
def get_today_plan(user_id: int, date_str: str):
    # date_str format: "YYYY-MM-DD"
    dt = datetime.strptime(date_str, "%Y-%m-%d").date()

    # Monday=0 ... Sunday=6 (same as your frontend)
    weekday = (dt.weekday())

    return {
        "date": date_str,
        "weekday": weekday,
        "is_rest_day": get_rest_day(user_id, weekday),
        "items": get_base_workout(user_id, weekday),
    }

from datetime import datetime

# =========================================================
# WEEKLY SKIP + TODAY PLAN
# =========================================================

@app.get("/today-plan")
def today_plan(user_id: int, date: str):
    d = datetime.strptime(date, "%Y-%m-%d").date()
    return get_today_plan(user_id, d)


@app.post("/week/skip")
def skip_today(user_id: int, date: str):
    d = datetime.strptime(date, "%Y-%m-%d").date()
    add_week_skip(user_id, d)
    return {"status": "ok", "skipped_date": date}
