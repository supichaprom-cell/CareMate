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

const makeId = () => `med_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function normalizeToSchedule(stored) {
  return (stored || []).map((m) => {
    const id = m.id ?? m._id ?? (m.name ? `med_${m.name}` : makeId());

    // ถ้ามี schedule อยู่แล้ว
    if (Array.isArray(m.schedule)) {
      return {
        ...m,
        id,
        pillsPerDay: Number(m.pillsPerDay || 1),
        schedule: m.schedule.filter((s) => s?.dayKey && s?.time)
      };
    }

    // migrate จากของเก่า: days + timeTypes + customTimes -> schedule
    const days = Array.isArray(m.days) ? m.days : [];
    const times = [
      ...(Array.isArray(m.timeTypes) ? m.timeTypes.map((t) => timeMap[t]).filter(Boolean) : []),
      ...(Array.isArray(m.customTimes) ? m.customTimes : [])
    ];

    const schedule = [];
    for (const d of days) for (const t of times) schedule.push({ dayKey: d, time: t });

    return {
      ...m,
      id,
      name: m.name || "",
      pillsPerDay: Number(m.pillsPerDay || 1),
      schedule
    };
  });
}

export default function Today() {
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);
  const [now, setNow] = useState(new Date());
  const [history, setHistory] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("medications")) || [];
    const taken = JSON.parse(localStorage.getItem("takenHistory")) || {};

    const normalized = normalizeToSchedule(stored);

    setMedications(normalized);
    setHistory(taken);

    // เขียนกลับเป็น schedule เพื่อให้ทุกหน้าทำงานตรงกัน + ลบเสถียร
    localStorage.setItem("medications", JSON.stringify(normalized));

    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = now.toISOString().slice(0, 10);
  const todayKey = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][now.getDay()];

  const thaiDate = now.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // ✅ รายการวันนี้: อ่านจาก schedule
  const todaysList = useMemo(() => {
    return (medications || [])
      .flatMap((med) =>
        (med.schedule || [])
          .filter((s) => s.dayKey === todayKey)
          .map((s) => ({
            id: `${med.id}-${todayKey}-${s.time}`, // กันชน + ผูกวัน
            medId: med.id,
            name: med.name,
            pills: med.pillsPerDay,
            time: s.time
          }))
      )
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [medications, todayKey]);

  const getStatus = (item) => {
    const taken = history?.[todayStr]?.[item.id];
    if (taken) return "taken";

    const [h, m] = (item.time || "00:00").split(":").map(Number);

    const start = new Date(now);
    start.setHours(h, m || 0, 0, 0);

    const end = new Date(now);
    end.setHours(h, (m || 0) + 59, 59, 999);

    if (now < start) return "pending";
    if (now >= start && now <= end) return "due";
    return "missed";
  };

  const handleTakeAll = () => {
    const dueMeds = todaysList.filter((item) => getStatus(item) === "due");

    if (dueMeds.length === 0) {
      alert("⏳ ยังไม่ถึงเวลาหรือเลยเวลาแล้ว");
      return;
    }

    const updatedHistory = { ...history };
    if (!updatedHistory[todayStr]) updatedHistory[todayStr] = {};

    dueMeds.forEach((item) => {
      updatedHistory[todayStr][item.id] = { takenAt: new Date().toISOString() };
    });

    setHistory(updatedHistory);
    localStorage.setItem("takenHistory", JSON.stringify(updatedHistory));
    alert("✅ บันทึกการกินยาเรียบร้อยแล้ว");
  };

  // ✅ ลบเสถียร: ลบเฉพาะ “วันนี้ + เวลานั้น” ของยานั้น
  const handleDelete = (item) => {
    const ok = window.confirm(`ลบ "${item.name}" เวลา ${item.time} ของวันนี้ใช่ไหม?`);
    if (!ok) return;

    const updated = (medications || []).map((med) => {
      if (med.id !== item.medId) return med;

      const newSchedule = (med.schedule || []).filter(
        (s) => !(s.dayKey === todayKey && s.time === item.time)
      );

      return { ...med, schedule: newSchedule };
    });

    setMedications(updated);
    localStorage.setItem("medications", JSON.stringify(updated));
  };

  const summary = useMemo(() => {
    const total = todaysList.length;
    const taken = todaysList.filter((x) => getStatus(x) === "taken").length;
    const due = todaysList.filter((x) => getStatus(x) === "due").length;
    const missed = todaysList.filter((x) => getStatus(x) === "missed").length;
    return { total, taken, due, missed };
  }, [todaysList, history, now]); // eslint-disable-line

  return (
    <div className="page">
      {/* Top Bar */}
      <div className="top">
        <div className="brand">
          <div className="logo">
            {/* medical cross */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="brandName">CareMate</div>
            <div className="brandSub">
              จัดการและเตือนการกินยา เพื่อช่วยให้คุณดูแลสุขภาพได้ตรงเวลาและไม่พลาดในแต่ละวัน
            </div>
          </div>
        </div>

        <div className="topActions">
          <button className="ghost" onClick={() => navigate("/dashboard")}>
            📊 Dashboard
          </button>
          <button className="ghost" onClick={() => navigate("/schedule")}>
            📅 Schedule
          </button>
        </div>
      </div>

      {/* Hero (ไม่มีรูปแล้ว) */}
      <div className="hero">
        <div className="heroLeft">
          <div className="pill">Today</div>
          <h1>รายการยาวันนี้</h1>
          <div className="date">{thaiDate}</div>

          <div className="stats">
            <div className="statCard">
              <div className="statLabel">ทั้งหมด</div>
              <div className="statValue">{summary.total}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">กินแล้ว</div>
              <div className="statValue">{summary.taken}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">ถึงเวลา</div>
              <div className="statValue">{summary.due}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">พลาด</div>
              <div className="statValue">{summary.missed}</div>
            </div>
          </div>

          <div className="ctaRow">
            <button className="primary" onClick={handleTakeAll}>
              💊 กินยาที่ถึงเวลา
            </button>
            <button className="secondary" onClick={() => navigate("/add")}>
              ➕ เพิ่มยา
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="sectionTitle">
        <div>รายการวันนี้</div>
        <div className="miniHint">สถานะจะอัปเดตอัตโนมัติทุก 1 นาที</div>
      </div>

      {todaysList.length === 0 ? (
        <div className="empty">
          <div className="emptyIcon">🩺</div>
          <div className="emptyTitle">ยังไม่มีรายการยาในวันนี้</div>
          <div className="emptySub">เพิ่มยาเพื่อเริ่มจัดตารางได้เลย</div>
          <button className="secondary" onClick={() => navigate("/add")}>
            ➕ เพิ่มยา
          </button>
        </div>
      ) : (
        <div className="grid">
          {todaysList.map((item) => {
            const status = getStatus(item);

            return (
              <div key={item.id} className={`card ${status}`}>
                <div className="cardTop">
                  <div>
                    <div className="name">{item.name}</div>
                    <div className="meta">{item.pills} เม็ด</div>
                  </div>

                  <div className="timeBox">
                    <div className="time">{item.time}</div>
                    <div className={`badge ${status}`}>
                      {status === "taken" && "✅ กินแล้ว"}
                      {status === "pending" && "⏳ รอเวลา"}
                      {status === "due" && "🟡 ถึงเวลา"}
                      {status === "missed" && "❌ พลาด"}
                    </div>
                  </div>
                </div>

                <div className="cardActions">
                  <button className="danger" onClick={() => handleDelete(item)}>
                    🗑 ลบรายการ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        :root{
          --bg: #0b1220;
          --panel: rgba(255,255,255,.06);
          --panel2: rgba(255,255,255,.08);
          --stroke: rgba(255,255,255,.12);
          --text: rgba(229,231,235,1);
          --muted: rgba(229,231,235,.65);
        }

        .page{
          min-height:100vh;
          padding: 26px;
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          background:
            radial-gradient(1200px 700px at 10% 10%, rgba(34,211,238,0.14), transparent 60%),
            radial-gradient(1100px 650px at 90% 0%, rgba(99,102,241,0.18), transparent 55%),
            radial-gradient(900px 520px at 55% 115%, rgba(236,72,153,0.10), transparent 55%),
            var(--bg);
        }

        .top{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 16px;
          margin-bottom: 18px;
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
        }

        .topActions{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ghost{
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid var(--stroke);
          background: rgba(255,255,255,.06);
          color: var(--text);
          cursor:pointer;
          font-weight: 800;
          backdrop-filter: blur(10px);
        }
        .ghost:hover{ background: rgba(255,255,255,.10); }

        /* ✅ hero เหลือคอลัมน์เดียว (ลบรูปแล้ว) */
        .hero{
          display:block;
          margin-bottom: 18px;
        }

        .heroLeft{
          border-radius: 22px;
          padding: 18px;
          background: rgba(255,255,255,.06);
          border: 1px solid var(--stroke);
          box-shadow: 0 18px 40px rgba(0,0,0,.35);
          backdrop-filter: blur(12px);
        }

        .pill{
          display:inline-flex;
          align-items:center;
          gap: 8px;
          font-size: 12px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(34,211,238,.28);
          background: rgba(34,211,238,.10);
          color: rgba(229,231,235,.95);
        }

        .heroLeft h1{
          margin: 10px 0 6px 0;
          font-size: 28px;
          letter-spacing: .2px;
          font-weight: 950;
        }

        .date{
          color: var(--muted);
          font-weight: 600;
          font-size: 13px;
        }

        .stats{
          display:grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap: 10px;
          margin-top: 14px;
        }
        @media (max-width: 560px){
          .stats{ grid-template-columns: repeat(2, minmax(0,1fr)); }
        }

        .statCard{
          border-radius: 16px;
          padding: 12px;
          background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.10);
        }
        .statLabel{ font-size: 12px; color: var(--muted); font-weight: 700; }
        .statValue{ font-size: 20px; font-weight: 950; margin-top: 4px; }

        .ctaRow{
          display:flex;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .primary{
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid rgba(34,211,238,.22);
          background: linear-gradient(90deg, rgba(16,185,129,.95), rgba(34,211,238,.95));
          color: #001018;
          font-weight: 950;
          cursor:pointer;
          box-shadow: 0 10px 24px rgba(34,211,238,.10);
        }
        .primary:hover{ filter: brightness(1.03); }

        .secondary{
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.08);
          color: var(--text);
          font-weight: 900;
          cursor:pointer;
          backdrop-filter: blur(10px);
        }
        .secondary:hover{ background: rgba(255,255,255,.12); }

        .sectionTitle{
          display:flex;
          justify-content:space-between;
          align-items:end;
          gap: 12px;
          margin: 18px 0 10px;
          font-weight: 950;
          font-size: 16px;
        }
        .miniHint{
          font-size: 12px;
          color: var(--muted);
          font-weight: 600;
        }

        .grid{
          display:grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 12px;
        }
        @media (max-width: 840px){
          .grid{ grid-template-columns: 1fr; }
        }

        .card{
          border-radius: 18px;
          padding: 14px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: 0 14px 30px rgba(0,0,0,.30);
          backdrop-filter: blur(12px);
        }

        .cardTop{
          display:flex;
          justify-content:space-between;
          gap: 12px;
          align-items:flex-start;
        }

        .name{
          font-weight: 950;
          font-size: 16px;
          letter-spacing: .1px;
        }
        .meta{
          font-size: 12px;
          color: var(--muted);
          margin-top: 4px;
          font-weight: 650;
        }

        .timeBox{
          text-align:right;
          display:flex;
          flex-direction:column;
          gap: 6px;
          align-items:flex-end;
        }
        .time{
          font-weight: 950;
          font-size: 16px;
        }

        .badge{
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
          font-weight: 900;
          color: rgba(229,231,235,.95);
        }

        .badge.pending{
          border-color: rgba(99,102,241,.25);
          background: rgba(99,102,241,.10);
        }
        .badge.due{
          border-color: rgba(245,158,11,.28);
          background: rgba(245,158,11,.10);
        }
        .badge.missed{
          border-color: rgba(239,68,68,.28);
          background: rgba(239,68,68,.10);
        }
        .badge.taken{
          border-color: rgba(16,185,129,.28);
          background: rgba(16,185,129,.10);
        }

        .cardActions{
          margin-top: 12px;
          display:flex;
          justify-content:flex-end;
        }

        .danger{
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(239,68,68,.28);
          background: rgba(239,68,68,.12);
          color: rgba(254,202,202,1);
          font-weight: 950;
          cursor:pointer;
        }
        .danger:hover{ background: rgba(239,68,68,.16); }

        .empty{
          border-radius: 22px;
          padding: 18px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.12);
          text-align:center;
          box-shadow: 0 16px 36px rgba(0,0,0,.35);
          backdrop-filter: blur(12px);
        }
        .emptyIcon{ font-size: 30px; }
        .emptyTitle{ margin-top: 6px; font-weight: 950; font-size: 16px; }
        .emptySub{ margin-top: 4px; font-size: 12px; color: var(--muted); font-weight: 650; }
      `}</style>
    </div>
  );
}