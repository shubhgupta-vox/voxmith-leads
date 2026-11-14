export type GhSeriesPoint = { day: string; runs: number; new_people: number };

export const shortId = (id: string) => id.slice(0, 8);

/** "2026-11-03" -> "Nov 3". Parsed by hand so the viewer's timezone cannot shift the day. */
export function dayLabel(day: string): string {
  const [, m, d] = day.split("-").map(Number);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}`;
}

export const csvFilename = (today: Date) => `groundhog-installs-${today.toISOString().slice(0, 10)}.csv`;

export type Bar = { x: number; y: number; w: number; h: number; day: string; value: number };

/** Maps a series to bar rectangles inside a width x height box. The tallest bar fills the height; zero gets no height; a non-zero value is at least 1px tall. */
export function toBars(series: GhSeriesPoint[], key: "runs" | "new_people", width: number, height: number): Bar[] {
  const max = Math.max(0, ...series.map((p) => p[key]));
  const slot = series.length ? width / series.length : 0;
  return series.map((p, i) => {
    const v = p[key];
    const h = max === 0 || v === 0 ? 0 : Math.max(1, Math.round((v / max) * height));
    return { x: i * slot, y: height - h, w: Math.max(1, slot - 2), h, day: p.day, value: v };
  });
}

export function chartSummary(series: GhSeriesPoint[], key: "runs" | "new_people", noun: string): string {
  if (!series.length) return `No ${noun} data.`;
  const total = series.reduce((a, p) => a + p[key], 0);
  const peak = series.reduce((a, p) => (p[key] > a[key] ? p : a));
  const range = `${dayLabel(series[0].day)} to ${dayLabel(series[series.length - 1].day)}`;
  return total === 0 ? `No ${noun} from ${range}.` : `${total} ${noun} from ${range}. Busiest day: ${dayLabel(peak.day)}, ${peak[key]}.`;
}

export function showing(page: number, pageSize: number, total: number, count: number): string {
  if (total === 0 || count === 0) return "Showing 0 of 0";
  const from = (page - 1) * pageSize + 1;
  return `Showing ${from} to ${from + count - 1} of ${total}`;
}
