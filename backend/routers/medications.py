from fastapi import APIRouter
from ..schemas import Medication
from ..models import medications

router = APIRouter()

@router.post("")
def add_medication(med: Medication):
    medications.append(med.dict())
    return {
        "message": "Medication added",
        "data": med
    }

@router.get("")
def get_medications():
    return medications