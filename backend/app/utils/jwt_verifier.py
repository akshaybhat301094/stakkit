from fastapi import HTTPException
from jwt import PyJWKClient
import jwt

SUPABASE_PROJECT_ID = "your-project-id"  # TODO: Replace with your Supabase project ref
SUPABASE_JWKS_URL = f"https://{SUPABASE_PROJECT_ID}.supabase.co/auth/v1/keys"

def verify_jwt_token(token: str):
    try:
        jwk_client = PyJWKClient(SUPABASE_JWKS_URL)
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=None,  # Set if you want to check aud claim
            options={"verify_aud": False},
        )
        return decoded
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}") 