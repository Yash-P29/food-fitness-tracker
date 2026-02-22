import sqlite3

def get_db():
    conn = sqlite3.connect("exercise.db")
    conn.row_factory = sqlite3.Row

    # Create tables if they don't exist
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workout_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        exercise_name TEXT,
        sets INTEGER,
        reps INTEGER,
        weight REAL,
        duration REAL,
        calories REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS base_workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        weekday TEXT,
        exercise_name TEXT,
        sets INTEGER,
        reps INTEGER
    )
    """)

    conn.commit()
    return conn