/**
 * High-performance browser-native audio downsampler and chunking engine.
 * Solves Vercel's 4.5MB serverless payload limit for ANY file size (10MB, 50MB, 100MB+)
 * by downsampling to 16kHz mono and slicing into 65-second payload-safe chunks.
 */

export interface AudioChunk {
  base64: string;
  mimeType: string;
  startTimeSeconds: number;
  durationSeconds: number;
  chunkIndex: number;
  totalChunks: number;
}

// Convert AudioBuffer / Float32Array to 16-bit PCM Mono WAV ArrayBuffer
function encodeWav(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + samples.length * 2, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM = 1)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate (16000)
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * 1 channel * 2 bytes = 32000)
  view.setUint32(28, sampleRate * 2, true);
  // block align (1 * 2 = 2)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, samples.length * 2, true);

  // Write 16-bit PCM samples with clipping protection
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Convert ArrayBuffer to Base64 in 32KB chunks to prevent call-stack overflows
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let chunkStr = '';
    for (let j = 0; j < chunk.length; j++) {
      chunkStr += String.fromCharCode(chunk[j]);
    }
    binary += chunkStr;
  }
  return btoa(binary);
}

/**
 * Resamples any audio file (MP3, WAV, M4A, WEBM, OGG, FLAC) to 16,000 Hz Mono
 * and splits it into slices under 65 seconds (~2.1 MB WAV / ~2.8 MB Base64).
 * This guarantees the payload will NEVER exceed Vercel's 4.5MB limit.
 */
export async function processAudioIntoPayloadSafeChunks(
  file: File,
  onProgress?: (message: string, percent?: number) => void
): Promise<AudioChunk[]> {
  const TARGET_SAMPLE_RATE = 16000;
  // 65 seconds of 16kHz mono = 1,040,000 samples = ~2.08 MB WAV = ~2.77 MB Base64 (well under 4.5MB limit)
  const CHUNK_DURATION_SEC = 65;

  onProgress?.('Decoding audio file in browser...', 5);
  const arrayBuffer = await file.arrayBuffer();

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API is not supported by your browser.');
  }

  const audioCtx = new AudioContextClass();
  let decodedBuffer: AudioBuffer;
  try {
    decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err: any) {
    console.warn('Direct decode failed, checking if raw file is small enough:', err);
    // If decoding failed but file is under 2.5MB, return raw base64 as single chunk
    if (file.size < 2.5 * 1024 * 1024) {
      const base64 = arrayBufferToBase64(arrayBuffer);
      return [
        {
          base64,
          mimeType: file.type || 'audio/mp3',
          startTimeSeconds: 0,
          durationSeconds: 0,
          chunkIndex: 1,
          totalChunks: 1,
        },
      ];
    }
    throw new Error(
      `Could not decode audio format: ${file.name}. Please ensure it is a valid audio file (MP3, WAV, M4A, WEBM, OGG).`
    );
  } finally {
    audioCtx.close().catch(() => {});
  }

  const originalDuration = decodedBuffer.duration;
  const targetSampleCount = Math.ceil(originalDuration * TARGET_SAMPLE_RATE);

  onProgress?.(`Resampling audio to 16kHz speech fidelity (${Math.round(originalDuration)}s total)...`, 15);

  // Use OfflineAudioContext for high-speed hardware-accelerated downsampling to mono 16kHz
  const offlineCtx = new OfflineAudioContext(1, targetSampleCount, TARGET_SAMPLE_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = decodedBuffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  const monoSamples = renderedBuffer.getChannelData(0);

  const samplesPerChunk = CHUNK_DURATION_SEC * TARGET_SAMPLE_RATE;
  const totalChunks = Math.max(1, Math.ceil(monoSamples.length / samplesPerChunk));

  const chunks: AudioChunk[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const startSample = i * samplesPerChunk;
    const endSample = Math.min(monoSamples.length, startSample + samplesPerChunk);
    const chunkSamples = monoSamples.subarray(startSample, endSample);

    const wavBuffer = encodeWav(chunkSamples, TARGET_SAMPLE_RATE);
    const base64 = arrayBufferToBase64(wavBuffer);

    const startTimeSeconds = i * CHUNK_DURATION_SEC;
    const durationSeconds = chunkSamples.length / TARGET_SAMPLE_RATE;

    chunks.push({
      base64,
      mimeType: 'audio/wav',
      startTimeSeconds,
      durationSeconds,
      chunkIndex: i + 1,
      totalChunks,
    });
  }

  onProgress?.(`Audio prepared into ${totalChunks} payload-safe slice${totalChunks > 1 ? 's' : ''}`, 25);
  return chunks;
}
