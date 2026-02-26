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

const makeId = () => `med_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function normalizeToSchedule(stored) {
  return (stored || []).map((m) => {
    const id = m.id ?? m._id ?? (m.name ? `med_${m.name}` : makeId());

    // ✅ ถ้ามี schedule อยู่แล้ว
    if (Array.isArray(m.schedule)) {
      return {
        ...m,
        id,
        pillsPerDay: Number(m.pillsPerDay || 1),
        schedule: m.schedule.filter((s) => s?.dayKey && s?.time)
      };
    }

    // ✅ migrate จากของเก่า (days/timeTypes/customTimes) -> schedule
    const days = Array.isArray(m.days) ? m.days : [];
    const times = [
      ...(Array.isArray(m.timeTypes)
        ? m.timeTypes.map((t) => timeMap[t]).filter(Boolean)
        : []),
      ...(Array.isArray(m.customTimes) ? m.customTimes : [])
    ];

    const schedule = [];
    for (const d of days) for (const t of times) schedule.push({ dayKey: d, time: t });

    return {
      ...m,
      id,
      pillsPerDay: Number(m.pillsPerDay || 1),
      schedule
    };
  });
}

export default function Schedule() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("medications")) || [];
    const normalized = normalizeToSchedule(stored);

    setMedications(normalized);
    // สำคัญ: เขียนกลับให้เป็น schedule เพื่อให้ลบเฉพาะวันได้เสถียร
    localStorage.setItem("medications", JSON.stringify(normalized));
  }, []);

  // ✅ ลบเสถียร: ลบเฉพาะ (dayKey + time) ของยาตัวนั้น
  const handleDelete = (medId, time, dayKey) => {
    const updated = medications.map((med) => {
      if (med.id !== medId) return med;

      const newSchedule = (med.schedule || []).filter(
        (s) => !(s.dayKey === dayKey && s.time === time)
      );

      return { ...med, schedule: newSchedule };
    });

    setMedications(updated);
    localStorage.setItem("medications", JSON.stringify(updated));
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayKey = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
      days.push({ date, dayKey });
    }
    return days;
  };

  const weekDays = getNext7Days();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          ← Today
        </button>

        <div>
          <div style={styles.title}>Schedule</div>
          <div style={styles.subtitle}>ตารางยาของคุณ</div>
        </div>
      </div>

      {/* ✅ เรียงแบบเดิม: การ์ดแนวนอนเลื่อน */}
      <div style={styles.scroller}>
        {weekDays.map(({ date, dayKey }, index) => {
          const dateLabel = date.toLocaleDateString("th-TH", {
            weekday: "short",
            day: "numeric",
            month: "short"
          });

          const medsForDay = medications
            .flatMap((med) =>
              (med.schedule || [])
                .filter((s) => s.dayKey === dayKey)
                .map((s) => ({
                  medId: med.id,
                  name: med.name,
                  pills: med.pillsPerDay,
                  time: s.time
                }))
            )
            .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

          return (
            <div key={index} style={styles.dayCard}>
              <div style={styles.dayTop}>
                <div style={styles.dayTitle}>{dateLabel}</div>
                <div style={styles.dayChip}>{dayKey}</div>
              </div>

              {medsForDay.length === 0 ? (
                <div style={styles.empty}>ไม่มีรายการยา</div>
              ) : (
                <div style={styles.list}>
                  {medsForDay.map((med, i) => (
                    <div key={i} style={styles.item}>
                      <div style={styles.itemLeft}>
                        <div style={styles.time}>{med.time}</div>
                        <div style={styles.name}>{med.name}</div>
                        <div style={styles.pills}>{med.pills} เม็ด</div>
                      </div>

                      <button
                        onClick={() => handleDelete(med.medId, med.time, dayKey)}
                        style={styles.delBtn}
                        title="ลบเฉพาะวันนี้"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 28,
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    background:
      "radial-gradient(1200px 700px at 10% 10%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(1000px 600px at 90% 0%, rgba(236,72,153,0.14), transparent 55%), #0b1220",
    color: "#e5e7eb"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 18
  },

  backBtn: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    cursor: "pointer",
    fontWeight: 800,
    backdropFilter: "blur(10px)"
  },

  title: { fontSize: 26, fontWeight: 950, letterSpacing: 0.2 },
  subtitle: { fontSize: 13, color: "rgba(229,231,235,0.65)", marginTop: 2 },

  scroller: {
    display: "flex",
    gap: 14,
    overflowX: "auto",
    paddingBottom: 10
  },

  dayCard: {
    minWidth: 260,
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)"
  },

  dayTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10
  },

  dayTitle: { fontWeight: 900, fontSize: 15 },
  dayChip: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "rgba(229,231,235,0.8)"
  },

  empty: {
    padding: "14px 8px",
    color: "rgba(229,231,235,0.55)",
    fontSize: 13
  },

  list: { display: "flex", flexDirection: "column", gap: 10 },

  item: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 10px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)"
  },

  itemLeft: { display: "flex", flexDirection: "column", gap: 2 },
  time: { fontWeight: 950, fontSize: 14 },
  name: { fontSize: 14, color: "rgba(229,231,235,0.92)" },
  pills: { fontSize: 12, color: "rgba(229,231,235,0.65)" },

  delBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.18)",
    color: "#fecaca",
    cursor: "pointer",
    fontWeight: 900
  },

  tip: {
    marginTop: 14,
    fontSize: 12,
    color: "rgba(229,231,235,0.6)"
  }
};