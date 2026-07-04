import sqlite3
conn = sqlite3.connect("foodbridge.db")
rows = conn.execute("SELECT id, email, otp_code, otp_sent_at, is_verified FROM users WHERE email = ?", ("user@example.com",)).fetchall()
for r in rows:
    print(r)
