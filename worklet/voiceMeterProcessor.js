// Based on and inspired by: https://github.com/cwilso/volume-meter
class VoiceMeterProcessor extends AudioWorkletProcessor {

  constructor(clipLevel, averaging, clipLag) {
    super();
    this.clipping = false;
    this.lastClip = 0;
    this.volume = 0;
    this.averaging = averaging || 0.95;
    this.clipLevel = clipLevel || 0.98;
    this.clipLag = clipLag || 750;
  }

  process(
    inputs,
    outputs,
    parameters
  ) {
    if (!inputs.length || !inputs[0].length) return true;

    // Get buffer for first input's first channel
    const input = inputs[0][0];
    let sum = 0;
    for (let i = 0; i < input.length; i++) {
      const x = input[i];
      sum += x * x;
      // Detect clipping (volume ~1.0)
      if (Math.abs(x) >= this.clipLevel) {
        this.clipping = true;
        this.lastClip = window.performance.now();
      }
    }
    const rms = Math.sqrt(sum / input.length);
    this.volume = Math.max(rms, this.volume * this.averaging);

    // Send message with volume value
    this.port.postMessage(
        { 
            volume: this.volume, 
            clipping: this.checkClipping(),
        }
    );

    // Returning true forces the Web Audio API to keep the node alive, while returning false allows the browser to terminate the node
    // See: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process#return_value
    return true;
  }

  checkClipping() {
    if (!this.clipping) return false;
    if (this.lastClip + this.clipLag < window.performance.now())
      this.clipping = false;
    return this.clipping;
  }
}

registerProcessor("voice-meter-processor", VoiceMeterProcessor);
