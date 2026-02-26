from datetime import datetime, timedelta
from .models import medications, logs


def should_take_on_day(med, day):
    """เช็คว่าวันนั้นต้องกินยาหรือไม่"""
    if med.schedule_type == "daily":
        return True

    if med.schedule_type == "alternate":
        start = datetime.now().date()
        diff = (day - start).days
        return diff % 2 == 0

    if med.schedule_type == "interval" and med.interval_days:
        start = datetime.now().date()
        diff = (day - start).days
        return diff % med.interval_days == 0

    return False


def calculate_7day_adherence():
    today = datetime.now().date()
    result = []
    consecutive_miss = 0

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)

        total_expected = 0
        total_taken = 0

        for med in medications:

            # เช็คว่าวันนั้นต้องกินไหม
            if should_take_on_day(med, day):
                total_expected += med.frequency_per_day

                # นับจำนวนที่กินจริง
                taken = len([
                    log for log in logs
                    if log["drug_name"] == med.drug_name
                    and log["time"].date() == day
                ])

                total_taken += taken

        missed = max(total_expected - total_taken, 0)

        if total_expected > 0 and missed > 0:
            consecutive_miss += 1
        else:
            consecutive_miss = 0

        result.append({
            "date": str(day),
            "taken": total_taken,
            "expected": total_expected,
            "missed": missed
        })

    risk = "High" if consecutive_miss >= 2 else "Low"

    return result, risk

def generate_7day_schedule():
    """
    สร้างตารางกินยา 7 วันล่วงหน้า
    """
    today = datetime.now().date()
    schedule = []

    for i in range(0, 7):
        day = today + timedelta(days=i)
        meds_for_day = []

        for med in medications:
            if should_take_on_day(med, day):
                meds_for_day.append({
                    "drug_name": med.drug_name,
                    "frequency_per_day": med.frequency_per_day
                })

        schedule.append({
            "date": str(day),
            "medications": meds_for_day
        })

    return schedule