import { useEffect, useState, useMemo } from "react";
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

export default function Today() {
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);
  const [now, setNow] = useState(new Date());
  const [history, setHistory] = useState({});

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("medications")) || [];
    const taken = JSON.parse(localStorage.getItem("takenHistory")) || {};

    setMedications(stored);
    setHistory(taken);

    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const todayStr = now.toISOString().slice(0, 10);
  const todayKey =
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][now.getDay()];

  const thaiDate = now.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  // สร้างรายการวันนี้
  const todaysList = useMemo(() => {
    return medications
      .filter((med) => med.days?.includes(todayKey))
      .flatMap((med) => {
        const mappedTimes = [
          ...(med.timeTypes || []).map((type) => timeMap[type]),
          ...(med.customTimes || [])
        ];

        return mappedTimes.map((time) => ({
          id: `${med.id}-${time}`,
          medId: med.id,
          name: med.name,
          pills: med.pillsPerDay,
          time
        }));
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, todayKey]);

  const getStatus = (item) => {
    const taken = history?.[todayStr]?.[item.id];
    if (taken) return "taken";

    const [h] = item.time.split(":").map(Number);

    const start = new Date(now);
    start.setHours(h, 0, 0, 0);

    const end = new Date(now);
    end.setHours(h, 59, 59, 999);

    if (now < start) return "pending";
    if (now >= start && now <= end) return "due";
    return "missed";
  };

  const handleTakeAll = () => {
    const dueMeds = todaysList.filter(
      (item) => getStatus(item) === "due"
    );

    if (dueMeds.length === 0) {
      alert("⏳ ยังไม่ถึงเวลาหรือเลยเวลาแล้ว");
      return;
    }

    const updatedHistory = { ...history };

    if (!updatedHistory[todayStr]) {
      updatedHistory[todayStr] = {};
    }

    dueMeds.forEach((item) => {
      updatedHistory[todayStr][item.id] = {
        takenAt: new Date().toISOString()
      };
    });

    setHistory(updatedHistory);
    localStorage.setItem(
      "takenHistory",
      JSON.stringify(updatedHistory)
    );

    alert("✅ บันทึกการกินยาเรียบร้อยแล้ว");
  };

 
  return (
    <div className="container">
      <h1>📋 Today List</h1>

      <div className="date-box">
        📅 วันนี้คือ {thaiDate}
      </div>

      <button
        className="take-big-btn"
        onClick={handleTakeAll}
      >
        💊 กินยา
      </button>

      <button
        className="add-btn"
        onClick={() => navigate("/add")}
      >
        ➕ เพิ่มยา
      </button>

      <button
        className="nav-btn dashboard"
        onClick={() => navigate("/dashboard")}
      >
        📊 ไปหน้า Dashboard
      </button>

      <button
        className="nav-btn schedule"
        onClick={() => navigate("/schedule")}
      >
        📅 ไปหน้า Schedule
      </button>

      {todaysList.length === 0 && (
        <div className="empty">
          💤 ยังไม่มีรายการยาในวันนี้
        </div>
      )}

      {todaysList.map((item) => {
        const status = getStatus(item);

        return (
          <div key={item.id} className={`card ${status}`}>
            <div>
              <h3>{item.name}</h3>
              <p>{item.pills} เม็ด</p>
            </div>

            <div className="right">
              <div className="time">{item.time}</div>
              <div className="status">
                {status === "taken" && "✅ กินแล้ว"}
                {status === "pending" && "⏳ รอเวลา"}
                {status === "due" && "🟡 ถึงเวลา"}
                {status === "missed" && "❌ พลาด"}
              </div>

              <button
                className="delete-btn"
                onClick={() => handleDelete(item)}
              >
                🗑 ลบ
              </button>
            </div>
          </div>
        );
      })}

      <style>{`
        .container {
          min-height: 100vh;
          padding: 40px;
          background: linear-gradient(135deg, #dbeafe, #f3e8ff);
          font-family: 'Inter';
        }

        .date-box {
          text-align: center;
          margin-bottom: 20px;
          padding: 12px;
          border-radius: 15px;
          background: rgba(255,255,255,0.7);
          font-weight: 600;
        }

        .take-big-btn {
          width: 100%;
          padding: 25px;
          font-size: 22px;
          font-weight: bold;
          border-radius: 30px;
          background: linear-gradient(90deg, #10b981, #22d3ee);
          color: white;
          border: none;
          margin-bottom: 20px;
        }

        .add-btn {
          width: 100%;
          padding: 18px;
          font-size: 18px;
          border-radius: 25px;
          background: linear-gradient(90deg, #f472b6, #8b5cf6);
          color: white;
          border: none;
          margin-bottom: 15px;
        }

        .nav-btn {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          border-radius: 20px;
          color: white;
          border: none;
          margin-bottom: 10px;
          cursor: pointer;
        }

        .dashboard {
          background: linear-gradient(90deg, #6366f1, #3b82f6);
        }

        .schedule {
          background: linear-gradient(90deg, #f59e0b, #f97316);
        }

        .card {
          background: rgba(255,255,255,0.6);
          padding: 20px;
          border-radius: 20px;
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .delete-btn {
          margin-top: 8px;
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
        }

        .card.pending { border-left: 6px solid #6366f1; }
        .card.due { border-left: 6px solid #f59e0b; }
        .card.missed { border-left: 6px solid #ef4444; }
        .card.taken { border-left: 6px solid #10b981; }

        .right { text-align: right; }
        .time { font-weight: bold; }
      `}</style>
    </div>
  );
}