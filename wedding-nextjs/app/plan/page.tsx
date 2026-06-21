export const metadata = { title: "Wedding Plan | Supakit & Sunee" };

const SECTIONS = [
  {
    title: "6+ เดือนก่อนงาน",
    items: ["กำหนดวันงาน", "ตั้งงบประมาณ", "จองสถานที่จัดงาน", "วางแผนจำนวนแขก",
            "จองช่างภาพ / วิดีโอ", "เลือก theme งาน", "จองแคทเทอริ่ง / ร้านอาหาร"],
  },
  {
    title: "3-5 เดือนก่อนงาน",
    items: ["ส่งการ์ดเชิญ / save the date", "จองดอกไม้และตกแต่ง", "เลือกชุดแต่งงาน / ชุดบ่าว",
            "เลือกเค้กแต่งงาน", "ทำ e-invitation", "ประสานงาน MC / ดนตรี"],
  },
  {
    title: "1-2 เดือนก่อนงาน",
    items: ["ยืนยันจำนวนแขกกับสถานที่", "ซ้อมพิธี", "จัดเตรียมของที่ระลึก",
            "ยืนยัน vendor ทุกราย", "เตรียม playlist เพลง", "ทำ seating plan"],
  },
  {
    title: "1 สัปดาห์ก่อนงาน",
    items: ["ยืนยัน RSVP สุดท้าย", "รับชุดแต่งงาน", "เตรียมซอง/บัตรที่นั่ง",
            "เตรียมเงินสำหรับ vendor", "พักผ่อนให้เพียงพอ"],
  },
];

export default function PlanPage() {
  return (
    <main className="min-h-screen py-16 px-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-serif-display text-center text-[var(--accent)] mb-3"
            style={{ fontSize: "clamp(1.5rem,4vw,2rem)", letterSpacing: "0.06em" }}>
          Wedding Planner
        </h1>
        <p className="text-center text-[var(--text-soft)] text-sm mb-10">
          Sunee &amp; Supakit · 22 November 2026
        </p>
        <div className="space-y-8">
          {SECTIONS.map((sec) => (
            <div key={sec.title} className="bg-white rounded-2xl p-6 shadow-sm"
                 style={{ borderLeft: "4px solid var(--gold)" }}>
              <h2 className="font-serif-display text-[var(--accent)] mb-4"
                  style={{ fontSize: "clamp(0.95rem,2.5vw,1.1rem)" }}>{sec.title}</h2>
              <ul className="space-y-2">
                {sec.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[var(--text)]">
                    <span className="mt-0.5 w-4 h-4 rounded border border-[var(--gold)] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
