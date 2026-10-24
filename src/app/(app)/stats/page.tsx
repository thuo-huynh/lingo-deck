import { requireUser } from "@/lib/auth";
import { listDecks } from "@/features/decks/service";
import { dashboard, history, stepAccuracy } from "@/features/stats/service";
import { STEP_LABELS } from "@/features/study/labels";
import { STEP_TYPES } from "@/features/study/attempt";

const WEEKS = 12;
// Sequential, one hue (primary), light → dark. Level 0 is the empty track.
const LEVELS = ["bg-muted", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"];

export default async function StatsPage() {
  const user = await requireUser();
  const [d, h, acc] = await Promise.all([dashboard(user, await listDecks(user._id)), history(user, new Date(), WEEKS * 7), stepAccuracy(user._id)]);
  const last14 = h.series.slice(-14);
  const max14 = Math.max(1, ...last14.map((s) => s.words));
  const maxAll = Math.max(1, ...h.series.map((s) => s.words));
  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / maxAll) * 4)));
  const label = (key: string) => new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric", timeZone: "UTC" }).format(new Date(`${key}T00:00:00Z`));
  // Heatmap columns are weeks, oldest first; pad the first week so rows line up with weekdays (Mon first).
  const firstDow = (new Date(`${h.series[0].day}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cells = [...Array(firstDow).fill(null), ...h.series];

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
          {last14.map((s) => (
            <div key={s.day} className="group relative flex h-full flex-1 items-end" title={`${label(s.day)}: ${s.words} từ`}>
              <div className="w-full rounded-t-[4px] bg-primary group-hover:bg-primary-pressed" style={{ height: `${s.words ? Math.max(4, (s.words / max14) * 100) : 0}%` }} />
              {!s.words && <div className="h-px w-full bg-border" />}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[12px] leading-4 text-muted-foreground tabular-nums" aria-hidden>
          <span>{label(last14[0].day)}</span>
          <span>Hôm nay</span>
        </div>
        <table className="sr-only">
          <caption>Số từ đã học mỗi ngày, 14 ngày gần nhất</caption>
          <thead><tr><th>Ngày</th><th>Số từ</th></tr></thead>
          <tbody>
            {last14.map((s) => (
              <tr key={s.day}><td>{label(s.day)}</td><td>{s.words}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-4 rounded-card border border-border bg-card p-5" aria-labelledby="heat-title">
        <h2 id="heat-title" className="text-base font-semibold">Lịch học · {WEEKS} tuần</h2>
        <div className="mt-4 grid grid-flow-col grid-rows-7 gap-[3px]" aria-hidden>
          {cells.map((c, i) =>
            c ? (
              <span key={c.day} title={`${label(c.day)}: ${c.words} từ`} className={`aspect-square rounded-[3px] ${LEVELS[level(c.words)]}`} />
            ) : (
              <span key={`pad-${i}`} />
            )
          )}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[12px] leading-4 text-muted-foreground" aria-hidden>
          Ít
          {LEVELS.map((l) => (
            <span key={l} className={`size-3 rounded-[3px] ${l}`} />
          ))}
          Nhiều
        </div>
        <table className="sr-only">
          <caption>Số từ đã học mỗi ngày, {WEEKS} tuần gần nhất</caption>
          <thead><tr><th>Ngày</th><th>Số từ</th></tr></thead>
          <tbody>
            {h.series.map((s) => (
              <tr key={s.day}><td>{label(s.day)}</td><td>{s.words}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-4 rounded-card border border-border bg-card p-5" aria-labelledby="skill-title">
        <h2 id="skill-title" className="text-base font-semibold">Đúng lần đầu theo bước · 30 ngày</h2>
        <ul className="mt-4 flex flex-col gap-4">
          {STEP_TYPES.map((step) => {
            const { total, correct } = acc[step];
            const pct = total ? Math.round((correct / total) * 100) : null;
            return (
              <li key={step} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[13px] leading-[18px] font-medium tabular-nums">
                  <span className="text-body">{STEP_LABELS[step]}</span>
                  <span>{pct === null ? "Chưa có dữ liệu" : `${pct}% · ${total} lượt`}</span>
                </div>
                <div role="progressbar" aria-label={STEP_LABELS[step]} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct ?? 0} className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct ?? 0}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
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
