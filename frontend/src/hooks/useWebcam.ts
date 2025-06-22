/*
 * Custom hook to use webcam and capture content.
 * It returns the webcamRef and the base64Capture.
 *
 * @example
 * const { webcamRef, base64Capture, captureWebcam } = useWebcam();
 * <Webcam ref={webcamRef} />
 * <button onClick={() => captureWebcam()}>Capture</button>
 *
 */
import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

const useWebcam = () => {
  const webcamRef = useRef<Webcam>(null);
  const [base64Capture, setBase64Capture] = useState<string | null>(null);

  // Capture photo from webcam
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const captured = webcamRef.current.getScreenshot();
      setBase64Capture(captured);
      return captured;
    }
  }, [webcamRef]);

  const clear = useCallback(() => {
    setBase64Capture(null);
  }, []);

  return { webcamRef, base64Capture, capture, clear };
};

export default useWebcam;
