from fastapi import APIRouter, Header, HTTPException
from app.models.token import TokenRequest
from app.utils.jwt_verifier import verify_jwt_token

router = APIRouter()

@router.post("/auth/verify")
def verify_token(data: TokenRequest):
    decoded = verify_jwt_token(data.token)
    return {"valid": True, "user": decoded}

@router.get("/auth/userinfo")
def get_user_info(Authorization: str = Header(None)):
    if not Authorization or not Authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = Authorization.split(" ", 1)[1]
    decoded = verify_jwt_token(token)
    return {"user": decoded} 