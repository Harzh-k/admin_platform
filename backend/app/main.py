import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session
from app.db.database import create_db_and_tables, engine
from app.api import admin, proxy, lead, member 
from app.services.pricing import get_live_exchange_rate

# --- LIFESPAN TASK: AUTO-SYNC EVERY 24 HOURS ---
async def daily_sync_loop():
    while True:
        try:
            with Session(engine) as db:
                print("🔄 Starting Global Pricing & FX Sync...")
                get_live_exchange_rate(db)
                print("✅ Sync Complete. Next sync in 24 hours.")
        except Exception as e:
            print(f"⚠️ Sync Loop Error: {e}")
        
        await asyncio.sleep(60 * 60 * 24) # Wait for 24 hours

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and start sync thread
    create_db_and_tables()
    asyncio.create_task(daily_sync_loop())
    yield
    # Shutdown logic (if any) can go here

app = FastAPI(title="GovernanceHub API", lifespan=lifespan)

# --- CORS CONFIGURATION ---
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(admin.router)
app.include_router(proxy.router)
app.include_router(lead.router)
app.include_router(member.router)

@app.get("/")
def read_root():
    return {"status": "GovernanceHub API is Running", "fx_sync": "Active"}