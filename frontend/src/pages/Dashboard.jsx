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

    if (totalAll === 0) return "ยังไม่มีข้อมูลการกินยา";

    const percent = Math.round((totalTaken / totalAll) * 100);

    if (percent >= 90) return `🎉 คุณกินยาสม่ำเสมอมาก (${percent}%)`;
    if (percent >= 70) return `🙂 คุณทำได้ดี แต่ยังมีพลาดบ้าง (${percent}%)`;
    if (percent >= 50) return `😅 ยังลืมบ่อย ลองตั้งแจ้งเตือนเพิ่ม (${percent}%)`;
    return `⚠️ คุณควรระวังการลืมกินยา (${percent}%)`;
  }, [dailyStats]);

  const headerMeta = useMemo(() => {
    let totalTaken = 0;
    let totalAll = 0;
    dailyStats.forEach((d) => {
      totalTaken += d.taken;
      totalAll += d.total;
    });

    const percent = totalAll === 0 ? 0 : Math.round((totalTaken / totalAll) * 100);
    return { totalTaken, totalAll, percent };
  }, [dailyStats]);

  return (
    <div className="page">
      <div className="top">
        <div className="brand">
          <div className="logo">
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
            <div className="brandSub">Dashboard • ประวัติ 7 วันล่าสุด</div>
          </div>
        </div>

        <button className="ghost" onClick={() => navigate("/today")}>
          ← กลับไปหน้าวันนี้
        </button>
      </div>

      <div className="hero">
        <div className="heroLeft">
          <div className="pill">Insight</div>
          <h1>🩺 ประวัติการกินยา</h1>
          <div className="sub">
            ภาพรวม 7 วันล่าสุด • ทำได้ {headerMeta.percent}%
          </div>

          <div className="insightBox">
            {summary}
          </div>  

          <div className="stats">
            <div className="statCard">
              <div className="statLabel">เปอร์เซ็นต์รวม</div>
              <div className="statValue">{headerMeta.percent}%</div>
            </div>
            <div className="statCard">
              <div className="statLabel">กินทั้งหมด</div>
              <div className="statValue">{headerMeta.totalTaken}</div>
            </div>
            <div className="statCard">
              <div className="statLabel">ทั้งหมดที่ต้องกิน</div>
              <div className="statValue">{headerMeta.totalAll}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sectionTitle">
        <div>รายละเอียดรายวัน</div>
        <div className="miniHint">แถบความคืบหน้าแสดงเปอร์เซ็นต์ของวันนั้น</div>
      </div>

      <div className="list">
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

          const percent = day.total === 0 ? 0 : Math.round((day.taken / day.total) * 100);

          return (
            <div key={index} className={`card ${statusClass}`}>
              <div className="left">
                <div className="date">{day.date}</div>
                <div className="count">
                  {day.taken}/{day.total} ครั้ง
                </div>

                {day.total > 0 && (
                  <div className="progress">
                    <div className="progressBar" style={{ width: `${percent}%` }} />
                  </div>
                )}
              </div>

              <div className={`status ${statusClass}`}>{statusText}</div>
            </div>
          );
        })}
      </div>

      <style>{`
        :root{
          --bg: #0b1220;
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

        .stats{
          display:grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
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
        .insightBox{
          margin-top: 14px;
          padding: 14px;
          border-radius: 16px;
          background: linear-gradient(
            90deg,
            rgba(16,185,129,0.18),
            rgba(34,211,238,0.12)
          );
          border: 1px solid rgba(34,211,238,0.25);
          font-weight: 900;
          text-align: center;
        }

        .list{
          display:flex;
          flex-direction:column;
          gap: 12px;
        }

        .card{
          border-radius: 18px;
          padding: 14px;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: 0 14px 30px rgba(0,0,0,.30);
          backdrop-filter: blur(12px);
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 14px;
        }

        .left{ flex: 1; }

        .date{
          font-weight: 950;
          letter-spacing: .2px;
        }
        .count{
          margin-top: 4px;
          font-size: 13px;
          color: rgba(229,231,235,.88);
          font-weight: 700;
        }

        .progress{
          margin-top: 10px;
          height: 10px;
          background: rgba(255,255,255,.10);
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.10);
        }

        .progressBar{
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(16,185,129,.95), rgba(34,211,238,.95));
          box-shadow: 0 10px 24px rgba(34,211,238,.10);
          transition: width .35s ease;
        }

        .status{
          font-weight: 900;
          font-size: 13px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.06);
          white-space: nowrap;
        }

        .status.perfect{
          border-color: rgba(16,185,129,.28);
          background: rgba(16,185,129,.10);
          color: rgba(167,243,208,1);
        }

        .status.medium{
          border-color: rgba(245,158,11,.28);
          background: rgba(245,158,11,.10);
          color: rgba(253,230,138,1);
        }

        .status.missed{
          border-color: rgba(239,68,68,.28);
          background: rgba(239,68,68,.10);
          color: rgba(254,202,202,1);
        }

        .status.no-med{
          border-color: rgba(148,163,184,.22);
          background: rgba(148,163,184,.08);
          color: rgba(203,213,225,1);
        }

        .summary{
          margin-top: 16px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(34,211,238,.22);
          background: linear-gradient(90deg, rgba(16,185,129,.16), rgba(34,211,238,.12));
          box-shadow: 0 18px 40px rgba(0,0,0,.35);
          font-weight: 950;
          text-align: center;
        }
      `}</style>
    </div>
  );
}