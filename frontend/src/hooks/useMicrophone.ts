/* (Inspired by: https://github.com/solyarisoftware/webad)
 *
 * This hook is used to record audio from the microphone.
 * It uses the MediaRecorder API to record the audio.
 * The audio is recorded as soon as the user starts speaking.
 * The recording stops when the user stops speaking.
 * The recording is then stored in the audioChunks state.
 *
 * status: "stopped" | "listening" | "recording"
 * isClipping: boolean, true if the audio is clipping (too loud)
 *
 * @example
 * const { status, isClipping, audioChunks, start, stop, halt, resume } = useMicrophone();
 * <button onClick={start}>Start</button>
 * <button onClick={stop}>Stop</button>
 *
 */
import { useEffect, useRef, useState } from "react";

const defaultVoiceMeterConfig = {
  clipLag: 750,
  clipLevel: 0.98,
  averaging: 0.95,
};

const defaultVolumeConfig = {
  mute: 0.0001,
  silence: 0.0001,
  speaking: 0.02,
  min_avg_speaking: 0.04,
  min_speaking_duration: 750,
  detection_interval: 250,
  time_interval: 50,
};

const createAudioMeter = async (
  audioContext: AudioContext,
  config?: typeof defaultVoiceMeterConfig
): Promise<AudioWorkletNode | null> => {
  await audioContext.audioWorklet.addModule("worklet/voiceMeterProcessor.js");
  const meter = new AudioWorkletNode(audioContext, "voice-meter-processor", {
    parameterData: {
      ...defaultVoiceMeterConfig,
      ...config,
    },
  });
  return meter;
};

type TStatus = "stopped" | "listening" | "recording";
type TMode = "mute" | "speaking" | "silence";

interface IVolumeMeterEventDetail {
  volume: number;
  timestamp: number;
  duration: number;
}

interface IVoiceData {
  mode: TMode;
  isRecording: boolean;
  isSpeechStarted: boolean;
  isEnabled: boolean;
  speechStart: number;
  speechEnd: number;
  speechItemsNum: number;
  silenceItemsNum: number;
  preSpeechItemsNum: number;
}

