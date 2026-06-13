/** Client-safe utility functions (no server APIs). */

export function durToSec(d: string | null | undefined): number {
  if (!d) return 0;
  const p = String(d).split(':').map(Number);
  return p.length === 3
    ? p[0] * 3600 + p[1] * 60 + p[2]
    : (p[0] || 0) * 60 + (p[1] || 0);
}

export function fmtSec(s: number): string {
  s = Math.max(0, Math.floor(s || 0));
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return m + ':' + ss;
}
