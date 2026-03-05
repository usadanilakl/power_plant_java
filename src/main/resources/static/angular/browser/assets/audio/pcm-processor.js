/**
 * AudioWorklet processor that converts Float32 audio samples to Int16 PCM.
 * Runs on a dedicated audio thread — does NOT block the main UI thread.
 *
 * Used by the Electron STT pipeline:
 *   getUserMedia → AudioContext → AudioWorkletNode('pcm-processor')
 *   → this processor converts to PCM16 → posts buffer via port.onmessage
 *   → AgentChatService sends buffer to main process via IPC → VoskManager
 */
class PcmProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0]; // mono channel
    const int16 = new Int16Array(samples.length);

    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    this.port.postMessage(int16.buffer, [int16.buffer]);
    return true;
  }
}

registerProcessor('pcm-processor', PcmProcessor);
