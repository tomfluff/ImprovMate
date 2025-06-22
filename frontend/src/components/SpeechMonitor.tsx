import { useEffect, useRef } from "react";
import useMicrophone from "../hooks/useMicrophone";
import { useDisclosure } from "@mantine/hooks";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { ActionIcon, Group } from "@mantine/core";

type Props = {
  size?: "sm" | "md" | "lg" | "xl";
  radius?: "sm" | "md" | "lg" | "xl";
  controls?: boolean;
  feedback?: boolean;
  readyHandler?: (chunks: Blob) => Promise<void> | void | null;
};

const SpeechMonitor = ({
  size,
  radius,
  controls,
  feedback,
  readyHandler,
}: Props) => {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const [active, { toggle }] = useDisclosure(false, {
    onOpen: () => start(),
    onClose: () => stop(),
  });
  const { audioChunks, start, stop, halt, resume } = useMicrophone();

  useEffect(() => {
    if (audioChunks.length > 0) {
      const blob = new Blob(audioChunks, { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      audioRef.current.oncanplay = async () => {
        if (readyHandler) readyHandler(blob);
      };
    }
  }, [audioChunks, readyHandler]);

  return (
    <Group justify="center">
      <ActionIcon
        variant="filled"
        size={size ?? "xl"}
        radius={radius ?? "xl"}
        aria-label="microphone"
        onClick={toggle}
        color={active ? "red" : "gray"}
      >
        {active ? (
          <FaMicrophone style={{ width: "70%", height: "70%" }} />
        ) : (
          <FaMicrophoneSlash style={{ width: "70%", height: "70%" }} />
        )}
      </ActionIcon>
      <audio
        ref={audioRef}
        controls={controls}
        autoPlay={feedback}
        onPlay={() => halt()}
        onPause={() => resume()}
        onEnded={() => resume()}
      />
    </Group>
  );
};

export default SpeechMonitor;
