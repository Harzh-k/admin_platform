from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

# --- 1. ENTERPRISE (The Client) ---
class Enterprise(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    contact_email: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    teams: List["Team"] = Relationship(back_populates="enterprise")

# --- 2. TEAM (The Consumption Unit) ---
class Team(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    # This key is what the team puts in their Header to use the AI
    ingestion_key: str = Field(unique=True, index=True) 
    token_budget_usd: float = Field(default=100.0) # Monthly limit
    current_spend_usd: float = Field(default=0.0)
    provider: str = Field(default="openai")
    assigned_model: str = Field(default="gemini-2.5-flash")
    enterprise_id: int = Field(foreign_key="enterprise.id")
    enterprise: Enterprise = Relationship(back_populates="teams")

# --- 3. MODEL CATALOG (The Dynamic Menu) ---


class ModelCatalog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    model_id: str = Field(unique=True, index=True) # Admin must type 'gemini-1.5-flash'
    friendly_name: str
    provider: str 
    api_key: str  
    input_price_per_1m: float
    output_price_per_1m: float
    is_active: bool = Field(default=True)

# --- 4. TOKEN USAGE (The Audit Ledger) ---
class TokenUsage(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    enterprise_id: int = Field(foreign_key="enterprise.id")
    model_id: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    cost_inr: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    

# --- 5. USER (The Identity) ---
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    password_hash: str
    global_role: str = Field(default="member") 
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# --- 6. TEAM MEMBER (The Access Link) ---
class TeamMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    user_id: int = Field(foreign_key="user.id")
    role: str = Field(default="member") 
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class PolicyViolation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    team_id: int = Field(foreign_key="team.id")
    # user_id= int =Field(foreign_key="user_id")
    violation_type: str  
    original_snippet: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TeamCreate(BaseModel):
    name: str
    enterprise_id: int
    budget: float = 100.0

class SystemConfig(SQLModel, table=True):
    key: str = Field(primary_key=True) # e.g., "openai_api_key"
    value: str # The actual sk-key
    is_encrypted: bool = Field(default=False) # For future security
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SystemConfigPayload(BaseModel):
    provider: str
    key: str

class AddMemberPayload(BaseModel):
    email: str
    full_name: str
    role: str = "member" 

class ChangePasswordPayload(BaseModel):
    email: str
    old_password: str
    new_password: str

class SystemSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=1, primary_key=True)
    usd_to_inr: float = Field(default=83.50)
    last_fx_sync: datetime = Field(default_factory=datetime.utcnow)

# --- 8. PAYLOADS (Pydantic schemas for API requests) ---

class ModelCatalogPayload(BaseModel):
    model_id: str             # e.g., 'gemini-1.5-flash'
    friendly_name: str        # e.g., 'Bajaj AI Assistant'
    provider: str             # e.g., 'Google' or 'OpenAI'
    api_key: str              # The dedicated API key for this model
    input_price_per_1m: float # Manual price entry
    output_price_per_1m: float # Manual price entry