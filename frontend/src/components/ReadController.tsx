import { useRef } from "react";
import { Group, Button, Tooltip } from "@mantine/core";
import { useDisclosure, useOs } from "@mantine/hooks";
import getAxiosInstance from "../utils/axiosInstance";
import { FaPause, FaHeadphones } from "react-icons/fa";
import { FaRotateLeft } from "react-icons/fa6";

type Props = {
  id?: string;
  text: string;
  autoPlay?: boolean;
};

const ReadController = ({ text, autoPlay }: Props) => {
  const instance = getAxiosInstance();
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const os = useOs();

  const [playing, { open, close }] = useDisclosure(false, {
    onOpen: () => {
      if (audioRef.current) {
        audioRef.current.play();
      }
    },
    onClose: () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    },
  });

  const reset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  if (!text) return null;

  return (
    <Group justify="space-between" align="center">
      <Group gap="xs">
        <Tooltip label={!playing ? "Lettura del testo" : "Ferma lettura"} position="left" withArrow>
          <Button
            variant="filled"
            size="xs"
            radius="xl"
            onClick={playing ? close : open}
            color={"gray"}
          >
            {playing ? <FaPause /> : <FaHeadphones />}
          </Button>
        </Tooltip>

        <Tooltip label="Ricomincia lettura" position="right" withArrow>
          <Button
            variant="filled"
            size="xs"
            radius="xl"
            color="gray"
            disabled={!playing}
            onClick={reset}
          >
            <FaRotateLeft />
          </Button>
        </Tooltip>
      </Group>
      <audio
        ref={audioRef}
        autoPlay={autoPlay}
        preload="none"
        src={`${instance.defaults.baseURL}/read?os=${os}&text=${text}`}
        onEnded={close}
        onPlay={open}
        onPause={close}
      />
    </Group>
  );
};

export default ReadController;
