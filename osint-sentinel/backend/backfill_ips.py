import asyncio
import logging
from database.session import SessionLocal
from app.models.asset import Asset
from app.services.asset_service import AssetService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def backfill():
    db = SessionLocal()
    try:
        ip_assets = db.query(Asset).filter(Asset.asset_type == "ip").all()
        updated = 0
        for asset in ip_assets:
            extra = asset.extra_data or {}
            if "ip_classification" not in extra:
                classification = AssetService._classify_ip(asset.value)
                extra["ip_classification"] = classification
                asset.extra_data = extra
                updated += 1
        
        db.commit()
        logger.info(f"Successfully backfilled ip_classification for {updated} IP assets.")
    finally:
        db.close()

if __name__ == "__main__":
    backfill()
