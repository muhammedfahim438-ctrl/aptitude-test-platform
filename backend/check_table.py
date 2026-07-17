from django.db import connection

cursor = connection.cursor()
cursor.execute("PRAGMA table_info(exams_answerkey)")
for row in cursor.fetchall():
    print(row)