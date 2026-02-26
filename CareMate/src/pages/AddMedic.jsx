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

  // form
  const [name, setName] = useState("");
  const [pillsPerDay, setPillsPerDay] = useState(1);
  const [days, setDays] = useState([]);
  const [timeTypes, setTimeTypes] = useState([]);
  const [customTimes, setCustomTimes] = useState([]);

  // time picker modal
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [tempTime, setTempTime] = useState("08:00");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("medications")) || [];

    const normalized = stored.map((m) => {
      const id = m.id || makeId();
      const pills = Number(m.pillsPerDay || 1);

      const legacyDays = Array.isArray(m.days) ? m.days : [];
      const legacyTimeTypes = Array.isArray(m.timeTypes) ? m.timeTypes : [];
      const legacyCustomTimes = Array.isArray(m.customTimes) ? m.customTimes : [];

      // already schedule format
      if (Array.isArray(m.schedule)) {
        return {
          id,
          name: m.name || "",
          pillsPerDay: pills,
          schedule: m.schedule.filter((s) => s?.dayKey && s?.time)
        };
      }

      // legacy -> schedule
      const mappedTimes = legacyTimeTypes.map((t) => timeMap[t]).filter(Boolean);
      const schedule = [];

      legacyDays.forEach((dayKey) => {
        mappedTimes.forEach((time) => schedule.push({ dayKey, time }));
      });

      const todayKey = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
      const customDay = legacyDays[0] || todayKey;
      legacyCustomTimes.forEach((time) => schedule.push({ dayKey: customDay, time }));

      const uniqueSchedule = Array.from(
        new Map(schedule.map((s) => [`${s.dayKey}-${s.time}`, s])).values()
      ).sort((a, b) => a.time.localeCompare(b.time));

      return {
        id,
        name: m.name || "",
        pillsPerDay: pills,
        schedule: uniqueSchedule
      };
    });

    setMedications(normalized);
    localStorage.setItem("medications", JSON.stringify(normalized));
  }, []);

  const toggleDay = (dayKey) => {
    setDays((prev) => (prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]));
  };

  const toggleTimeType = (type) => {
    setTimeTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const openTimePicker = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setTempTime(`${hh}:${mm}`);
    setIsTimePickerOpen(true);
  };

  const closeTimePicker = () => setIsTimePickerOpen(false);

  const confirmAddCustomTime = () => {
    if (!tempTime) return;
    setCustomTimes((prev) => {
      const next = prev.includes(tempTime) ? prev : [...prev, tempTime];
      return next.slice().sort();
    });
    setIsTimePickerOpen(false);
  };

  const removeCustomTime = (t) => setCustomTimes((prev) => prev.filter((x) => x !== t));

  const handleSave = () => {
    if (!name.trim()) return;

    const todayKey = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
    const finalDays = days.length > 0 ? days : [todayKey];
    if (timeTypes.length === 0 && customTimes.length === 0) return;

    const mappedTimes = timeTypes.map((t) => timeMap[t]).filter(Boolean);

    const schedule = [];
    // timeTypes -> every selected day
    finalDays.forEach((dayKey) => {
      mappedTimes.forEach((time) => schedule.push({ dayKey, time }));
    });
    // customTimes -> ONE day only (avoid "บาน")
    const customDay = finalDays[0] || todayKey;
    customTimes.forEach((time) => schedule.push({ dayKey: customDay, time }));

    const uniqueSchedule = Array.from(
      new Map(schedule.map((s) => [`${s.dayKey}-${s.time}`, s])).values()
    ).sort((a, b) => a.time.localeCompare(b.time));

    const newMed = {
      id: makeId(),
      name: name.trim(),
      pillsPerDay: Number(pillsPerDay || 1),
      schedule: uniqueSchedule
    };

    const updated = [...medications, newMed];
    setMedications(updated);
    localStorage.setItem("medications", JSON.stringify(updated));
    navigate("/");
  };

  const previewTimes = useMemo(() => {
    const times = [...timeTypes.map((t) => timeMap[t]).filter(Boolean), ...customTimes];
    return [...new Set(times)].sort();
  }, [timeTypes, customTimes]);

  return (
    <div className="page">
      <div className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="brandText">
            <div className="brandName">CareMate</div>
            <div className="brandSub">เพิ่มรายการยา • ตั้งวันและเวลา</div>
          </div>
        </div>

        <div className="topActions">
          <button className="ghost" onClick={() => navigate("/")}>
            ← กลับ
          </button>
        </div>
      </div>

      <div className="shell">
        <div className="panel">
          <div className="panelHead">
            <div className="pill">Add</div>
            <h1>➕ เพิ่มยา</h1>
            <div className="sub">กรอกข้อมูลให้ครบ แล้วเลือกวัน/ช่วงเวลาที่ต้องกิน</div>
          </div>

          <div className="form">
            <div className="field">
              <div className="label">ชื่อยา</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น Paracetamol"
              />
            </div>

            <div className="field">
              <div className="label">จำนวนเม็ด/ครั้ง</div>
              <input
                type="number"
                min="1"
                value={pillsPerDay}
                onChange={(e) => setPillsPerDay(e.target.value)}
              />
            </div>

            <div className="field">
              <div className="label">เลือกวัน</div>
              <div className="chips">
                {dayOptions.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    className={`chip ${days.includes(d.key) ? "active" : ""}`}
                    onClick={() => toggleDay(d.key)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="hint">ถ้าไม่เลือกวัน ระบบจะถือเป็น “วันนี้” โดยอัตโนมัติ</div>
            </div>

            <div className="field">
              <div className="label">เลือกช่วงเวลา</div>
              <div className="chips chipsWide">
                {timeTypeOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${timeTypes.includes(t) ? "active" : ""}`}
                    onClick={() => toggleTimeType(t)}
                  >
                    <span>{t}</span>
                    <span className="chipMeta">{timeMap[t]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <div className="label">กำหนดเวลาเอง</div>
              <div className="row">
                <button className="ghost2" type="button" onClick={openTimePicker}>
                  ➕ เพิ่มเวลา (ตัวเลือกเพิ่มเติม)
                </button>

                <div className="customList">
                  {customTimes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="chip danger"
                      onClick={() => removeCustomTime(t)}
                      title="ลบเวลานี้"
                    >
                      ✕ {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="preview">
                <div className="previewLabel">ตัวอย่างเวลาที่จะบันทึก</div>
                <div className="previewValue">{previewTimes.length ? previewTimes.join(", ") : "-"}</div>
              </div>
            </div>

            <div className="actions">
              <button className="primary" type="button" onClick={handleSave}>
                ✅ บันทึก
              </button>
              <button className="secondary" type="button" onClick={() => navigate("/")}>
                ← กลับ
              </button>
            </div>
          </div>
        </div>

        {/* Side note / quick tips */}
        <div className="side">
          <div className="sideCard">
            <div className="sideTitle">Tips</div>
            <div className="sideText">
              • เลือก “ช่วงเวลา” เหมาะกับการกินประจำทุกวัน<br />
              • “กำหนดเวลาเอง” เหมาะกับนัดเฉพาะกิจ (ระบบจะผูกวันเดียวเพื่อไม่ให้รายการบาน)<br />
              • กด ลบ ที่เวลาในหน้ารายการเพื่อเอาออกได้
            </div>
          </div>
        </div>
      </div>

      {/* modal */}
      {isTimePickerOpen && (
        <div className="overlay" onClick={closeTimePicker}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalTitle">⏰ เลือกเวลา</div>
            <div className="modalSub">เลือกเวลาแบบ HH:MM</div>

            <input type="time" value={tempTime} onChange={(e) => setTempTime(e.target.value)} />

            <div className="modalActions">
              <button className="secondary" type="button" onClick={closeTimePicker}>
                ยกเลิก
              </button>
              <button className="primary" type="button" onClick={confirmAddCustomTime}>
                เพิ่มเวลา
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        :root{
          --bg: #0b1220;
          --stroke: rgba(255,255,255,.12);
          --text: rgba(229,231,235,1);
          --muted: rgba(229,231,235,.65);
        }

        .page{
          min-height:100vh;
          padding: 22px;
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          background:
            radial-gradient(1200px 700px at 10% 10%, rgba(34,211,238,0.14), transparent 60%),
            radial-gradient(1100px 650px at 90% 0%, rgba(99,102,241,0.18), transparent 55%),
            radial-gradient(900px 520px at 55% 115%, rgba(236,72,153,0.10), transparent 55%),
            var(--bg);
        }

        .topbar{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 12px;
          margin-bottom: 16px;
        }

        .brand{
          display:flex;
          align-items:center;
          gap: 12px;
        }

        .logo{
          width:44px; height:44px;
          display:grid; place-items:center;
          border-radius: 14px;
          background: rgba(255,255,255,.06);
          border: 1px solid var(--stroke);
          backdrop-filter: blur(10px);
          color: rgba(229,231,235,.95);
        }

        .brandName{
          font-weight: 950;
          letter-spacing: .2px;
          font-size: 16px;
          line-height: 1.1;
        }
        .brandSub{
          font-size: 12px;
          color: var(--muted);
          margin-top: 2px;
          font-weight: 650;
        }

        .ghost{
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid var(--stroke);
          background: rgba(255,255,255,.06);
          color: var(--text);
          cursor:pointer;
          font-weight: 900;
          backdrop-filter: blur(10px);
        }
        .ghost:hover{ background: rgba(255,255,255,.10); }

        .shell{
          display:grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 14px;
          align-items:start;
        }
        @media (max-width: 980px){
          .shell{ grid-template-columns: 1fr; }
          .side{ display:none; }
        }

        .panel{
          border-radius: 22px;
          padding: 18px;
          background: rgba(255,255,255,.06);
          border: 1px solid var(--stroke);
          box-shadow: 0 18px 40px rgba(0,0,0,.35);
          backdrop-filter: blur(12px);
        }

        .panelHead{
          margin-bottom: 12px;
        }

        .pill{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          font-size: 12px;
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(34,211,238,.28);
          background: rgba(34,211,238,.10);
          color: rgba(229,231,235,.95);
        }

        h1{
          margin: 10px 0 6px 0;
          font-size: 26px;
          letter-spacing: .2px;
          font-weight: 950;
        }

        .sub{
          color: var(--muted);
          font-weight: 650;
          font-size: 13px;
        }

        .form{
          display:grid;
          gap: 14px;
          margin-top: 14px;
        }

        .field .label{
          font-weight: 900;
          font-size: 13px;
          color: rgba(229,231,235,.92);
          margin-bottom: 8px;
        }

        *, *::before, *::after { box-sizing: border-box; }

        input{
          box-sizing: border-box;
          width: 100%;
          padding: 12px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: var(--text);
          outline:none;
          font-size: 14px;
          backdrop-filter: blur(10px);
        }
        input::placeholder{ color: rgba(229,231,235,.45); }

        .hint{
          margin-top: 8px;
          font-size: 12px;
          color: rgba(229,231,235,.55);
          font-weight: 650;
        }

        .chips{
          display:flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .chipsWide .chip{
          display:flex;
          gap: 10px;
          align-items:center;
          justify-content: space-between;
          min-width: 230px;
        }
        @media (max-width: 520px){
          .chipsWide .chip{ min-width: 100%; }
        }

        .chip{
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: rgba(229,231,235,.92);
          padding: 10px 12px;
          border-radius: 999px;
          cursor:pointer;
          font-weight: 900;
          font-size: 12px;
          backdrop-filter: blur(10px);
          transition: transform .08s ease, background .15s ease;
        }
        .chip:hover{ background: rgba(255,255,255,.10); }
        .chip:active{ transform: scale(.98); }

        .chipMeta{
          font-weight: 900;
          color: rgba(229,231,235,.65);
          font-size: 12px;
        }

        .chip.active{
          background: linear-gradient(90deg, rgba(99,102,241,.95), rgba(59,130,246,.95));
          border-color: rgba(99,102,241,.30);
          color: white;
        }
        .chip.active .chipMeta{ color: rgba(255,255,255,.85); }

        .chip.danger{
          background: rgba(239,68,68,.12);
          border-color: rgba(239,68,68,.26);
          color: rgba(254,202,202,1);
        }

        .row{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items:center;
        }

        .ghost2{
          padding: 10px 12px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.06);
          color: var(--text);
          cursor:pointer;
          font-weight: 900;
          backdrop-filter: blur(10px);
        }
        .ghost2:hover{ background: rgba(255,255,255,.10); }

        .customList{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .preview{
          margin-top: 10px;
          border-radius: 16px;
          padding: 12px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.10);
        }
        .previewLabel{
          font-size: 12px;
          color: rgba(229,231,235,.62);
          font-weight: 800;
        }
        .previewValue{
          margin-top: 6px;
          font-weight: 950;
          color: rgba(229,231,235,.92);
        }

        .actions{
          display:flex;
          gap: 10px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .primary{
          flex: 1;
          min-width: 220px;
          padding: 14px;
          border-radius: 16px;
          border: 0;
          cursor:pointer;
          font-weight: 950;
          color: white;
          background: linear-gradient(90deg, rgba(16,185,129,.95), rgba(34,211,238,.95));
          box-shadow: 0 16px 30px rgba(0,0,0,.25);
        }
        .primary:hover{ filter: brightness(1.03); }

        .secondary{
          flex: 1;
          min-width: 220px;
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.14);
          cursor:pointer;
          font-weight: 950;
          color: rgba(229,231,235,.95);
          background: rgba(255,255,255,.06);
          backdrop-filter: blur(10px);
        }
        .secondary:hover{ background: rgba(255,255,255,.10); }

        .sideCard{
          border-radius: 22px;
          padding: 16px;
          background: rgba(255,255,255,.06);
          border: 1px solid var(--stroke);
          box-shadow: 0 18px 40px rgba(0,0,0,.35);
          backdrop-filter: blur(12px);
        }
        .sideTitle{
          font-weight: 950;
          margin-bottom: 8px;
          letter-spacing: .2px;
        }
        .sideText{
          color: rgba(229,231,235,.70);
          font-size: 13px;
          line-height: 1.55;
          font-weight: 650;
        }

        /* modal */
        .overlay{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display:flex;
          justify-content:center;
          align-items:center;
          padding: 18px;
        }
        .modal{
          width: 100%;
          max-width: 440px;
          border-radius: 22px;
          padding: 16px;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          backdrop-filter: blur(14px);
          box-shadow: 0 20px 60px rgba(0,0,0,.45);
        }
        .modalTitle{
          font-weight: 950;
          font-size: 16px;
        }
        .modalSub{
          margin-top: 4px;
          color: rgba(229,231,235,.62);
          font-size: 12px;
          font-weight: 650;
        }
        .modalActions{
          display:flex;
          gap: 10px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .modalActions .primary,
        .modalActions .secondary{
          min-width: 0;
          flex: 1;
        }
      `}</style>
    </div>
  );
}