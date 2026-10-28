// Motor de Audio Sintetizado con Web Audio API Nativo (0 dependencias de archivos .mp3 externos)

class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Campana Doble de Cocina (Ding-Dong armónico de alta penetración acústica)
   * Se dispara automáticamente cuando entra una comanda nueva en /panaderia
   */
  public playNewOrderBell(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primer tono: DING (Sol5 - 783.99 Hz + armónico)
    this.playBellTone(ctx, 783.99, now, 0.55, 0.35);
    this.playBellTone(ctx, 1567.98, now, 0.25, 0.12);

    // Segundo tono: DONG (Mi5 - 659.25 Hz + armónico)
    this.playBellTone(ctx, 659.25, now + 0.22, 0.75, 0.38);
    this.playBellTone(ctx, 1318.51, now + 0.22, 0.35, 0.12);
  }

  private playBellTone(
    ctx: AudioContext,
    freq: number,
    startTime: number,
    duration: number,
    peakGain: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  /**
   * Sonido de Comanda Despachada (Acorde ascendente brillante)
   */
  public playOrderDispatchedSound(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // Do5 - Mi5 - Sol5 - Do6
    notes.forEach((freq, idx) => {
      this.playBellTone(ctx, freq, now + idx * 0.07, 0.32, 0.22);
    });
  }

  /**
   * Feedback táctil sutil al presionar botones en Barra
   */
  public playTapSound(pitch: number = 480): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.25, now + 0.045);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  }

  /**
   * Alerta de sabor agotado (86) o error
   */
  public play86Alert(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playBellTone(ctx, 293.66, now, 0.2, 0.25);
    this.playBellTone(ctx, 220.0, now + 0.16, 0.35, 0.28);
  }
}

export const soundEngine = new SoundEngine();
