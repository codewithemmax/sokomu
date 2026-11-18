"use client";

export const PCM_SAMPLE_RATE = 24_000;

export interface PcmConversionResult {
  samples: Float32Array;
  carryOut: Uint8Array | null;
}

export function pcm16LeToFloat32(
  bytes: Uint8Array,
  carryIn: Uint8Array | null = null,
): PcmConversionResult {
  let buf = bytes;
  if (carryIn && carryIn.length > 0) {
    buf = new Uint8Array(carryIn.length + bytes.length);
    buf.set(carryIn, 0);
    buf.set(bytes, carryIn.length);
  }

  let carryOut: Uint8Array | null = null;
  if (buf.length % 2 === 1) {
    carryOut = buf.slice(buf.length - 1);
    buf = buf.slice(0, buf.length - 1);
  }

  if (buf.byteLength === 0) {
    return { samples: new Float32Array(0), carryOut };
  }

  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const sampleCount = buf.byteLength / 2;
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < sampleCount; i += 1) {
    samples[i] = view.getInt16(i * 2, true) / 32768;
  }

  return { samples, carryOut };
}

export function concatPcmChunks(chunks: readonly Uint8Array[]): ArrayBuffer {
  const totalBytes = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return combined.buffer;
}

export function estimatePcmDurationMs(
  byteLength: number,
  sampleRate = PCM_SAMPLE_RATE,
): number {
  if (byteLength <= 0 || sampleRate <= 0) return 0;
  const bytesPerSecond = sampleRate * 2;
  return Math.round((byteLength / bytesPerSecond) * 1000);
}

export class PcmStreamPlayer {
  private ctx: AudioContext | null = null;
  private nextStart = 0;
  private carry: Uint8Array | null = null;
  private activeSources = new Set<AudioBufferSourceNode>();

  private ensureContext(): AudioContext {
    if (typeof window === "undefined") {
      throw new Error("PcmStreamPlayer requires a browser AudioContext.");
    }
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: PCM_SAMPLE_RATE });
      this.nextStart = 0;
    }
    return this.ctx;
  }

  enqueue(bytes: Uint8Array): number {
    const { samples, carryOut } = pcm16LeToFloat32(bytes, this.carry);
    this.carry = carryOut;
    if (samples.length === 0) {
      return 0;
    }

    const ctx = this.ensureContext();
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }
    const audioBuffer = ctx.createBuffer(1, samples.length, PCM_SAMPLE_RATE);
    audioBuffer.copyToChannel(new Float32Array(samples), 0);

    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    src.connect(ctx.destination);

    this.activeSources.add(src);
    src.onended = () => {
      this.activeSources.delete(src);
    };

    const startAt = Math.max(ctx.currentTime + 0.05, this.nextStart);
    src.start(startAt);
    this.nextStart = startAt + audioBuffer.duration;
    return audioBuffer.duration;
  }

  playPcmBuffer(pcm: ArrayBuffer): number {
    this.carry = null;
    return this.enqueue(new Uint8Array(pcm));
  }

  stop(): void {
    for (const src of this.activeSources) {
      try {
        src.stop();
      } catch {
        // Ignore already stopped source nodes.
      }
    }
    this.activeSources.clear();
    this.carry = null;
    this.nextStart = 0;
  }

  /**
   * Create and unlock the AudioContext. Must be called synchronously inside a
   * user gesture (click/tap) BEFORE any await: browsers keep contexts created
   * outside a gesture suspended, which makes playback silent. Also plays one
   * silent sample, which iOS Safari needs to fully unlock output.
   */
  prime(): void {
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") {
      void ctx.resume().catch(() => undefined);
    }
    const silent = ctx.createBuffer(1, 1, PCM_SAMPLE_RATE);
    const src = ctx.createBufferSource();
    src.buffer = silent;
    src.connect(ctx.destination);
    src.start(0);
  }

  async resume(): Promise<void> {
    if (this.ctx && this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  async close(): Promise<void> {
    this.stop();
    if (this.ctx && this.ctx.state !== "closed") {
      await this.ctx.close();
    }
    this.ctx = null;
  }
}
