/**
 * Singleton — мастер-громкость для всего сайта.
 * PlayerStore и ambientAudio умножают свою громкость на soundStore.effective.
 */

class SoundStore {
  private _muted   = false;
  private _volume  = 0.35;   // 0–1; совпадает с начальным vol=35 в ClientShell
  private _handlers = new Set<() => void>();

  get muted():    boolean { return this._muted; }
  get volume():   number  { return this._volume; }

  /** Эффективный множитель: 0 если замьючено, иначе _volume */
  get effective(): number { return this._muted ? 0 : this._volume; }

  setMuted(muted: boolean) {
    if (this._muted === muted) return;
    this._muted = muted;
    this._emit();
  }

  setVolume(vol: number) {
    const v = Math.max(0, Math.min(1, vol));
    if (this._volume === v) return;
    this._volume = v;
    if (!this._muted) this._emit();   // нет смысла эмитировать, если замьючено
  }

  subscribe(fn: () => void): () => void {
    this._handlers.add(fn);
    return () => this._handlers.delete(fn);
  }

  private _emit() {
    this._handlers.forEach(fn => fn());
  }
}

export const soundStore = new SoundStore();
