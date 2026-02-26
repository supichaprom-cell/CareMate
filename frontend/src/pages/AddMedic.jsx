import { useEffect, useMemo, useState } from "react";
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

const dayOptions = [
  { key: "Sun", label: "อา" },
  { key: "Mon", label: "จ" },
  { key: "Tue", label: "อ" },
  { key: "Wed", label: "พ" },
  { key: "Thu", label: "พฤ" },
  { key: "Fri", label: "ศ" },
  { key: "Sat", label: "ส" }
];

const timeTypeOptions = Object.keys(timeMap);

const makeId = () => `med_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export default function AddMedic() {
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);

  // ฟอร์ม
  const [name, setName] = useState("");
  const [pillsPerDay, setPillsPerDay] = useState(1);
  const [days, setDays] = useState([]);
  const [timeTypes, setTimeTypes] = useState([]);
  const [customTimes, setCustomTimes] = useState([]);

  // ✅ สำหรับ popup เลือกเวลา
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [tempTime, setTempTime] = useState("08:00");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("medications")) || [];
    // normalize กันพัง
    const normalized = stored.map((m) => ({
      id: m.id || makeId(),
      name: m.name || "",
      pillsPerDay: Number(m.pillsPerDay || 1),
      days: Array.isArray(m.days) ? m.days : [],
      timeTypes: Array.isArray(m.timeTypes) ? m.timeTypes : [],
      customTimes: Array.isArray(m.customTimes) ? m.customTimes : []
    }));
    setMedications(normalized);
    localStorage.setItem("medications", JSON.stringify(normalized));
  }, []);

  const toggleDay = (dayKey) => {
    setDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  const toggleTimeType = (type) => {
    setTimeTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // ✅ เปิด popup เลือกเวลา
  const openTimePicker = () => {
    // ตั้งค่าเริ่มต้นเป็นเวลาปัจจุบัน (HH:MM) เพื่อใช้งานง่าย
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setTempTime(`${hh}:${mm}`);
    setIsTimePickerOpen(true);
  };

  const closeTimePicker = () => {
    setIsTimePickerOpen(false);
  };

  // ✅ ยืนยันเพิ่มเวลา custom
  const confirmAddCustomTime = () => {
    if (!tempTime) return;

    setCustomTimes((prev) => {
      const next = prev.includes(tempTime) ? prev : [...prev, tempTime];
      return next.slice().sort();
    });

    setIsTimePickerOpen(false);
  };

  const removeCustomTime = (t) => {
    setCustomTimes((prev) => prev.filter((x) => x !== t));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("กรุณาใส่ชื่อยา");
      return;
    }

    // ✅ ถ้าไม่เลือกวัน → ตั้งเป็นวันนี้ + แจ้งเตือน
    let finalDays = days;
    if (days.length === 0) {
      const todayKey = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
        new Date().getDay()
      ];
      finalDays = [todayKey];
      alert("⚠️ ไม่ได้เลือกวัน ระบบตั้งค่าเป็นวันนี้ให้อัตโนมัติ");
    }

    if (timeTypes.length === 0 && customTimes.length === 0) {
      alert("กรุณาเลือกช่วงเวลา หรือเพิ่มเวลาที่กำหนดเอง");
      return;
    }

    const newMed = {
      id: makeId(),
      name: name.trim(),
      pillsPerDay: Number(pillsPerDay || 1),
      days: finalDays,
      timeTypes,
      customTimes
    };

    const updated = [...medications, newMed];
    setMedications(updated);
    localStorage.setItem("medications", JSON.stringify(updated));

    alert("✅ เพิ่มยาเรียบร้อยแล้ว");
    navigate("/");
  };

  const previewTimes = useMemo(() => {
    const times = [...timeTypes.map((t) => timeMap[t]).filter(Boolean), ...customTimes];
    return [...new Set(times)].sort();
  }, [timeTypes, customTimes]);

  return (
    <div className="container">
      <div className="wrapper">
        <h1>➕ เพิ่มยา</h1>

        <div className="card">
          <label>ชื่อยา</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น Paracetamol"
          />

          <label>จำนวนเม็ด/ครั้ง</label>
          <input
            type="number"
            min="1"
            value={pillsPerDay}
            onChange={(e) => setPillsPerDay(e.target.value)}
          />

          <label>เลือกวัน</label>
          <div className="row">
            {dayOptions.map((d) => (
              <button
                key={d.key}
                className={`chip ${days.includes(d.key) ? "active" : ""}`}
                onClick={() => toggleDay(d.key)}
                type="button"
              >
                {d.label}
              </button>
            ))}
          </div>

          <label>เลือกช่วงเวลา</label>
          <div className="row wrap">
            {timeTypeOptions.map((t) => (
              <button
                key={t}
                className={`chip ${timeTypes.includes(t) ? "active" : ""}`}
                onClick={() => toggleTimeType(t)}
                type="button"
              >
                {t} ({timeMap[t]})
              </button>
            ))}
          </div>

          <div className="row wrap" style={{ marginTop: 10 }}>
            <button
              className="chip"
              type="button"
              onClick={openTimePicker}
              title="กดเพื่อเลือกเวลา"
            >
              ➕ กำหนดเวลาเอง
            </button>

            {customTimes.map((t) => (
              <button
                key={t}
                className="chip danger"
                onClick={() => removeCustomTime(t)}
                type="button"
                title="ลบเวลานี้"
              >
                ✕ {t}
              </button>
            ))}
          </div>

          <button className="save" onClick={handleSave} type="button">
            ✅ บันทึก
          </button>

          <button className="back" onClick={() => navigate("/")} type="button">
            ⬅ กลับ
          </button>
        </div>
      </div>

      {/* ✅ Popup เลือกเวลา */}
      {isTimePickerOpen && (
        <div className="overlay" onClick={closeTimePicker}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalTitle">⏰ เลือกเวลา</div>

            <input
              type="time"
              value={tempTime}
              onChange={(e) => setTempTime(e.target.value)}
            />

            <div className="modalActions">
              <button className="back" type="button" onClick={closeTimePicker}>
                ยกเลิก
              </button>
              <button className="save" type="button" onClick={confirmAddCustomTime}>
                เพิ่มเวลา
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .container {
          min-height: 100vh;
          padding: 40px;
          background: linear-gradient(135deg, #dbeafe, #f3e8ff);
          font-family: 'Inter';
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .wrapper {
          width: 100%;
          max-width: 520px;
        }

        .card{
          background: rgba(255,255,255,0.7);
          padding:20px;
          border-radius:20px;
        }

        label{ display:block; margin-top:12px; font-weight:600; }

        input{
          width:100%;
          padding:12px;
          border-radius:12px;
          border:1px solid rgba(0,0,0,0.1);
          margin-top:6px;
          outline:none;
          background: rgba(255,255,255,0.9);
        }

        .row{ display:flex; gap:10px; align-items:center; margin-top:10px; }
        .wrap{ flex-wrap:wrap; }
        .col{ display:flex; flex-direction:column; gap:8px; margin-top:10px; }

        .chip{
          border:none;
          padding:10px 12px;
          border-radius:14px;
          background: rgba(255,255,255,0.9);
          cursor:pointer;
        }

        .chip.active{
          background: linear-gradient(90deg, #6366f1, #3b82f6);
          color:white;
          font-weight:700;
        }

        .chip.danger{
          background:#ef4444;
          color:white;
          font-weight:700;
        }

        .save{
          width:100%;
          margin-top:16px;
          padding:14px;
          border-radius:18px;
          border:none;
          cursor:pointer;
          background: linear-gradient(90deg, #f472b6, #8b5cf6);
          color:white;
          font-weight:800;
          font-size:16px;
        }

        .back{
          width:100%;
          margin-top:10px;
          padding:12px;
          border-radius:18px;
          border:none;
          cursor:pointer;
          background: linear-gradient(90deg, #6366f1, #3b82f6);
          color:white;
          font-weight:800;
          font-size:14px;
        }

        .preview{
          margin-top:12px;
          padding:10px 12px;
          border-radius:14px;
          background: rgba(255,255,255,0.7);
          font-size:13px;
        }

        .hint{
          display:block;
          margin-top:6px;
          color:#666;
          font-size:12px;
        }

        /* ✅ Popup */
        .overlay{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.35);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .modal{
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }

        .modalTitle{
          font-weight: 800;
          margin-bottom: 10px;
        }

        .modalActions{
          display:flex;
          gap:10px;
          margin-top: 12px;
        }

        .modalActions .back,
        .modalActions .save{
          width: 100%;
          margin-top: 0;
        }
      `}</style>
    </div>
  );
}