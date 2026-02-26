from datetime import datetime
from pydantic import BaseModel
from typing import List

medications = []
logs = []

class Medication(BaseModel):
    id: int
    name: str
    dosage: str
    times: List[str]   # ["08:00", "14:00", "20:00"]

class Log(BaseModel):
    medication_id: int
    scheduled_time: str
    taken_at: datetime
    date: str