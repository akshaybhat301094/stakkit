from fastapi import APIRouter
from app.models.token import TokenRequest
from app.utils.jwt_verifier import verify_jwt_token

router = APIRouter()

@router.post("/auth/verify")
def verify_token(data: TokenRequest):
    decoded = verify_jwt_token(data.token)
    return {"valid": True, "user": decoded} 