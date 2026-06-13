/**
 * Ambient audio — Web Audio API graph.
 *
 * Graph:
 *   ambientNode (AudioBufferSourceNode, loop)  ─┐
 *   rainSource  (MediaElementAudioSourceNode)   ─┤─ streetFader (GainNode) ─ ctx.destination
 *   eventsNode  (AudioBufferSourceNode, once)   ─┘
 *
 * Radio / music player (PlayerStore) uses its own HTMLAudioElement — outside this graph.
 */

import { soundStore } from './soundStore';

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_VOL       = 0.38;
const FADE_SEC       = 2.0;
const RAIN_CROSS_SEC = 6.0; // crossfade duration ambient↔rain

const AMBIENT_FILES: Record<'day' | 'night', string> = {
  day:   '/audio/Ambient-day.mp3',
  night: '/audio/Ambient-night.mp3',
};

const RAIN_FILE = '/audio/sounds/Rain.mp3';

// Add files here when audio is ready. Each entry is a path.
// Code picks randomly, never repeating the same index twice in a row.
const PIPINS_FILES: string[] = [
  // '/audio/events/pipins-1.mp3',
  // '/audio/events/pipins-2.mp3',
  // '/audio/events/pipins-3.mp3',
];

const LS_MINUTES   = 'vde_minutes_total';
const LS_LAST_RAIN = 'vde_last_rain';

// ── Utilities ─────────────────────────────────────────────────────────────────

function todKey(): 'day' | 'night' {
  if (typeof document === 'undefined') return 'day';
  return document.documentElement.classList.contains('tod-night') ? 'night' : 'day';
}

function todayStr(): string {
  return new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
}

function lsRead(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

function lsSave(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}

function dispatch(name: string) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name));
}

// ── Manager ───────────────────────────────────────────────────────────────────

class AmbientAudioManager {
  // Web Audio
  private ctx:          AudioContext | null = null;
  private streetFader:  GainNode     | null = null;
  private ambientFader: GainNode     | null = null; // controls ambient vol independently
  private ambientNode:  AudioBufferSourceNode | null = null;
  private ambientBufs: Partial<Record<'day' | 'night', AudioBuffer>> = {};

  // Rain
  private rainEl:    HTMLAudioElement            | null = null;
  private rainSrc:   MediaElementAudioSourceNode | null = null;
  private rainFader: GainNode                    | null = null;
  private _rainActive           = false;  // rain file currently playing (or paused by player)
  private _rainPausedByPlayer   = false;  // rain was paused because player started
  private _rainMutedByWindow    = false;  // rain muted by window close (visual still running)
  private _rainedThisSession    = false;  // rain was triggered this session
  private _rainSetupDone        = false;  // one-time rain scheduling done
  private _rainThreshold        = 0;     // random 25–30 min, set once per session
  private _rainRandomTimer:     ReturnType<typeof setTimeout> | null = null;
  private _rainCheckTimer:      ReturnType<typeof setTimeout> | null = null;

  // Pipins whistle
  private _pipinsSessionMs  = 0;    // accumulated window-open time in this session (ms)
  private _pipinsFirstFired = false;
  private _pipinsTimer:     ReturnType<typeof setTimeout> | null = null;
  private _lastPipinsIdx    = -1;
  private _pipinsBufs:      Record<string, AudioBuffer> = {};

  // Time tracking (cross-session, for rain threshold)
  private _openTs:    number | null = null; // Date.now() when window was opened
  private _baseMs:    number = 0;           // from localStorage (all past sessions)
  private _saveTimer: ReturnType<typeof setInterval> | null = null;

  // Public state
  _userPlaying = false;

  constructor() {
    if (typeof window !== 'undefined') {
      soundStore.subscribe(() => this._onVolumeChange());
      const saved = parseFloat(lsRead(LS_MINUTES) ?? '0');
      this._baseMs = isFinite(saved) && saved > 0 ? saved * 60_000 : 0;
      window.addEventListener('kb:rain-start', () => this._onRainStart());
    }
  }

