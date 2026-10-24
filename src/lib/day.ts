/** Offset (ms) of `timeZone` from UTC at `date`. */
function tzOffset(date: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The learner's study day containing `now`: starts at `dayStartHour` local time (spec 5.2). */
export function studyDay(now: Date, timeZone: string, dayStartHour: number) {
  const local = new Date(now.getTime() + tzOffset(now, timeZone) - dayStartHour * 3_600_000);
  const key = local.toISOString().slice(0, 10);
  const [y, m, d] = key.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, dayStartHour);
  const start = new Date(guess - tzOffset(new Date(guess), timeZone));
  const nextGuess = Date.UTC(y, m - 1, d + 1, dayStartHour);
  const end = new Date(nextGuess - tzOffset(new Date(nextGuess), timeZone));
  return { key, start, end };
}
