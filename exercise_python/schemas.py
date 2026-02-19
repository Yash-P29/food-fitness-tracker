from pydantic import BaseModel
from typing import Optional, Literal


class SetLog(BaseModel):
    exercise_name: str
    exercise_type: Literal["strength", "cardio"]

    # strength
    set_number: Optional[int] = None
    weight_kg: Optional[float] = None
    reps: Optional[int] = None
    body_factor: Optional[float] = None
    rom: Optional[float] = None

    # cardio
    duration_min: Optional[float] = None


class CardioLog(BaseModel):
    exercise: str
    duration_minutes: float

class BaseWorkoutItem(BaseModel):
    exercise_name: str
    exercise_type: str  # "strength" or "cardio"
    order_index: int | None = 0
