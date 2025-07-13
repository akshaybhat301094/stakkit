# Python Backend

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

3. Run the FastAPI server from the project root:
   ```sh
   uvicorn main:app --reload
   ```

## Project Structure

- `main.py` — Entrypoint for Uvicorn
- `app/` — Main application package
  - `main.py` — FastAPI app instance
  - `routes/` — Route modules
  - `models/` — Pydantic models
  - `utils/` — Utility functions

## Authentication

Authentication is handled entirely by Supabase in the frontend. This backend service does not handle any authentication or JWT verification. 