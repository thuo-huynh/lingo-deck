/** Splits `expected` into runs, flagging the letters that are not part of the longest common subsequence with `given`. */
export function markAnswer(expected: string, given: string) {
  const a = [...expected];
  const b = [...given];
  const eq = (x: string, y: string) => x.toLocaleLowerCase() === y.toLocaleLowerCase();
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const keep = new Array<boolean>(a.length).fill(false);
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (eq(a[i], b[j])) (keep[i] = true), i++, j++;
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }

  const parts: { text: string; wrong: boolean }[] = [];
  a.forEach((ch, i) => {
    const wrong = !keep[i];
    const last = parts.at(-1);
    if (last && last.wrong === wrong) last.text += ch;
    else parts.push({ text: ch, wrong });
  });
  return parts;
}
