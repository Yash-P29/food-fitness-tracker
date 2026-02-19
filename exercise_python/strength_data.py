import csv
import os

STRENGTH_MAP = {}

BASE_DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(BASE_DIR, "data", "strength_exercises.csv")

def load_strength():
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            STRENGTH_MAP[row["exercise_name"].lower()] = {
                "body_factor": float(row["body_factor"]),
                "rom": float(row["rom_meters"]),
            }

    print(f"Loaded {len(STRENGTH_MAP)} strength exercises")