  // ── Internal: Web Audio ────────────────────────────────────────────────────

  private _targetGain(): number {
    return BASE_VOL * soundStore.effective;
  }

  private _getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.streetFader = this.ctx.createGain();
      this.streetFader.gain.value = 0;
      this.streetFader.connect(this.ctx.destination);
      // ambientFader sits between ambientNode and streetFader so we can
      // crossfade ambient out while rain fades in independently
      this.ambientFader = this.ctx.createGain();
      this.ambientFader.gain.value = 1;
      this.ambientFader.connect(this.streetFader);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private async _decodeUrl(url: string): Promise<AudioBuffer> {
    const ctx  = this._getCtx();
    const resp = await fetch(url);
    const ab   = await resp.arrayBuffer();
    return ctx.decodeAudioData(ab);
  }

  private _startAmbient(): void {
    const tod = todKey();
    const ctx = this._getCtx();
    const fader = this.streetFader;
    if (!fader) return;

    const startNode = (buf: AudioBuffer) => {
      if (!this._userPlaying) return; // user closed window while loading
      try { this.ambientNode?.stop(); } catch {}
      this.ambientNode = null;
      const node  = ctx.createBufferSource();
      node.buffer = buf;
      node.loop   = true;
      node.connect(this.ambientFader ?? fader);
      node.start(0);
      this.ambientNode = node;
    };

    if (this.ambientBufs[tod]) {
      startNode(this.ambientBufs[tod]!);
      return;
    }

    this._decodeUrl(AMBIENT_FILES[tod]).then(buf => {
      this.ambientBufs[tod] = buf;
      startNode(buf);
    }).catch(() => {});
  }

  private _rampFader(target: number, durationSec = FADE_SEC) {
    const fader = this.streetFader;
    const ctx   = this.ctx;
    if (!fader || !ctx) return;
    const now = ctx.currentTime;
    fader.gain.cancelScheduledValues(now);
    fader.gain.setValueAtTime(fader.gain.value, now);
    fader.gain.linearRampToValueAtTime(Math.max(0, target), now + durationSec);
  }

  private _onVolumeChange() {
    if (!this._userPlaying) return;
    this._rampFader(this._targetGain(), 0.25);
  }

  // ── Internal: Time tracking ───────────────────────────────────────────────

  private _elapsedMin(): number {
    const extra = this._openTs !== null ? Date.now() - this._openTs : 0;
    return (this._baseMs + extra) / 60_000;
  }

  private _startTracking() {
    this._openTs = Date.now();
    this._saveTimer = setInterval(() => {
      if (this._openTs === null) return;
      const ms = this._baseMs + (Date.now() - this._openTs);
      lsSave(LS_MINUTES, String(ms / 60_000));
    }, 30_000);
  }

  private _stopTracking() {
    if (this._openTs !== null) {
      const elapsed = Date.now() - this._openTs;
      this._baseMs          += elapsed;
      this._pipinsSessionMs += elapsed;
      this._openTs = null;
      lsSave(LS_MINUTES, String(this._baseMs / 60_000));
    }
    if (this._saveTimer !== null) {
      clearInterval(this._saveTimer);
      this._saveTimer = null;
    }
  }

  // ── Internal: Rain ────────────────────────────────────────────────────────

  private _ensureRainEl() {
    if (this.rainEl) return;
    this.rainEl = new Audio(RAIN_FILE);
    this.rainEl.preload = 'none';
    this.rainEl.addEventListener('ended', () => {
      this._rainActive = false;
      this._rainPausedByPlayer = false;
      // Fade ambient back in after rain cycle ends
      if (this.ambientFader && this.ctx) {
        const now = this.ctx.currentTime;
        this.ambientFader.gain.cancelScheduledValues(now);
        this.ambientFader.gain.setValueAtTime(this.ambientFader.gain.value, now);
        this.ambientFader.gain.linearRampToValueAtTime(1, now + RAIN_CROSS_SEC);
      }
      dispatch('kb:rain-end');
    });
  }

