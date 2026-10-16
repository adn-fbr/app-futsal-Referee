const REGION_PALETTE = [
  { border: "border-sky-500", bg: "bg-sky-50 dark:bg-sky-950/30", dot: "bg-sky-500", text: "text-sky-700 dark:text-sky-300" },
  { border: "border-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  { border: "border-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
  { border: "border-rose-500", bg: "bg-rose-50 dark:bg-rose-950/30", dot: "bg-rose-500", text: "text-rose-700 dark:text-rose-300" },
  { border: "border-violet-500", bg: "bg-violet-50 dark:bg-violet-950/30", dot: "bg-violet-500", text: "text-violet-700 dark:text-violet-300" },
  { border: "border-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30", dot: "bg-cyan-500", text: "text-cyan-700 dark:text-cyan-300" },
];

export function getRegionColor(regionId: string | null | undefined) {
  if (!regionId) return { border: "border-slate-400", bg: "bg-slate-50 dark:bg-slate-950/30", dot: "bg-slate-400", text: "text-slate-700 dark:text-slate-300" };
  let hash = 0;
  for (const character of regionId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return REGION_PALETTE[hash % REGION_PALETTE.length];
}
