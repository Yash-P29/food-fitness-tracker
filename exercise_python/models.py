from datetime import date, timedelta
from database import get_db
from strength_data import STRENGTH_MAP
from cardio_data import CARDIO_MAP
from utils import calories_strength


# =========================================================
# WORKOUT LOGGING
# =========================================================

def log_set(user_id: int, log_date: date, data, body_weight: float):
    exercise_name = data.exercise_name.lower()

    # ---------- STRENGTH ----------
    if data.exercise_type == "strength":
        if exercise_name not in STRENGTH_MAP:
            raise ValueError("Unknown strength exercise")

        body_factor = STRENGTH_MAP[exercise_name]["body_factor"]
        rom = STRENGTH_MAP[exercise_name]["rom"]

        calories = calories_strength(
            float(body_weight),
            float(body_factor),
            float(data.weight_kg),
            float(rom),
            int(data.reps)
        )

        duration_min = None

    # ---------- CARDIO ----------
    elif data.exercise_type == "cardio":
        entry = CARDIO_MAP.get(exercise_name)
        if not entry:
            raise ValueError("Unknown cardio exercise")

        met = entry["met"]
        if isinstance(met, list):
            met = met[0]

        duration_min = float(data.duration_min)
        calories = float(met) * float(body_weight) * duration_min / 60.0

    else:
        raise ValueError("Invalid exercise type")

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO workout_log
        (user_id, date, exercise_name, exercise_type,
         set_number, weight_kg, reps, duration_min, calories)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            user_id,
            log_date,
            data.exercise_name,
            data.exercise_type,
            data.set_number,
            data.weight_kg,
            data.reps,
            duration_min,
            calories
        )
    )

    cursor.execute(
        """
        INSERT INTO daily_summary (user_id, date, calories_burned)
        VALUES (%s,%s,%s)
        ON DUPLICATE KEY UPDATE
        calories_burned = calories_burned + VALUES(calories_burned)
        """,
        (user_id, log_date, calories)
    )

    db.commit()
    cursor.close()
    db.close()

    update_goal_completion(user_id, log_date)

    return float(calories)


# =========================================================
# DAILY / WEEKLY STATS
# =========================================================

def get_daily_calories(user_id: int, log_date):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT COALESCE(calories_burned, 0) AS total
        FROM daily_summary
        WHERE user_id = %s AND date = %s
        """,
        (user_id, log_date)
    )

    total = float(cursor.fetchone()["total"])
    cursor.close()
    db.close()

    return total


def get_weekly_average(user_id: int):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT COALESCE(SUM(calories_burned), 0) AS total
        FROM daily_summary
        WHERE user_id = %s
          AND date >= CURDATE() - INTERVAL 6 DAY
        """,
        (user_id,)
    )

    total = float(cursor.fetchone()["total"])
    cursor.close()
    db.close()

    return total / 7.0


def get_workout_streak(user_id: int):
    db = get_db()
    cursor = db.cursor()

    streak = 0
    day = date.today()

    while True:
        cursor.execute(
            """
            SELECT goal_completed
            FROM daily_summary
            WHERE user_id = %s AND date = %s
            """,
            (user_id, day)
        )

        row = cursor.fetchone()
        if not row or row["goal_completed"] != 1:
            break

        streak += 1
        day -= timedelta(days=1)

    cursor.close()
    db.close()
    return streak


# =========================================================
# WORKOUT HISTORY
# =========================================================

def get_workout_history(user_id: int, log_date=None):
    db = get_db()
    cursor = db.cursor()

    if log_date:
        cursor.execute(
            """
            SELECT id, exercise_name, exercise_type, calories, date
            FROM workout_log
            WHERE user_id = %s AND date = %s
            ORDER BY id DESC
            """,
            (user_id, log_date)
        )
    else:
        cursor.execute(
            """
            SELECT id, exercise_name, exercise_type, calories, date
            FROM workout_log
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
            "name": r["exercise_name"],
            "type": r["exercise_type"],
            "calories": float(r["calories"]),
            "time": "—",
            "date": str(r["date"]),
        }
        for r in rows
    ]


def update_workout_entry(entry_id: int, reps=None, weight_kg=None, duration_min=None):
    db = get_db()
    cursor = db.cursor()

    updates = []
    values = []

    if reps is not None:
        updates.append("reps = %s")
        values.append(reps)

    if weight_kg is not None:
        updates.append("weight_kg = %s")
        values.append(weight_kg)

    if duration_min is not None:
        updates.append("duration_min = %s")
        values.append(duration_min)

    if not updates:
        cursor.close()
        db.close()
        return False

    values.append(entry_id)

    cursor.execute(
        f"""
        UPDATE workout_log
        SET {", ".join(updates)}
        WHERE id = %s
        """,
        tuple(values)
    )

    db.commit()
    cursor.close()
    db.close()
    return True


# =========================================================
# GOALS
# =========================================================

def get_user_goals(user_id: int):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT burn_goal, eat_goal
        FROM user_goals
        WHERE user_id = %s
        """,
        (user_id,)
    )

    row = cursor.fetchone()

    if not row:
        cursor.execute(
            """
            INSERT INTO user_goals (user_id, burn_goal, eat_goal)
            VALUES (%s, %s, %s)
            """,
            (user_id, 500, 2000)
        )
        db.commit()
        burn_goal, eat_goal = 500, 2000
    else:
        burn_goal = int(row["burn_goal"])
        eat_goal = int(row["eat_goal"])

    cursor.close()
    db.close()

    return {"burn_goal": burn_goal, "eat_goal": eat_goal}


