import 'server-only';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { parseFile } from 'music-metadata';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RadioEpisode {
  slug: string;
  episode: number;
  title: string;
  date: string;
  audio?: string;
  duration: string | null;
  published: boolean;
  description: string;
}

export interface EvangelineTrack {
  slug: string;
  number: number;
  title: string;
  year: string;
  audio?: string;
  duration: string | null;
  published: boolean;
}

export interface Character {
  slug: string;
  name: string;
  role: string;
  occupation: string;
  image?: string;
  imagePreview?: string;
  quote?: string;
  order: number;
  published: boolean;
  description: string;
}

export type WorldType = 'place' | 'event' | 'object' | 'recipe' | 'sound' | 'fact';

export interface WorldCard {
  slug: string;
  title: string;
  type: WorldType;
  subtitle: string;
  image?: string;
  audio?: string;
  featured: boolean;
  published: boolean;
  content: string;
}

// ─── Duration cache ───────────────────────────────────────────────────────────

const durationCache = new Map<string, string | null>();

async function getDuration(audioPath: string | undefined): Promise<string | null> {
  if (!audioPath) return null;
  if (durationCache.has(audioPath)) return durationCache.get(audioPath)!;
  try {
    const fullPath = path.join(process.cwd(), 'public', audioPath);
    if (!fs.existsSync(fullPath)) {
      durationCache.set(audioPath, null);
      return null;
    }
    const meta = await parseFile(fullPath, { duration: true });
    const sec = Math.floor(meta.format.duration ?? 0);
    if (!sec) {
      durationCache.set(audioPath, null);
      return null;
    }
    const result = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    durationCache.set(audioPath, result);
    return result;
  } catch {
    durationCache.set(audioPath, null);
    return null;
  }
}

// ─── File helpers ─────────────────────────────────────────────────────────────

function readDir(dir: string): string[] {
  const full = path.join(process.cwd(), dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => f.endsWith('.md')).sort();
}

function readMd(filePath: string): { data: Record<string, unknown>; content: string } {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content: content.trim() };
}

// ─── RSS helpers ─────────────────────────────────────────────────────────────

const MAVE_RSS = 'https://cloud.mave.digital/72601';

function rssText(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return ((m?.[1] ?? m?.[2]) || '').trim();
}

function rssAttr(block: string, tag: string, attr: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]+${attr}="([^"]*)"`, 'i'));
  return m?.[1] ?? '';
}

function rssDuration(raw: string): string | null {
  if (!raw) return null;
  if (raw.includes(':')) {
    // HH:MM:SS → M:SS  |  MM:SS → as-is
    const parts = raw.split(':');
    if (parts.length === 3) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const s = parseInt(parts[2], 10);
      const total = h * 3600 + m * 60 + s;
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    }
    return raw;
  }
  const sec = parseInt(raw, 10);
  if (!isFinite(sec) || sec <= 0) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function rssDate(pubDate: string): string {
  try {
    return new Date(pubDate).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return pubDate;
  }
}

async function fetchRSSEpisodes(): Promise<RadioEpisode[]> {
  const res = await fetch(MAVE_RSS, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`RSS ${res.status}`);
  const xml = await res.text();

  const items = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)].map(m => m[1]);

  return items.map((item, idx) => {
    const epNum = parseInt(rssText(item, 'itunes:episode'), 10) || (items.length - idx);
    return {
      slug:        `ep${String(epNum).padStart(3, '0')}`,
      episode:     epNum,
      title:       rssText(item, 'title'),
      date:        rssDate(rssText(item, 'pubDate')),
      audio:       rssAttr(item, 'enclosure', 'url') || undefined,
      duration:    rssDuration(rssText(item, 'itunes:duration')),
      published:   true,
      description: rssText(item, 'itunes:summary') || rssText(item, 'description'),
    } satisfies RadioEpisode;
  }).sort((a, b) => b.episode - a.episode);
}

// ─── Radio ────────────────────────────────────────────────────────────────────

export async function getAllEpisodes(): Promise<RadioEpisode[]> {
  // Try RSS first; fall back to local .md files (useful in offline dev)
  try {
    const rss = await fetchRSSEpisodes();
    if (rss.length > 0) return rss;
  } catch {
    // RSS unavailable — continue to local fallback
  }

  const files = readDir('content/radio');
  const episodes = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace('.md', '');
      const { data, content } = readMd(
        path.join(process.cwd(), 'content/radio', file)
      );
      const duration = await getDuration(data.audio as string | undefined);
      return {
        slug,
        episode:     Number(data.episode),
        title:       String(data.title),
        date:        String(data.date),
        audio:       data.audio ? String(data.audio) : undefined,
        duration,
        published:   Boolean(data.published),
        description: content,
      } satisfies RadioEpisode;
    })
  );
  return episodes.filter((e) => e.published).sort((a, b) => b.episode - a.episode);
}

export async function getLatestEpisode(): Promise<RadioEpisode | null> {
  const all = await getAllEpisodes();
  return all[0] ?? null;
}

// ─── Evangeline ───────────────────────────────────────────────────────────────

export async function getAllTracks(): Promise<EvangelineTrack[]> {
  const files = readDir('content/evangeline');
  const tracks = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace('.md', '');
      const { data } = readMd(
        path.join(process.cwd(), 'content/evangeline', file)
      );
      const duration = await getDuration(data.audio as string | undefined);
      return {
        slug,
        number: Number(data.number),
        title: String(data.title),
        year: String(data.year),
        audio: data.audio ? String(data.audio) : undefined,
        duration,
        published: Boolean(data.published),
      } satisfies EvangelineTrack;
    })
  );
  return tracks.filter((t) => t.published).sort((a, b) => a.number - b.number);
}

// ─── Characters ───────────────────────────────────────────────────────────────

export async function getAllCharacters(): Promise<Character[]> {
  const files = readDir('content/characters');
  const chars = files.map((file) => {
    const slug = file.replace('.md', '');
    const { data, content } = readMd(
      path.join(process.cwd(), 'content/characters', file)
    );
    return {
      slug,
      name: String(data.name),
      role: String(data.role),
      occupation: String(data.occupation),
      image: data.image ? String(data.image) : undefined,
      imagePreview: data.imagePreview ? String(data.imagePreview) : undefined,
      quote: data.quote ? String(data.quote) : undefined,
      order: Number(data.order),
      published: Boolean(data.published),
      description: content,
    } satisfies Character;
  });
  return chars.filter((c) => c.published).sort((a, b) => a.order - b.order);
}

// ─── World ────────────────────────────────────────────────────────────────────

export async function getAllWorldCards(): Promise<WorldCard[]> {
  const files = readDir('content/world');
  const cards = files.map((file) => {
    const slug = file.replace('.md', '');
    const { data, content } = readMd(
      path.join(process.cwd(), 'content/world', file)
    );
    return {
      slug,
      title: String(data.title),
      type: String(data.type) as WorldType,
      subtitle: String(data.subtitle),
      image: data.image ? String(data.image) : undefined,
      audio: data.audio ? String(data.audio) : undefined,
      featured: Boolean(data.featured),
      published: Boolean(data.published),
      content,
    } satisfies WorldCard;
  });
  return cards.filter((c) => c.published);
}

export async function getFeaturedWorldCards(): Promise<WorldCard[]> {
  return (await getAllWorldCards()).filter((c) => c.featured);
}
