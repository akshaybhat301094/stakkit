# Python Backend for Auth Verification

## Setup

1. Create and activate a virtual environment (if not already):
   ```sh
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```

3. Update `SUPABASE_PROJECT_ID` in `app/utils/jwt_verifier.py` with your actual Supabase project ref.

4. Run the FastAPI server from the project root:
   ```sh
   uvicorn main:app --reload
   ```

## Project Structure

- `main.py` — Entrypoint for Uvicorn
- `app/` — Main application package
  - `main.py` — FastAPI app instance
  - `routes/` — Route modules (e.g., `auth.py`)
  - `models/` — Pydantic models
  - `utils/` — Utility functions (e.g., JWT verification)

## Endpoint

### POST /auth/verify
- Accepts: `{ "token": "<JWT token>" }`
- Returns: `{ "valid": true, "user": { ...jwt claims... } }` if valid, or 401 if invalid.

## Example Request
```sh
curl -X POST ihttp://localhost:8000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "<your-jwt-token>"}'
``` 