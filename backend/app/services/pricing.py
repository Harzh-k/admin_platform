import requests
from sqlmodel import Session, select
from app.models.models import ModelCatalog, SystemSettings

# def sync_model_catalog(db: Session):
#     URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json"
#     raw_data = requests.get(URL).json()
    
#     for m_id, info in raw_data.items():
#         # Calculate rates
#         in_1m = info.get("input_cost_per_token", 0) * 1_000_000
#         out_1m = info.get("output_cost_per_token", 0) * 1_000_000
        
#         existing = db.exec(select(ModelCatalog).where(ModelCatalog.model_id == m_id)).first()
        
#         if existing:
#             # ONLY update the prices, don't touch the 'is_active' status!
#             existing.input_price_per_1m = in_1m
#             existing.output_price_per_1m = out_1m
#             db.add(existing)
#         else:
#             # New model discovered in the JSON
#             new_entry = ModelCatalog(
#                 model_id=m_id,
#                 friendly_name=m_id.replace("-", " ").upper(),
#                 provider=info.get("litellm_provider", "Unknown"),
#                 input_price_per_1m=in_1m,
#                 output_price_per_1m=out_1m,
#                 is_active=False  # Default to False so it stays lightweight
#             )
#             db.add(new_entry)
#     db.commit()

def get_live_exchange_rate(db: Session):
    try:
        # Free API: ExchangeRate-API (No key needed for some basic pairs, or use a free key)
        url = "https://open.er-api.com/v6/latest/USD"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if data["result"] == "success":
            new_rate = data["rates"]["INR"]
            
            # Save to DB as the "Last Known Value"
            settings = db.exec(select(SystemSettings)).first()
            if not settings:
                settings = SystemSettings(usd_to_inr=new_rate)
            else:
                settings.usd_to_inr = new_rate
            
            db.add(settings)
            db.commit()
            return new_rate
            
    except Exception as e:
        print(f"⚠️ FX Sync Failed: {e}. Using last known value from DB.")
        settings = db.exec(select(SystemSettings)).first()
        return settings.usd_to_inr if settings else 83.50 # Hard fallback