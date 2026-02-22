import os
import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv("postgresql://faf_db_2gni_user:gCgQ5wVJV9T6cMFvujWkgtcrupryjnGa@dpg-d6da05fgi27c738epimg-a/faf_db_2gni")

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    return conn