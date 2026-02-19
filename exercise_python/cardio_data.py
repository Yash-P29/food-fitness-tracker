import csv
import os

CARDIO_MAP = {}

BASE_DIR = os.path.dirname(__file__)
CSV_PATH = os.path.join(
    BASE_DIR,
    "data",
    "cardio_exercises_35_to_150kg_full.csv"
)


def load_cardio():
    CARDIO_MAP.clear()

    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row in reader:
            name = row["exercise_name"].lower()
            CARDIO_MAP[name] = row

    print(f"Loaded {len(CARDIO_MAP)} cardio exercises")


def calories_cardio(
    exercise_name: str,
    body_weight: float,
    duration_min: float
):
    name = exercise_name.lower()
    weight_key = f"calories_per_min_{int(round(body_weight))}kg"

    if name not in CARDIO_MAP:
        raise ValueError("Unknown cardio exercise")

    if weight_key not in CARDIO_MAP[name]:
        raise ValueError("Body weight out of supported range")

    cal_per_min = float(CARDIO_MAP[name][weight_key])
    return cal_per_min * duration_min
