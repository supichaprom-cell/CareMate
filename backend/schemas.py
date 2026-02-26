from pydantic import BaseModel
from typing import Optional

class Medication(BaseModel):
    id: str
    name: str
    day: str
    time: str
    pillsPerDay: int