from app.db.database import init_db
import sys

def startup():
    try:
        print("🔗 Connecting to MySQL and creating tables...")
        init_db()
        print("✅ Database initialized successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    startup()