  private _connectRain() {
    if (this.rainSrc) return;
    this._ensureRainEl();
    const ctx   = this._getCtx();
    const fader = this.streetFader;
    if (!ctx || !fader || !this.rainEl) return;
    this.rainFader = ctx.createGain();
    this.rainFader.gain.value = 0;
    this.rainFader.connect(fader);
    this.rainSrc = ctx.createMediaElementSource(this.rainEl);
    this.rainSrc.connect(this.rainFader);
  }

  private _triggerRain() {
    if (this._rainedThisSession) return;
    this._rainedThisSession = true;
    this._rainActive        = true;
    lsSave(LS_LAST_RAIN, todayStr());

    this._connectRain();
    if (!this.rainEl || !this.rainFader || !this.ctx) return;
    this.rainEl.currentTime = 0;
    this.rainEl.play().catch(() => {});
    this._crossfadeToRain();
    dispatch('kb:rain-start');
  }

  // Handles kb:rain-start from both internal (_triggerRain) and external dispatch.
  // In production _rainActive is already true when _triggerRain dispatches → no-op.
  // On manual dispatch (testing / future integrations) → starts rain audio with fade-in.
  private _onRainStart() {
    if (this._rainActive || !this._userPlaying) return;
    this._rainActive        = true;
    this._rainedThisSession = true;
    lsSave(LS_LAST_RAIN, todayStr());
    this._connectRain();
    if (!this.rainEl || !this.rainFader || !this.ctx) return;
    this.rainEl.currentTime = 0;
    this.rainEl.play().catch(() => {});
    this._crossfadeToRain();
  }

  private _crossfadeToRain() {
    const ctx = this.ctx;
    if (!ctx || !this.rainFader) return;
    const now = ctx.currentTime;
    // Rain fades in
    this.rainFader.gain.cancelScheduledValues(now);
    this.rainFader.gain.setValueAtTime(0, now);
    this.rainFader.gain.linearRampToValueAtTime(1, now + RAIN_CROSS_SEC);
    // Ambient fades out simultaneously
    if (this.ambientFader) {
      this.ambientFader.gain.cancelScheduledValues(now);
      this.ambientFader.gain.setValueAtTime(this.ambientFader.gain.value, now);
      this.ambientFader.gain.linearRampToValueAtTime(0, now + RAIN_CROSS_SEC);
    }
  }

  private _setupRainSession() {
    if (this._rainSetupDone) return;
    this._rainSetupDone = true;

    if (lsRead(LS_LAST_RAIN) === todayStr()) return;

    this._rainThreshold = 25 + Math.random() * 5;

    if (Math.random() < 0.10) {
      const delay = (60 + Math.random() * 120) * 1_000;
      this._rainRandomTimer = setTimeout(() => {
        if (this._userPlaying && !this._rainedThisSession) this._triggerRain();
      }, delay);
    }
  }

  private _startRainCheck() {
    if (this._rainCheckTimer) clearTimeout(this._rainCheckTimer);
    if (this._rainedThisSession || !this._userPlaying) return;
    if (lsRead(LS_LAST_RAIN) === todayStr()) return;

    if (this._elapsedMin() >= this._rainThreshold) {
      this._triggerRain();
    } else {
      this._rainCheckTimer = setTimeout(() => this._startRainCheck(), 30_000);
    }
  }

  private _stopRainCheck() {
    if (this._rainCheckTimer) { clearTimeout(this._rainCheckTimer); this._rainCheckTimer = null; }
  }

  // ── Internal: Pipins ─────────────────────────────────────────────────────

  private _schedulePipins() {
    if (PIPINS_FILES.length === 0) return;
    if (this._pipinsTimer) clearTimeout(this._pipinsTimer);

    let delayMs: number;
    if (!this._pipinsFirstFired) {
      delayMs = Math.max(0, 9 * 60_000 - this._pipinsSessionMs);
    } else {
      delayMs = (10 + Math.random() * 5) * 60_000;
    }

    this._pipinsTimer = setTimeout(() => {
      if (!this._userPlaying) return;
      this._pipinsFirstFired = true;
      if (!this._rainActive) this._playPipins();
      this._schedulePipins();
    }, delayMs);
  }

