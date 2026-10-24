import { requireUser } from "@/lib/auth";
import { listDecks } from "@/features/decks/service";
import { dashboard, history } from "@/features/stats/service";

export default async function StatsPage() {
  const user = await requireUser();
  const [d, h] = await Promise.all([dashboard(user, await listDecks(user._id)), history(user)]);
  const max = Math.max(1, ...h.series.map((s) => s.words));
  const label = (key: string) => new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));

  return (
    <main>
      <h1 className="text-2xl font-semibold">Thống kê</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 tabular-nums">
        <Tile value={`${d.streak}`} label="ngày liên tiếp" />
        <Tile value={`${h.totalWords}`} label="từ trong thư viện" />
        <Tile value={`${h.matureWords}`} label="từ đã thuộc" />
        <Tile
          value={h.retention === null ? "—" : `${Math.round(h.retention * 100)}%`}
          label={h.retention === null ? "tỉ lệ nhớ · chưa đủ dữ liệu" : `tỉ lệ nhớ · ${h.retentionSample} lượt ôn`}
        />
      </div>

      <section className="mt-6 rounded-card border border-border bg-card p-5" aria-labelledby="chart-title">
        <h2 id="chart-title" className="text-base font-semibold">Số từ đã học · 14 ngày</h2>
        <div className="mt-4 flex h-40 items-end gap-[2px]" aria-hidden>
          {h.series.map((s) => (
            <div key={s.day} className="group relative flex h-full flex-1 items-end" title={`${label(s.day)}: ${s.words} từ`}>
              <div className="w-full rounded-t-[4px] bg-primary group-hover:bg-primary-pressed" style={{ height: `${s.words ? Math.max(4, (s.words / max) * 100) : 0}%` }} />
              {!s.words && <div className="h-px w-full bg-border" />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[12px] leading-4 text-muted-foreground tabular-nums" aria-hidden>
          <span>{label(h.series[0].day)}</span>
          <span>Hôm nay</span>
        </div>
        <table className="sr-only">
          <caption>Số từ đã học mỗi ngày</caption>
          <thead><tr><th>Ngày</th><th>Số từ</th></tr></thead>
          <tbody>
            {h.series.map((s) => (
              <tr key={s.day}><td>{label(s.day)}</td><td>{s.words}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-[13px] leading-[18px] text-muted-foreground">{label}</p>
    </div>
  );
}
