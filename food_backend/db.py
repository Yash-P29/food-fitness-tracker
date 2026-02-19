import pymysql

def get_db():
    return pymysql.connect(
        host="localhost",
        user="fitness_user",
        password="fitness123",
        database="fitness_app",
        cursorclass=pymysql.cursors.DictCursor
    )
