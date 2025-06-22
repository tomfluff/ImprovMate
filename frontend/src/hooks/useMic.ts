import { useState, useRef } from 'react';

const useMic = () => {
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        console.log('Audio chunk available:', event.data);
        setAudioChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    console.log('MediaRecorder started');
  };

  const stop = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      console.log('MediaRecorder stopped');
    }
  };

  return { setAudioChunks, audioChunks, start, stop };
};

export default useMic;