let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  return audioContext;
}

/**
 * Browser erlauben Ton nur nach einer Nutzerinteraktion. Deshalb synchron in einem
 * Klick-Handler aufrufen – danach darf der AudioContext auch später noch abspielen.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
}

const BEEPS = [
  { offset: 0, frequency: 880, length: 0.18 },
  { offset: 0.3, frequency: 880, length: 0.18 },
  { offset: 0.6, frequency: 1320, length: 0.45 },
];

/**
 * Plant drei Pieptöne in `delaySec` Sekunden auf der Audio-Uhr. Die läuft – anders als
 * `setInterval` – auch in Hintergrund-Tabs ungedrosselt weiter. Liefert eine Abbruch-Funktion.
 */
export function scheduleBeeps(delaySec: number): () => void {
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  const output = ctx.createGain();
  output.gain.value = 0.15;
  output.connect(ctx.destination);

  const start = ctx.currentTime + Math.max(0, delaySec);
  for (const beep of BEEPS) {
    const t = start + beep.offset;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = beep.frequency;
    envelope.gain.setValueAtTime(0, t);
    envelope.gain.linearRampToValueAtTime(1, t + 0.01);
    envelope.gain.setValueAtTime(1, t + beep.length - 0.03);
    envelope.gain.linearRampToValueAtTime(0, t + beep.length);
    oscillator.connect(envelope).connect(output);
    oscillator.start(t);
    oscillator.stop(t + beep.length + 0.02);
  }

  return () => output.disconnect();
}

/** Sofort piepen – nur wenn der AudioContext schon freigeschaltet ist, sonst käme der Ton verspätet. */
export function beepNow(): void {
  if (audioContext?.state === 'running') scheduleBeeps(0);
}

export function vibrate(): void {
  if ('vibrate' in navigator) navigator.vibrate([250, 120, 250, 120, 500]);
}