def update_user_goals(user_id: int, burn_goal: int, eat_goal: int):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO user_goals (user_id, burn_goal, eat_goal)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
          burn_goal = VALUES(burn_goal),
          eat_goal = VALUES(eat_goal)
        """,
        (user_id, int(burn_goal), int(eat_goal))
    )

    db.commit()
    cursor.close()
    db.close()


def get_goal_progress(user_id: int, log_date):
    db = get_db()
    cursor = db.cursor()

    # -----------------------
    # Burned calories (safe)
    # -----------------------
    cursor.execute(
        """
        SELECT COALESCE(calories_burned, 0) AS burned
        FROM daily_summary
        WHERE user_id = %s AND date = %s
        """,
        (user_id, log_date),
    )

    row = cursor.fetchone()
    burned = float(row["burned"]) if row and row["burned"] is not None else 0.0

    # -----------------------
    # Eaten calories (safe)
    # -----------------------
    cursor.execute(
        """
        SELECT COALESCE(SUM(calories), 0) AS eaten
        FROM food_log
        WHERE user_id = %s AND date = %s
        """,
        (user_id, log_date),
    )

    row = cursor.fetchone()
    eaten = float(row["eaten"]) if row and row["eaten"] is not None else 0.0

    # -----------------------
    # Goals (safe)
    # -----------------------
    cursor.execute(
        """
        SELECT burn_goal, eat_goal
        FROM user_goals
        WHERE user_id = %s
        """,
        (user_id,),
    )

    row = cursor.fetchone()
    burn_goal = int(row["burn_goal"]) if row and row["burn_goal"] is not None else 0
    eat_goal = int(row["eat_goal"]) if row and row["eat_goal"] is not None else 0

    cursor.close()
    db.close()

    return {
        "burned": burned,
        "eaten": eaten,
        "burn_goal": burn_goal,
        "eat_goal": eat_goal,
        "burn_progress": round((burned / burn_goal) * 100, 1) if burn_goal else 0,
        "eat_progress": round((eaten / eat_goal) * 100, 1) if eat_goal else 0,
    }

def update_goal_completion(user_id: int, log_date):
    db = get_db()
    cursor = db.cursor()

    # -----------------------
    # Burned calories (safe)
    # -----------------------
    cursor.execute(
        """
        SELECT COALESCE(calories_burned, 0) AS burned
        FROM daily_summary
        WHERE user_id = %s AND date = %s
        """,
        (user_id, log_date),
    )

    row = cursor.fetchone()
    burned = float(row["burned"]) if row and row["burned"] is not None else 0.0

    # -----------------------
    # Eaten calories (safe)
    # -----------------------
    cursor.execute(
        """
        SELECT COALESCE(SUM(calories), 0) AS eaten
        FROM food_log
        WHERE user_id = %s AND date = %s
        """,
        (user_id, log_date),
    )

    row = cursor.fetchone()
    eaten = float(row["eaten"]) if row and row["eaten"] is not None else 0.0

    # -----------------------
    # Goals (safe)
    # -----------------------
    cursor.execute(
        """
        SELECT burn_goal, eat_goal
        FROM user_goals
        WHERE user_id = %s
        """,
        (user_id,),
    )

    row = cursor.fetchone()
    burn_goal = int(row["burn_goal"]) if row and row["burn_goal"] is not None else 0
    eat_goal = int(row["eat_goal"]) if row and row["eat_goal"] is not None else 0

    completed = int(burned >= burn_goal and eaten <= eat_goal)

    # -----------------------
    # IMPORTANT:
    # If daily_summary row doesn't exist, create it
    # -----------------------
    cursor.execute(
        """
        INSERT INTO daily_summary (user_id, date, calories_burned, goal_completed)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
          goal_completed = VALUES(goal_completed)
        """,
        (user_id, log_date, burned, completed),
    )

    db.commit()
    cursor.close()
    db.close()


from database import get_db

# =========================================================
# BASE WORKOUT TEMPLATE
# =========================================================

from database import get_db


def get_base_workout(user_id: int, weekday: int):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT id, exercise_name, exercise_type, order_index
        FROM base_workouts
        WHERE user_id = %s AND weekday = %s
        ORDER BY order_index ASC, id ASC
        """,
        (user_id, weekday),
    )

    rows = cursor.fetchall()
    cursor.close()
    db.close()

    return [
        {
            "id": r["id"],
            "exercise_name": r["exercise_name"],
            "exercise_type": r["exercise_type"],
            "order_index": r["order_index"],
        }
        for r in rows
    ]


