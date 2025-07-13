from fastapi import FastAPI
from app.routes import collections

app = FastAPI() 

app.include_router(collections.router, prefix="/api")