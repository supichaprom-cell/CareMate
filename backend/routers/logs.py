from fastapi import APIRouter
from datetime import datetime
from ..models import logs
from datetime import datetime

router = APIRouter()

@router.post("/log-dose")
def log_dose(data: LogRequest):
    log = {
        "medication_id": data.medication_id,
        "scheduled_time": data.scheduled_time,
        "taken_at": datetime.now(),
        "date": datetime.now().strftime("%Y-%m-%d")
    }
    logs.append(log)
    return {"message": "Dose logged"}