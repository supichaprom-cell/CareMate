import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // 🔥 จำลองข้อมูล 7 วัน แบบเนียน ๆ ไม่เท่ากัน
  const dailyStats = useMemo(() => {
    return [
      { date: "2026-02-24", taken: 5, total: 5 },
      { date: "2026-02-23", taken: 3, total: 4 },
      { date: "2026-02-22", taken: 0, total: 0 },
      { date: "2026-02-21", taken: 2, total: 6 },
      { date: "2026-02-20", taken: 4, total: 4 },
      { date: "2026-02-19", taken: 1, total: 3 },
      { date: "2026-02-18", taken: 3, total: 5 }
    ];
  }, []);

  // 🔥 คำนวณภาพรวม
  const summary = useMemo(() => {
    let totalTaken = 0;
    let totalAll = 0;

    dailyStats.forEach((d) => {
      totalTaken += d.taken;
      totalAll += d.total;
    });

    if (totalAll === 0)
      return "ยังไม่มีข้อมูลการกินยา";

    const percent = Math.round(
      (totalTaken / totalAll) * 100
    );

    if (percent >= 90)
      return `🎉 คุณกินยาสม่ำเสมอมาก (${percent}%)`;

    if (percent >= 70)
      return `🙂 คุณทำได้ดี แต่ยังมีพลาดบ้าง (${percent}%)`;

    if (percent >= 50)
      return `😅 ยังลืมบ่อย ลองตั้งแจ้งเตือนเพิ่ม (${percent}%)`;

    return `⚠️ คุณควรระวังการลืมกินยา (${percent}%)`;
  }, [dailyStats]);

  return (
    <div className="container">
      <h1>🩺 ประวัติการกินยา (7 วันล่าสุด)</h1>

      {/* 🔥 ปุ่มกลับ */}
      <button
        className="back-btn"
        onClick={() => navigate("/today")}
      >
        ← กลับไปหน้าวันนี้
      </button>

      {dailyStats.map((day, index) => {
        const missed = day.total - day.taken;

        let statusClass = "";
        let statusText = "";

        if (day.total === 0) {
          statusClass = "no-med";
          statusText = "ไม่มีต้องกินยา";
        } else if (missed === 0) {
          statusClass = "perfect";
          statusText = "ครบทุกครั้ง 💚";
        } else if (day.taken >= day.total / 2) {
          statusClass = "medium";
          statusText = `พลาด ${missed} รอบ`;
        } else {
          statusClass = "missed";
          statusText = `ลืมเยอะ (${missed} รอบ)`;
        }

        const percent =
          day.total === 0
            ? 0
            : Math.round((day.taken / day.total) * 100);

        return (
          <div key={index} className="card">
            <div>
              <h3>{day.date}</h3>
              <p>
                {day.taken}/{day.total} ครั้ง
              </p>

              {day.total > 0 && (
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
            </div>

            <div className={`right ${statusClass}`}>
              {statusText}
            </div>
          </div>
        );
      })}

      <div className="summary">
        {summary}
      </div>

      <style>{`
        .container {
          min-height: 100vh;
          padding: 40px;
          background: linear-gradient(135deg, #dbeafe, #f3e8ff);
          font-family: 'Inter';
        }

        h1 {
          text-align: center;
          margin-bottom: 20px;
          font-weight: 700;
        }

        .back-btn {
          display: block;
          margin: 0 auto 30px auto;
          padding: 10px 22px;
          border-radius: 30px;
          border: none;
          background: linear-gradient(90deg,#6366f1,#8b5cf6);
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 10px 25px rgba(99,102,241,0.3);
        }

        .back-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(99,102,241,0.4);
        }

        .card {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(15px);
          padding: 22px;
          border-radius: 24px;
          margin-bottom: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 12px 30px rgba(0,0,0,0.05);
          transition: 0.2s;
        }

        .card:hover {
          transform: translateY(-4px);
        }

        .progress {
          height: 8px;
          background: #e5e7eb;
          border-radius: 20px;
          margin-top: 8px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg,#6366f1,#8b5cf6);
          border-radius: 20px;
          transition: 0.4s;
        }

        .right {
          font-weight: 600;
        }

        .perfect {
          color: #10b981;
        }

        .medium {
          color: #f59e0b;
        }

        .missed {
          color: #ef4444;
        }

        .no-med {
          color: #6b7280;
        }

        .summary {
          margin-top: 35px;
          padding: 28px;
          border-radius: 25px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          color: white;
          font-weight: bold;
          text-align: center;
          font-size: 18px;
          box-shadow: 0 20px 40px rgba(99,102,241,0.35);
        }
      `}</style>
    </div>
  );
}