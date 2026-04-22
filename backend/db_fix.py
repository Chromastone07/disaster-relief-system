import psycopg2
from database import DATABASE_URL
print('Connecting to', DATABASE_URL)
try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS skills VARCHAR;")
    cursor.execute("ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS location VARCHAR;")
    cursor.execute("ALTER TABLE resources ADD COLUMN IF NOT EXISTS location_id INTEGER;")
    print('Schema sync complete.')
except Exception as e:
    import traceback
    traceback.print_exc()
