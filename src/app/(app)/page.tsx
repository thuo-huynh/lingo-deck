import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Play, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeckRow } from "@/components/deck-row";
import { requireUser } from "@/lib/auth";
import { listDecks } from "@/features/decks/service";
import { dashboard } from "@/features/stats/service";
import { resumableSession } from "@/features/study/session";

export default async function HomePage() {
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");
  const decks = await listDecks(user._id);
  const [d, resume] = await Promise.all([dashboard(user, decks), resumableSession(user._id)]);
  const byId = new Map(decks.map((x) => [x._id.toHexString(), x]));
  const pathName = (ids: typeof decks[number]["path"]) =>
    ids.slice(0, -1).map((id) => byId.get(id.toHexString())?.name).filter(Boolean).join(" › ");
  // Recent = leaf-most decks with work today first.
  const recent = [...decks]
    .map((deck) => ({ deck, c: d.counts(deck._id) }))
    .filter(({ deck }) => !decks.some((x) => x.parentId?.equals(deck._id)))
    .sort((a, b) => b.c.due + b.c.new - (a.c.due + a.c.new))
    .slice(0, 3);
  const goal = Math.max(1, user.dailyGoal);
  const root = decks.find((x) => !x.parentId);
  const newToday = Math.min(d.new, Math.max(0, goal - d.introducedToday));
  const doneToday = !!root && d.due === 0 && newToday === 0;
  const today = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long", timeZone: user.timezone }).format(new Date());

  return (
    <main className="flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] leading-[18px] font-medium text-muted-foreground first-letter:uppercase">{today}</p>
          <h1 className="mt-1 text-2xl font-semibold">Chào {user.displayName || "bạn"}</h1>
        </div>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card pr-3 pl-2.5 text-[13px] leading-[18px] font-semibold tabular-nums" aria-label={`Chuỗi ${d.streak} ngày`}>
          <Zap className="size-4 text-primary" strokeWidth={1.75} aria-hidden />
          {d.streak} ngày
        </span>
      </div>

      {resume && (
        <Link
          href={`/study/${resume.id}`}
          className="mt-6 flex min-h-16 items-center gap-3 rounded-card border border-primary/30 bg-primary-soft px-4 py-3 text-primary-soft-foreground"
        >
          <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
            <Play className="size-5" strokeWidth={2} aria-hidden />
          </span>
          <span className="flex flex-1 flex-col">
            <span className="font-semibold">Tiếp tục buổi học</span>
            <span className="text-[13px] leading-[18px] tabular-nums">
              {resume.completedWords} / {resume.totalWords} từ
            </span>
          </span>
        </Link>
      )}

      {doneToday ? (
        <section aria-label="Hôm nay" className="mt-6 flex flex-col items-center gap-3 rounded-card border border-border bg-card p-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
            <CheckCircle2 className="size-7" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className="text-2xl font-semibold">Hết từ cần ôn hôm nay</h2>
          <p className="text-body">
            {d.learning > 0 ? "Vài từ đang học sẽ quay lại sau ít phút." : "Lượt ôn tiếp theo vào ngày mai."}
            <br />
            Nghỉ ngơi cũng là một phần của việc nhớ lâu.
          </p>
          <Button asChild variant="outline" size="xl" className="mt-2 w-full">
            <Link href={`/study/setup?deck=${root._id.toHexString()}&mode=practice`}>Luyện tập thêm</Link>
          </Button>
          <p className="text-[13px] leading-[18px] text-muted-foreground">Không ảnh hưởng lịch ôn</p>
        </section>
      ) : (
      <section aria-label="Hôm nay" className="mt-6 flex flex-col gap-5 rounded-card border border-border bg-card p-6">
        <p className="text-[13px] leading-[18px] font-medium text-muted-foreground">Hôm nay</p>
        <div className="grid grid-cols-3 gap-2 tabular-nums">
          <Stat value={d.due} label="Đến hạn" />
          <Stat value={newToday} label="Mới" accent />
          <Stat value={d.learning} label="Đang học" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-[13px] leading-[18px] font-medium tabular-nums">
            <span className="text-body">Mục tiêu ngày</span>
            <span>{Math.min(d.wordsToday, goal)} / {goal} từ</span>
          </div>
          <div role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(d.wordsToday, goal)} aria-label="Mục tiêu ngày" className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.min(100, (d.wordsToday / goal) * 100)}%` }} />
          </div>
        </div>
        {root ? (
          <Button asChild size="xl">
            <Link href={`/study/setup?deck=${root._id.toHexString()}`}>Học hôm nay</Link>
          </Button>
        ) : (
          <Button asChild size="xl">
            <Link href="/decks/new">Tạo bộ từ đầu tiên</Link>
          </Button>
        )}
      </section>
      )}

      {recent.length > 0 && (
        <>
          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-base font-semibold">Bộ từ gần đây</h2>
            <Link href="/decks" className="py-3 text-[13px] leading-[18px] font-semibold text-primary">Xem tất cả</Link>
          </div>
          <div className="mt-1 overflow-hidden rounded-card border border-border bg-card">
            {recent.map(({ deck, c }, i) => (
              <DeckRow
                key={deck._id.toHexString()}
                first={i === 0}
                href={`/decks/${deck._id.toHexString()}`}
                name={deck.name}
                meta={pathName(deck.path) || undefined}
                color={deck.color}
                newCount={c.new}
                dueCount={c.due}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function Stat({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <div>
      <p className={`text-2xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</p>
      <p className="text-[13px] leading-[18px] font-medium text-body">{label}</p>
    </div>
  );
}
