import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, "..", "public");
const sampleRate = 48000;
const channels = 2;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const tau = Math.PI * 2;
const sine = (frequency, t) => Math.sin(tau * frequency * t);
const frac = (value) => value - Math.floor(value);
const noise = (i) => frac(Math.sin(i * 12.9898) * 43758.5453) * 2 - 1;

const fade = (t, duration, attack = 0.04, release = 0.12) => {
  const fadeIn = clamp(t / attack, 0, 1);
  const fadeOut = clamp((duration - t) / release, 0, 1);
  return Math.min(fadeIn, fadeOut);
};

const writeWav = async (name, duration, sampleFn) => {
  const samples = Math.ceil(duration * sampleRate);
  const dataSize = samples * channels * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples; i += 1) {
    const t = i / sampleRate;
    const [left, right] = sampleFn(t, i);
    buffer.writeInt16LE(Math.round(clamp(left, -1, 1) * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(clamp(right, -1, 1) * 32767), 44 + i * 4 + 2);
  }

  await mkdir(publicDir, { recursive: true });
  await writeFile(join(publicDir, name), buffer);
};

const music = async () => {
  const duration = 118;
  const roots = [55, 65.406, 73.416, 82.407, 61.735, 69.296, 77.782, 65.406];
  await writeWav("music.wav", duration, (t, i) => {
    const section = Math.floor(t / 14.75) % roots.length;
    const root = roots[section];
    const chord = [root, root * 1.5, root * 2, root * 2.5, root * 3];
    const padEnv = 0.55 + 0.45 * Math.sin(tau * 0.045 * t);
    const pad =
      chord.reduce((sum, freq, idx) => sum + sine(freq, t + idx * 0.003) * (0.14 / (idx + 1)), 0) *
      padEnv;

    const beatPhase = frac(t * 1.5);
    const pulseEnv = Math.exp(-beatPhase * 8);
    const bass = sine(root / 2, t) * pulseEnv * 0.16;

    const step = Math.floor(t * 4) % 8;
    const arpFreq = [root * 2, root * 2.5, root * 3, root * 4, root * 3, root * 2.5, root * 2, root * 1.5][step];
    const arpEnv = Math.exp(-frac(t * 4) * 9);
    const arp = sine(arpFreq, t) * arpEnv * 0.055;

    const hatPhase = frac(t * 6);
    const hat = noise(i) * Math.exp(-hatPhase * 20) * 0.025;
    const wide = Math.sin(tau * 0.08 * t) * 0.18;
    const master = fade(t, duration, 1.1, 2.2);
    const value = (pad + bass + arp + hat) * master;
    return [value * (0.9 - wide), value * (0.9 + wide)];
  });
};

const sfxHit = () =>
  writeWav("sfx-hit.wav", 0.9, (t) => {
    const env = Math.exp(-t * 5) * fade(t, 0.9, 0.01, 0.2);
    const boom = sine(72 - t * 24, t) * 0.45 * env;
    const shine = sine(880 + t * 540, t) * 0.16 * Math.exp(-t * 7);
    return [boom + shine, boom + shine * 1.15];
  });

const sfxPass = () =>
  writeWav("sfx-pass.wav", 0.75, (t) => {
    const env = fade(t, 0.75, 0.015, 0.18);
    const tone = sine(520 + t * 520, t) * 0.25 * env + sine(1040 + t * 260, t) * 0.14 * env;
    return [tone, tone * 1.12];
  });

const sfxDeny = () =>
  writeWav("sfx-deny.wav", 0.7, (t, i) => {
    const env = fade(t, 0.7, 0.01, 0.16);
    const buzz = sine(230 - t * 110, t) * 0.28 * env + noise(i) * 0.055 * env;
    return [buzz, buzz * 0.92];
  });

const sfxScan = () =>
  writeWav("sfx-scan.wav", 1.1, (t, i) => {
    const env = fade(t, 1.1, 0.02, 0.2);
    const sweep = sine(420 + t * 920, t) * 0.11 * env;
    const ticks = (frac(t * 12) < 0.08 ? 1 : 0) * sine(1600, t) * 0.12 * env;
    return [sweep + ticks, sweep * 1.18 + ticks + noise(i) * 0.01 * env];
  });

const sfxWhoosh = () =>
  writeWav("sfx-whoosh.wav", 1.0, (t, i) => {
    const env = Math.sin(Math.PI * clamp(t, 0, 1)) * fade(t, 1, 0.02, 0.1);
    const value = noise(i) * env * (0.15 + t * 0.14) + sine(180 + t * 480, t) * env * 0.08;
    return [value * 0.86, value * 1.12];
  });

await music();
await Promise.all([sfxHit(), sfxPass(), sfxDeny(), sfxScan(), sfxWhoosh()]);
