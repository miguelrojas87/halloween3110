import { EventSettings } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isTicking = false;
  private tickInterval: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Ignore audio errors when autoplay is blocked
    }
  }

  public playWaxSealBreak(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Crisp Wax Crack (Filtered Noise Burst)
      const bufferSize = ctx.sampleRate * 0.22;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.045));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, now);
      bandpass.Q.setValueAtTime(1.8, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      whiteNoise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);

      // 2. Second Secondary Snap (Fracture click at +80ms)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'sawtooth';
      snapOsc.frequency.setValueAtTime(520, now + 0.08);
      snapOsc.frequency.exponentialRampToValueAtTime(90, now + 0.16);
      snapGain.gain.setValueAtTime(0.001, now);
      snapGain.gain.setValueAtTime(0.28, now + 0.08);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now + 0.08);
      snapOsc.stop(now + 0.18);

      // 3. Deep Gothic Thud & Parchment Resonance
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(160, now);
      thudOsc.frequency.exponentialRampToValueAtTime(42, now + 0.45);

      thudGain.gain.setValueAtTime(0.32, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);
      thudOsc.start(now);
      thudOsc.stop(now + 0.5);
    } catch {
      // Ignore
    }
  }

  public playBellChime(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      const frequencies = [220, 440, 659.25];
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.12 / (idx + 1), ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.45);
      });
    } catch {
      // Ignore
    }
  }

  public toggleAmbientTicking(forceState?: boolean): boolean {
    const nextState = forceState !== undefined ? forceState : !this.isTicking;
    if (nextState) {
      this.ensureContext();
      this.isTicking = true;
      if (this.tickInterval) window.clearInterval(this.tickInterval);
      this.playTick();
      this.tickInterval = window.setInterval(() => {
        if (this.isTicking) this.playTick();
      }, 1000);
    } else {
      this.isTicking = false;
      if (this.tickInterval) {
        window.clearInterval(this.tickInterval);
        this.tickInterval = null;
      }
    }
    return this.isTicking;
  }

  public getIsTicking(): boolean {
    return this.isTicking;
  }
}

export const soundEngine = new SoundEngine();

export function downloadCalendarIcs(event: EventSettings, guestName?: string): void {
  const title = `${event.event_title} — Blood on the Clocktower`;
  const description = `Convocatoria oficial en Ravenswood Bluff para ${
    guestName || 'Invitado'
  }. Mapa: ${event.event_maps_url || 'https://maps.app.goo.gl/13u9kLx49EwfpbDT6'} — Código de vestimenta: ${event.dress_code}`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ravenswood Bluff//Blood on the Clocktower Halloween//ES',
    'BEGIN:VEVENT',
    `UID:ravenswood-${Date.now()}@clocktower.local`,
    'DTSTAMP:20261026T180000Z',
    'DTSTART:20261031T180000',
    'DTEND:20261101T010000',
    `SUMMARY:${title}`,
    `LOCATION:${event.event_location}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'noche-blood-on-the-clocktower.ics';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
