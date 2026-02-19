from pydantic import BaseModel

class FoodLog(BaseModel):
    food_name: str
    grams: float
