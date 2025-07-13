from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

# Create a router
router = APIRouter()

# Define the collection model
class Collection(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

@router.post("/webhook/new-collection")
async def handle_new_collection(collection: Collection):
    try:
        # Here you can add your business logic
        # For example:
        # - Send notifications
        # - Update analytics
        # - Process collection data
        
        return {"status": "success", "collection_id": str(collection.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))