def add_base_workout_item(
    user_id: int,
    weekday: int,
    exercise_name: str,
    exercise_type: str,
    order_index: int = 0
):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO base_workouts
        (user_id, weekday, exercise_name, exercise_type, order_index)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user_id, weekday, exercise_name.lower(), exercise_type, order_index),
    )

    db.commit()
    cursor.close()
    db.close()


def delete_base_workout_item(item_id: int):
    db = get_db()
    cursor = db.cursor()

    cursor.execute("DELETE FROM base_workouts WHERE id = %s", (item_id,))
    db.commit()

    cursor.close()
    db.close()

def get_rest_day(user_id: int, weekday: int) -> bool:
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT is_rest_day
        FROM rest_days
        WHERE user_id = %s AND weekday = %s
        """,
        (user_id, weekday),
    )

    row = cursor.fetchone()

    cursor.close()
    db.close()

    return bool(row["is_rest_day"]) if row else False


def set_rest_day(user_id: int, weekday: int, is_rest_day: bool):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO rest_days (user_id, weekday, is_rest_day)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
          is_rest_day = VALUES(is_rest_day)
        """,
        (user_id, weekday, int(is_rest_day)),
    )

    db.commit()
    cursor.close()
    db.close()

# -------------------------
# Rest Day flag
# -------------------------

def get_rest_day(user_id: int, weekday: int):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT is_rest_day
        FROM base_workout_flags
        WHERE user_id = %s AND weekday = %s
        """,
        (user_id, weekday),
    )

    row = cursor.fetchone()

    cursor.close()
    db.close()

    if not row:
        return False

    return bool(row["is_rest_day"])


def set_rest_day(user_id: int, weekday: int, is_rest_day: bool):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO base_workout_flags (user_id, weekday, is_rest_day)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
          is_rest_day = VALUES(is_rest_day)
        """,
        (user_id, weekday, int(is_rest_day)),
    )

    db.commit()
    cursor.close()
    db.close()

from datetime import datetime, date, timedelta
from database import get_db

# =========================================================
# WEEKLY SKIP LOGIC (week-only shifting)
# =========================================================

def get_week_start(d: date) -> date:
    # Monday = 0
    return d - timedelta(days=d.weekday())


def add_week_skip(user_id: int, skip_date: date):
    week_start = get_week_start(skip_date)

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT IGNORE INTO weekly_skips (user_id, week_start, skipped_date)
        VALUES (%s, %s, %s)
        """,
        (user_id, week_start, skip_date),
    )

    db.commit()
    cursor.close()
    db.close()


def get_week_skips(user_id: int, week_start: date):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT skipped_date
        FROM weekly_skips
        WHERE user_id = %s AND week_start = %s
        ORDER BY skipped_date ASC
        """,
        (user_id, week_start),
    )

    rows = cursor.fetchall()
    cursor.close()
    db.close()

    return [r["skipped_date"] for r in rows]


def get_shifted_weekday(user_id: int, d: date) -> int:
    """
    Returns which weekday base plan should be used after applying skips.
    Mon=0..Sun=6
    """
    week_start = get_week_start(d)
    skips = get_week_skips(user_id, week_start)

    # count skips BEFORE this date in the same week
    shift = 0
    for s in skips:
        if s < d:
            shift += 1

    weekday = d.weekday()  # Mon=0..Sun=6
    shifted = weekday - shift

    # clamp
    if shifted < 0:
        shifted = 0

    return shifted


def is_date_skipped(user_id: int, d: date) -> bool:
    week_start = get_week_start(d)

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT id
        FROM weekly_skips
        WHERE user_id = %s AND week_start = %s AND skipped_date = %s
        LIMIT 1
        """,
        (user_id, week_start, d),
    )

    row = cursor.fetchone()
    cursor.close()
    db.close()

    return row is not None


def get_today_plan(user_id: int, d: date):
    """
    Returns:
    - is_skipped_today (week-only)
    - is_rest_day (base weekday rest day, but shifted)
    - weekday_used (shifted weekday)
    - items (base workout for shifted weekday)
    """
    weekday_used = get_shifted_weekday(user_id, d)

    # IMPORTANT:
    # Rest day is based on the weekday plan being used (shifted weekday)
    rest = get_rest_day(user_id, weekday_used)

    # If today is skipped, we show nothing
    skipped_today = is_date_skipped(user_id, d)

    if skipped_today:
        return {
            "date": str(d),
            "weekday_used": weekday_used,
            "is_skipped_today": True,
            "is_rest_day": False,
            "items": [],
        }

    if rest:
        return {
            "date": str(d),
            "weekday_used": weekday_used,
            "is_skipped_today": False,
            "is_rest_day": True,
            "items": [],
        }

    items = get_base_workout(user_id, weekday_used)

    return {
        "date": str(d),
        "weekday_used": weekday_used,
        "is_skipped_today": False,
        "is_rest_day": False,
        "items": items,
    }
