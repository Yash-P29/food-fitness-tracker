import pymysql

def get_db():
    return pymysql.connect(
        host="localhost",
        user="fitness_user",
        password="fitness123",
        database="fitness_app",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor  # 🔥 THIS IS THE FIX
    )