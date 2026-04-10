import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Pathing looks good!
dotenv_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

# Correctly fetching the key from your .env file
DATABASE_URL = os.getenv("DATABASE_URL")

# Safety check: if .env is missing the key, it will throw a clearer error here
if DATABASE_URL is None:
    raise ValueError("DATABASE_URL not found in environment variables. Check your .env file.")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()