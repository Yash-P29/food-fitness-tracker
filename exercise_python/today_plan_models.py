from datetime import datetime, timedelta
from database import get_db
from models import get_base_workout


def _weekday_from_date_str(date_str: str) -> int:
    # Python weekday(): Monday=0 ... Sunday=6
    return datetime.strptime(date_str, "%Y-%m-%d").weekday()


# =========================================================
# DAILY OVERRIDES (REST DAY for specific date)
# =========================================================

def get_daily_override(user_id: int, date_str: str):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT is_rest_day
        FROM daily_overrides
        WHERE user_id = %s AND date = %s
        """,
        (user_id, date_str),
    )

    row = cursor.fetchone()
    cursor.close()
    db.close()

    return bool(row["is_rest_day"]) if row else False


def set_daily_override(user_id: int, date_str: str, is_rest_day: bool):
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO daily_overrides (user_id, date, is_rest_day)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
          is_rest_day = VALUES(is_rest_day)
        """,
        (user_id, date_str, int(is_rest_day)),
    )

    db.commit()
    cursor.close()
    db.close()


# =========================================================
# SKIP DAY (shift today's plan to tomorrow)
# =========================================================

def set_skip_day(user_id: int, date_str: str):
    today = datetime.strptime(date_str, "%Y-%m-%d").date()
    tomorrow = today + timedelta(days=1)

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO plan_shifts (user_id, from_date, to_date)
        VALUES (%s, %s, %s)
        ON DUPLICATE KEY UPDATE
          to_date = VALUES(to_date)
        """,
        (user_id, str(today), str(tomorrow)),
    )

    db.commit()
    cursor.close()
    db.close()


def get_shifted_from_date(user_id: int, date_str: str):
    """
    If date_str is tomorrow and a shift exists:
    return yesterday's date as plan source.
    Otherwise return None.
    """
    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT from_date
        FROM plan_shifts
        WHERE user_id = %s AND to_date = %s
        """,
        (user_id, date_str),
    )

    row = cursor.fetchone()
    cursor.close()
    db.close()

    return str(row["from_date"]) if row else None


# =========================================================
# TODAY PLAN LOGIC
# =========================================================

def get_today_plan(user_id: int, date_str: str):
    # 1) check if this date is a rest day override
    is_rest_day = get_daily_override(user_id, date_str)
    if is_rest_day:
        return {
            "date": date_str,
            "source_date": date_str,
            "weekday": _weekday_from_date_str(date_str),
            "is_rest_day": True,
            "items": [],
        }

    # 2) check if this day should use a shifted plan
    shifted_from = get_shifted_from_date(user_id, date_str)

    if shifted_from:
        source_date = shifted_from
        weekday = _weekday_from_date_str(source_date)
    else:
        source_date = date_str
        weekday = _weekday_from_date_str(date_str)

    # 3) fetch base workout for that weekday
    items = get_base_workout(user_id, weekday)

    return {
        "date": date_str,
        "source_date": source_date,
        "weekday": weekday,
        "is_rest_day": False,
        "items": items,
    }
