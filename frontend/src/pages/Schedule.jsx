import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const timeMap = {
  "ก่อนอาหารเช้า": "06:00",
  "หลังอาหารเช้า": "08:00",
  "ก่อนอาหารกลางวัน": "11:00",
  "หลังอาหารกลางวัน": "13:00",
  "ก่อนอาหารเย็น": "17:00",
  "หลังอาหารเย็น": "19:00",
  "ก่อนนอน": "22:00"
};

export default function Schedule() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    const stored =
      JSON.parse(localStorage.getItem("medications")) || [];
    setMedications(stored);
  }, []);

  const handleDelete = (medName, time, dayKey) => {
    const updatedMeds = medications.map((med) => {
      if (med.name !== medName) return med;

      // ลบเฉพาะเวลาที่อยู่ในวันนั้น
      const newCustomTimes = (med.customTimes || []).filter(
        (tObj) => !(tObj.time === time && tObj.dayKey === dayKey)
      );

      const newTimeTypes = (med.timeTypes || []).filter(
        (t) => timeMap[t] !== time || !med.days.includes(dayKey)
      );

      return { ...med, customTimes: newCustomTimes, timeTypes: newTimeTypes };
    });

    setMedications(updatedMeds);
    localStorage.setItem("medications", JSON.stringify(updatedMeds));
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayKey =
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];

      days.push({ date, dayKey });
    }

    return days;
  };

  const weekDays = getNext7Days();

  return (
    <div style={{ padding: "40px" }}>
      <button
        onClick={() => navigate("/")}
        style={{
          marginBottom: "20px",
          padding: "10px 18px",
          borderRadius: "20px",
          border: "none",
          background: "linear-gradient(90deg, #6366f1, #3b82f6)",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        ⬅ กลับไปหน้า Today
      </button>

      <h1>📅 ตารางกินยา 7 วัน</h1>

      <div
        style={{
          display: "flex",
          gap: "15px",
          overflowX: "auto",
          marginTop: "20px"
        }}
      >
        {weekDays.map(({ date, dayKey }, index) => {
          const dateLabel = date.toLocaleDateString("th-TH", {
            weekday: "short",
            day: "numeric",
            month: "short"
          });

          const medsForDay = medications
            .flatMap((med) =>
              (med.schedule || []) // เพิ่มการเช็คตรงนี้
                .filter((s) => s.dayKey === dayKey)
                .map((s) => ({
                  name: med.name,
                  pills: med.pillsPerDay,
                  time: s.time
                }))
            )
            .sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div
              key={index}
              style={{
                minWidth: "200px",
                background: "#f3f4f6",
                padding: "15px",
                borderRadius: "15px",
                boxShadow: "0 5px 15px rgba(0,0,0,0.05)"
              }}
            >
              <h3>{dateLabel}</h3>

              {medsForDay.length === 0 ? (
                <p style={{ color: "#999" }}>ไม่มีรายการยา</p>
              ) : (
                medsForDay.map((med, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: "10px",
                      padding: "8px",
                      background: "white",
                      borderRadius: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <strong>{med.time}</strong>
                      <div>{med.name}</div>
                      <small>{med.pills} เม็ด</small>
                    </div>
                    <button
                      onClick={() => handleDelete(med.name, med.time)}
                      style={{
                        background: "red",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}a