  private _playPipins() {
    const ctx   = this.ctx;
    const fader = this.streetFader;
    if (!ctx || !fader || PIPINS_FILES.length === 0) return;

    const pool = PIPINS_FILES.filter((_, i) => i !== this._lastPipinsIdx);
    const chosen = pool[Math.floor(Math.random() * pool.length)] ?? PIPINS_FILES[0];
    this._lastPipinsIdx = PIPINS_FILES.indexOf(chosen);

    const play = (buf: AudioBuffer) => {
      if (!this.ctx || !this.streetFader || !this._userPlaying) return;
      const node  = this.ctx.createBufferSource();
      node.buffer = buf;
      node.connect(this.streetFader);
      node.start(0);
    };

    if (this._pipinsBufs[chosen]) {
      play(this._pipinsBufs[chosen]);
    } else {
      this._decodeUrl(chosen).then(buf => {
        this._pipinsBufs[chosen] = buf;
        play(buf);
      }).catch(() => {});
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Window opened — begin ambient. */
  play() {
    this._userPlaying = true;
    this._getCtx();

    this._rampFader(this._targetGain());
    this._startAmbient();

    if (this._rainMutedByWindow && this.rainEl && !this.rainEl.ended) {
      // Window was closed during rain — resume audio without resetting the visual
      this._rainMutedByWindow = false;
      this._rainActive = true;
      this.rainEl.play().catch(() => {});
    } else if (this._rainPausedByPlayer && this.rainEl && !this.rainEl.ended) {
      this._rainPausedByPlayer = false;
      this._rainActive = true;
      this.rainEl.play().catch(() => {});
      dispatch('kb:rain-start');
    }

    this._startTracking();
    this._setupRainSession();
    this._startRainCheck();
    this._schedulePipins();
  }

  /** Window closed (or player started). */
  stop(onDone?: () => void) {
    this._userPlaying = false;

    this._stopTracking();
    this._stopRainCheck();

    if (this._rainRandomTimer) { clearTimeout(this._rainRandomTimer); this._rainRandomTimer = null; }
    if (this._pipinsTimer)     { clearTimeout(this._pipinsTimer);     this._pipinsTimer = null; }

    this._rampFader(0);

    setTimeout(() => {
      try { this.ambientNode?.stop(); } catch {}
      this.ambientNode = null;

      if (this._rainActive && this.rainEl && !this.rainEl.ended) {
        this.rainEl.pause();
        this._rainPausedByPlayer = true;
        this._rainActive = false;
        dispatch('kb:rain-end');
      } else if (this._rainMutedByWindow) {
        // Rain was muted by window close; player is fully taking over
        this._rainMutedByWindow = false;
        this._rainPausedByPlayer = true;
      }

      onDone?.();
    }, FADE_SEC * 1_000 + 100);
  }

  /** Window closed during rain — fade audio out without resetting the visual cycle. */
  muteForWindow() {
    this._userPlaying = false;
    this._stopTracking();
    this._stopRainCheck();
    if (this._rainRandomTimer) { clearTimeout(this._rainRandomTimer); this._rainRandomTimer = null; }
    if (this._pipinsTimer)     { clearTimeout(this._pipinsTimer);     this._pipinsTimer = null; }

    this._rampFader(0);

    setTimeout(() => {
      try { this.ambientNode?.stop(); } catch {}
      this.ambientNode = null;
      if (this.rainEl && !this.rainEl.ended && this._rainActive) {
        try { this.rainEl.pause(); } catch {}
        this._rainActive = false;
        this._rainMutedByWindow = true;
      }
    }, FADE_SEC * 1_000 + 100);
  }

  get isPlaying(): boolean {
    return this._userPlaying;
  }
}

export const ambientAudio = new AmbientAudioManager();
