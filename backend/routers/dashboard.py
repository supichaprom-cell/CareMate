from fastapi import APIRouter
from ..services import calculate_7day_adherence, generate_7day_schedule

router = APIRouter()

@router.get("")
def get_dashboard():
    data_7days, risk = calculate_7day_adherence()
    return {
        "adherence_7days": data_7days,
        "risk_level": risk
    }

@router.get("/schedule-7days")
def get_schedule():
    return generate_7day_schedule()