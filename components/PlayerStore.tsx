'use client';

import { createContext, useContext, useRef, useEffect, useState, useCallback, ReactNode } from 'react';
import { ambientAudio } from '@/lib/ambientAudio';
import { soundStore } from '@/lib/soundStore';
import { durToSec } from '@/lib/utils';

export type Track = {
  id: string;
  kind: 'episode' | 'music' | 'sound';
  n: number;
  title: string;
  subtitle: string;
  duration: string;
  totalSec: number;
  accent: 'warm' | 'gold';
  list: 'episodes' | 'music' | 'sounds';
  audioFile?: string;
};

type PlayerState = {
  track: Track | null;
  playing: boolean;
  t: number;
  volume: number;
};

type PlayerStore = {
  state: PlayerState;
  play: (track: Track) => void;
  pause: () => void;
  toggle: () => void;
  seekFrac: (f: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
  close: () => void;
  getPlaylist: (list: 'episodes' | 'music' | 'sounds') => Track[];
  setPlaylist: (list: 'episodes' | 'music' | 'sounds', tracks: Track[]) => void;
};

const LS_KEY = 'kb-player-v2';

const PlayerContext = createContext<PlayerStore | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistsRef = useRef<{ episodes: Track[]; music: Track[]; sounds: Track[] }>({ episodes: [], music: [], sounds: [] });
  // Snapshot of saved state — used in the one-time mount effect below
  const savedRef = useRef({ track: null as Track | null, t: 0 });

  const loadSaved = (): PlayerState => {
    if (typeof window === 'undefined') return { track: null, playing: false, t: 0, volume: 0.8 };
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (saved && saved.track) {
        const t = Math.max(0, Math.min(saved.t || 0, saved.track.totalSec || 0));
        // Capture for the mount effect — state hasn't initialised yet at this point
        savedRef.current = { track: saved.track, t };
        return { track: saved.track, playing: false, t, volume: typeof saved.volume === 'number' ? saved.volume : 0.8 };
      }
    } catch (_) {}
    return { track: null, playing: false, t: 0, volume: 0.8 };
  };

  const [state, setState] = useState<PlayerState>(() => loadSaved());

  const persist = useCallback((s: PlayerState) => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ track: s.track, t: s.t, volume: s.volume }));
    } catch (_) {}
  }, []);

  // Sync audio element with state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setState(prev => {
        const t = audio.currentTime;
        const next = { ...prev, t };
        persist(next);
        return next;
      });
    };
    const onEnded = () => {
      setState(prev => ({ ...prev, playing: false, t: prev.track?.totalSec || 0 }));
    };
    const onLoadedMetadata = () => {
      const realSec = audio.duration;
      if (!isFinite(realSec) || realSec <= 0) return;
      const mins = Math.floor(realSec / 60);
      const secs = Math.floor(realSec % 60);
      const duration = `${mins}:${String(secs).padStart(2, '0')}`;
      setState(prev => {
        if (!prev.track) return prev;
        return { ...prev, track: { ...prev.track, totalSec: Math.floor(realSec), duration } };
      });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [persist]);

  // On mount: restore audio src/position from saved localStorage state so
  // the play button works immediately after a page reload.
  useEffect(() => {
    const audio = audioRef.current;
    const { track, t } = savedRef.current;
    if (!audio || !track?.audioFile) return;
    audio.src = track.audioFile;
    audio.currentTime = t;
    audio.preload = 'metadata';
  }, []); // intentionally empty — runs once on mount only

  // Ref для актуальной громкости — нужен в замыкании подписки soundStore
  const volumeRef = useRef(state.volume);
  useEffect(() => { volumeRef.current = state.volume; }, [state.volume]);

  // Применяем громкость: playerVolume × masterVolume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = state.volume * soundStore.effective;
  }, [state.volume]);

  // Реагируем на изменения мастер-громкости (мьют / слайдер)
  useEffect(() => {
    return soundStore.subscribe(() => {
      if (audioRef.current) audioRef.current.volume = volumeRef.current * soundStore.effective;
    });
  }, []);

  const play = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Гасим амбиент напрямую — работает на любой странице, даже если Window не смонтирован
    ambientAudio.stop();
    // Сообщаем Window-компоненту, чтобы визуально закрыл окно (если на главной)
    window.dispatchEvent(new CustomEvent('kb:audio-play'));

    setState(prev => {
      const sameTrack = prev.track?.id === track.id;
      if (!sameTrack) {
        // New track
        if (track.audioFile) {
          audio.src = track.audioFile;
          audio.currentTime = 0;
        } else {
          audio.src = '';
        }
        const next = { ...prev, track, t: 0, playing: true };
        persist(next);
        if (track.audioFile) audio.play().catch(() => {});
        return next;
      } else {
        // Same track, resume
        const next = { ...prev, playing: true };
        persist(next);
        if (track.audioFile && audio.src) audio.play().catch(() => {});
        return next;
      }
    });
  }, [persist]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setState(prev => {
      const next = { ...prev, playing: false };
      persist(next);
      return next;
    });
  }, [persist]);

  const toggle = useCallback(() => {
    setState(prev => {
      if (!prev.track) return prev;
      const audio = audioRef.current;
      if (prev.playing) {
        if (audio) audio.pause();
        const next = { ...prev, playing: false };
        persist(next);
        return next;
      } else {
        if (audio && prev.track.audioFile) {
          // Defensive: after a reload the audio element is blank — restore src before playing
          if (!audio.currentSrc) {
            audio.src = prev.track.audioFile;
            audio.currentTime = prev.t;
          }
          audio.play().catch(() => {});
        }
        const next = { ...prev, playing: true };
        persist(next);
        return next;
      }
    });
  }, [persist]);

  const seekFrac = useCallback((f: number) => {
    setState(prev => {
      if (!prev.track) return prev;
      const t = Math.max(0, Math.min(1, f)) * prev.track.totalSec;
      const audio = audioRef.current;
      if (audio && prev.track.audioFile && audio.src) {
        audio.currentTime = t;
      }
      const next = { ...prev, t };
      persist(next);
      return next;
    });
  }, [persist]);

  const setVolume = useCallback((v: number) => {
    const vol = Math.max(0, Math.min(1, v));
    if (audioRef.current) audioRef.current.volume = vol;
    setState(prev => {
      const next = { ...prev, volume: vol };
      persist(next);
      return next;
    });
  }, [persist]);

  const step = useCallback((dir: 1 | -1) => {
    setState(prev => {
      if (!prev.track) return prev;
      const list = playlistsRef.current[prev.track.list] || [];
      const i = list.findIndex(x => x.id === prev.track!.id);
      if (i < 0) return prev;
      const nx = list[(i + dir + list.length) % list.length];
      const audio = audioRef.current;
      if (audio) {
        if (nx.audioFile) {
          audio.src = nx.audioFile;
          audio.currentTime = 0;
          if (prev.playing) audio.play().catch(() => {});
        } else {
          audio.src = '';
        }
      }
      const next = { ...prev, track: nx, t: 0 };
      persist(next);
      return next;
    });
  }, [persist]);

  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) { audio.pause(); audio.src = ''; }
    setState(prev => {
      const next = { ...prev, track: null, playing: false, t: 0 };
      persist(next);
      return next;
    });
  }, [persist]);

  const getPlaylist = useCallback((list: 'episodes' | 'music' | 'sounds') => {
    return playlistsRef.current[list] || [];
  }, []);

  const setPlaylist = useCallback((list: 'episodes' | 'music' | 'sounds', tracks: Track[]) => {
    playlistsRef.current[list] = tracks;
  }, []);

  return (
    <PlayerContext.Provider value={{ state, play, pause, toggle, seekFrac, setVolume, next, prev, close, getPlaylist, setPlaylist }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerStore {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export function epToTrack(ep: { episode: number; title: string; duration: string | null; audio?: string }): Track {
  return {
    id: 'ep-' + ep.episode,
    kind: 'episode',
    n: ep.episode,
    title: ep.title,
    subtitle: 'эпизод № ' + ep.episode,
    duration: ep.duration ?? '—',
    totalSec: durToSec(ep.duration),
    accent: 'warm',
    list: 'episodes',
    audioFile: ep.audio,
  };
}

export function musicToTrack(tr: { number: number; title: string; duration: string | null; audio?: string }): Track {
  return {
    id: 'mus-' + tr.number,
    kind: 'music',
    n: tr.number,
    title: tr.title,
    subtitle: 'Эванджелин · № ' + String(tr.number).padStart(2, '0'),
    duration: tr.duration ?? '—',
    totalSec: durToSec(tr.duration),
    accent: 'gold',
    list: 'music',
    audioFile: tr.audio,
  };
}

export function worldSoundToTrack(card: { slug: string; title: string; subtitle: string; audio?: string }): Track {
  return {
    id: 'sound-' + card.slug,
    kind: 'sound',
    n: 0,
    title: card.title,
    subtitle: card.subtitle || 'звук',
    duration: '—',
    totalSec: 0,
    accent: 'warm',
    list: 'sounds',
    audioFile: card.audio,
  };
}
