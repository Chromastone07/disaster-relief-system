"""
Quick diagnostic: verify inventory table exists and can be written to.
Run from backend directory: python db_check.py
"""
import sys
sys.path.insert(0, '.')

from database import engine, Base, SessionLocal
from models.auth import User
from models.disaster import DisasterReport, HelpRequest, Inventory
from models.volunteer import Volunteer, Assignment, Resource
from models.location import Location
from models.notification import Notification
from sqlalchemy import inspect, text

# 1. Create tables
print(">> Creating all tables...")
Base.metadata.create_all(bind=engine)
print("   Done.")

# 2. Check tables exist
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"\n>> Tables in DB: {tables}")

# 3. Try writing an inventory item directly
db = SessionLocal()
try:
    item = Inventory(item="Test Item", quantity=50, category="food", location="Warehouse A")
    db.add(item)
    db.commit()
    db.refresh(item)
    print(f"\n>> Inventory write SUCCESS. ID={item.id}, item={item.item}, qty={item.quantity}")

    # Clean up
    db.delete(item)
    db.commit()
    print("   Cleanup: test item deleted.")
except Exception as e:
    db.rollback()
    print(f"\n>> Inventory write FAILED: {e}")
finally:
    db.close()

print("\n>> Diagnostic complete.")
