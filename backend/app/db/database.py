from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv
import os

# 1. Load the .env file
load_dotenv()

# 2. Retrieve the URL from environment variables
# We provide a fallback just in case the .env is missing
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("CRITICAL: DATABASE_URL not found in .env file!")

# 3. Create the Engine
engine = create_engine(DATABASE_URL, echo=False) # Set echo=False in prod to clean up logs

def create_db_and_tables():
    # This automatically syncs your models.py to MySQL
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session