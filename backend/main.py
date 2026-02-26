from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import medications, dashboard, logs
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 👇 include ทุก router
app.include_router(medications.router, prefix="/medications", tags=["Medications"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(logs.router, prefix="/logs", tags=["Logs"])  

@app.get("/")
def root():
    return {"message": "API is running 🚀"}