const useMicrophone = () => {
  const [status, setStatus] = useState<TStatus>("stopped");

  const voiceDataRef = useRef<IVoiceData>({
    mode: "mute",
    isRecording: false,
    isSpeechStarted: false,
    isEnabled: false,
    speechStart: 0,
    speechEnd: 0,
    speechItemsNum: 0,
    silenceItemsNum: 0,
    preSpeechItemsNum: 0,
  });
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const meterRef = useRef<AudioWorkletNode | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isClipping, setIsClipping] = useState(false);

  const handlePreSpeechProcessing = () => {
    ++voiceDataRef.current.preSpeechItemsNum;
    if (
      voiceDataRef.current.preSpeechItemsNum >=
      defaultVolumeConfig.detection_interval / defaultVolumeConfig.time_interval
    ) {
      if (!voiceDataRef.current.isSpeechStarted) {
        recorderRestart();
      }
      voiceDataRef.current.preSpeechItemsNum = 0;
    }
  };

  /*
   * Handle volume detection events and dispatch them to the DOM.
   * Event handler for the port.onmessage event, from the AudioWorkletNode.
   */
  const handleVolumeDetection = (volume: number) => {
    if (!voiceDataRef.current.isEnabled) return;

    const detail: IVolumeMeterEventDetail = {
      volume: volume,
      timestamp: Date.now(),
      duration: Date.now() - voiceDataRef.current.speechStart,
    };

    if (volume < defaultVolumeConfig.mute) {
      document.dispatchEvent(new CustomEvent("mute", { detail: detail }));
    } else if (volume > defaultVolumeConfig.speaking) {
      document.dispatchEvent(new CustomEvent("speaking", { detail: detail }));
    } else {
      document.dispatchEvent(new CustomEvent("silence", { detail: detail }));
    }
  };

  const recorderRestart = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current.start();
      setStatus("listening");
      voiceDataRef.current.isRecording = true;
    }
  };

  const recorderPause = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setStatus("listening");
      voiceDataRef.current.isRecording = false;
    }
  };

  const recorderStop = () => {
    if (recorderRef.current) recorderRef.current.stop();
    recorderRef.current = null;
    voiceDataRef.current.isRecording = false;
  };

  const meterStop = () => {
    if (meterRef.current) meterRef.current.disconnect();
    meterRef.current = null;
  };

  const sourceStop = () => {
    if (sourceRef.current) sourceRef.current.disconnect();
    sourceRef.current = null;
  };

  const onMuteEvent = (e: CustomEvent<IVolumeMeterEventDetail>) => {
    e.preventDefault();
    voiceDataRef.current.mode = "mute";
    // TODO: Maybe do more...
  };

  const onSpeakingEvent = (e: CustomEvent<IVolumeMeterEventDetail>) => {
    if (!voiceDataRef.current.isSpeechStarted) {
      setStatus("recording");
      voiceDataRef.current.speechStart = e.detail.timestamp;
      voiceDataRef.current.isSpeechStarted = true;
      voiceDataRef.current.speechItemsNum = 0;
    }
    voiceDataRef.current.silenceItemsNum = 0;
    voiceDataRef.current.mode = "speaking";
    ++voiceDataRef.current.speechItemsNum;
    // TODO: Maybe do more...
  };

  const onSilenceEvent = (e: CustomEvent<IVolumeMeterEventDetail>) => {
    ++voiceDataRef.current.silenceItemsNum;

    // Speech started and max post-speech silence time reached
    if (
      voiceDataRef.current.isSpeechStarted &&
      voiceDataRef.current.silenceItemsNum >=
      defaultVolumeConfig.detection_interval
    ) {
      // Speech not valid: Aborted
      if (e.detail.duration < defaultVolumeConfig.min_speaking_duration) {
        voiceDataRef.current.speechItemsNum = 0;
        recorderRestart();
      }
      // Speech valid: Ended
      else {
        recorderPause();
      }
      voiceDataRef.current.isSpeechStarted = false;
    }
  };

  useEffect(() => {
    document.addEventListener("mute", onMuteEvent as EventListener);
    document.addEventListener("silence", onSilenceEvent as EventListener);
    document.addEventListener("speaking", onSpeakingEvent as EventListener);
    const preSpeechTimer = setInterval(
      handlePreSpeechProcessing,
      defaultVolumeConfig.time_interval
    );
    return () => {
      clearInterval(preSpeechTimer);
      document.removeEventListener("mute", onMuteEvent as EventListener);
      document.removeEventListener("silence", onSilenceEvent as EventListener);
      document.removeEventListener(
        "speaking",
        onSpeakingEvent as EventListener
      );
    };
  }, []);

  const terminate = () => {
    sourceStop();
    meterStop();
    recorderStop();
    voiceDataRef.current.isEnabled = false;
  };

  const initialize = async () => {
    // Create an AudioContext object for the audio processing.
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    audioContextRef.current.resume();

    // Then create a MediaStreamAudioSourceNode object for the audio input.
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current = source;
    // Create a new volume meter and connect it.
    const meter = await createAudioMeter(audioContextRef.current);
    meterRef.current = meter;

    // Set up the recorder
    const recorder = new MediaRecorder(source.mediaStream, {
      mimeType: "audio/webm",
    });
    recorder.ondataavailable = (e) => {
      if (voiceDataRef.current.speechItemsNum > 0) {
        voiceDataRef.current.speechItemsNum = 0;
        setAudioChunks(() => [e.data]);
      }
    };
    recorderRef.current = recorder;

    if (meter) {
      source.connect(meter);
      meter.port.onmessage = (e) => {
        handleVolumeDetection(e.data.volume);
        setIsClipping(e.data.clipping);
      };
    }

    voiceDataRef.current.isEnabled = true;
  };

  const halt = () => {
    voiceDataRef.current.isEnabled = false;
  };

  const resume = () => {
    voiceDataRef.current.isEnabled = true;
  };

  const stop = () => {
    if (status === "stopped") return;
    terminate();
    setStatus("stopped");
  };

  const start = () => {
    if (status !== "stopped") return;
    setAudioChunks([]);
    setIsClipping(false);
    initialize();
    setStatus("listening");
  };

  return { status, isClipping, audioChunks, start, stop, halt, resume };
};

export default useMicrophone;
