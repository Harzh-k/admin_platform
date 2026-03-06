from sqlmodel import Session, select
from app.models.models import ModelCatalog
from app.db.database import engine

def seed_catalog():
    # Real-world pricing per 1 million tokens (USD)
    initial_models = [
        ModelCatalog(
            model_id="gpt-4o",
            friendly_name="GPT-4 Omni",
            provider="OpenAI",
            input_price_per_1m=5.00,
            output_price_per_1m=15.00
        ),
        ModelCatalog(
            model_id="gpt-3.5-turbo",
            friendly_name="GPT-3.5 Turbo",
            provider="OpenAI",
            input_price_per_1m=0.50,
            output_price_per_1m=1.50
        ),
        ModelCatalog(
            model_id="gemini-1.5-pro",
            friendly_name="Gemini 1.5 Pro",
            provider="Google",
            input_price_per_1m=3.50,
            output_price_per_1m=10.50
        )
    ]

    with Session(engine) as session:
        print("🌱 Seeding model catalog...")
        for model in initial_models:
            # Check for existing to prevent primary key errors
            statement = select(ModelCatalog).where(ModelCatalog.model_id == model.model_id)
            exists = session.exec(statement).first()
            
            if not exists:
                session.add(model)
                print(f"Added {model.friendly_name}")
        
        session.commit()
        print("✅ Seeding complete!")

if __name__ == "__main__":
    seed_catalog()