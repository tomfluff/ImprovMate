import {
  Box,
  Button,
  Container,
  Dialog,
  Grid,
  Modal,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useRef, useState } from "react";
import useWebcam from "../hooks/useWebcam";
import getAxiosInstance from "../utils/axiosInstance";
import { useDisclosure, useInterval } from "@mantine/hooks";
import Webcam from "react-webcam";
import { useMutation } from "@tanstack/react-query";
import { setCharacterNoImage, setPremise } from "../stores/adventureStore";
import { createCallLanguage } from "../utils/llmIntegration";
import HintsModal from "./HintsModal";
import useMic from "../hooks/useMic";
import { TPremise } from "../types/Premise";
import { usePreferencesStore } from "../stores/preferencesStore";

type Props = {
  display: boolean;
  finalAction: () => void;
};

const StartImprovUploadModal = ({ display, finalAction }: Props) => {
  const { webcamRef, capture } = useWebcam();
  const {
    setAudioChunks,
    audioChunks,
    start: startAudio,
    stop: stopAudio,
  } = useMic();
  const [userDevices, setUserDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks: Blob[] = [];
  const interval = useInterval(() => {
    const frame = capture();
    if (frame) {
      setFrames((prevFrames) => [...prevFrames, frame]);
    }
  }, 300);

  const [hintsModal, { open: openHints, close: closeHints }] = useDisclosure();
  const [selectedHints, setSelectedHints] = useState<{
    [category: string]: string;
  }>({});

  const instance = getAxiosInstance();

  const handleUploadAll = useMutation({
    mutationKey: ["improv-upload-all"],
    mutationFn: ({ audio, frames }: { audio: string; frames: string[] }) => {
      // console.log("Improv in handleResult: ", improv);
      console.log("Selected hints in handleUploadAll: ", selectedHints);

      return instance
        .post("/story/improv_all", {
          audio: createCallLanguage(audio),
          frames: frames,
          hints: selectedHints,
          end: false,
        })
        .then((res) => res.data.data);
    },
    onSuccess: (data) => {
      console.log("Part generated with improv: ", data);
      const newPremise: TPremise = data.premise;
      setPremise(newPremise);
      const id = data.id;
      // const image = {src: data.image.image_url, style: "Realistic"}; //TODO: style needed to generate next story images, change style?
      const character = data.character;
      // console.log("Character generated with improv: ", id, image, character);
      console.log("Character generated with improv: ", id, character);
      // setCharacter(id, image, character);
      setCharacterNoImage(id, character);
      setSelectedHints({}); //TODO: put it after usage, here ok?

      // chooseAction(null);
      finalAction();
    },
  });

  const handleStartRecording = () => {
    console.log("Starting recording...");
    setFrames([]);
    setAudioChunks([]);
    setIsCapturing(true);
    interval.start();
    startAudio();
    chunks.length = 0; // Clear chunks before starting a new recording
    if (webcamRef.current && webcamRef.current.video) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((audioStream) => {
          const combinedStream = new MediaStream([
            ...stream.getVideoTracks(),
            ...audioStream.getAudioTracks(),
          ]);
          mediaRecorder.current = new MediaRecorder(combinedStream);
          mediaRecorder.current.onstart = () => {
            console.log("ON START");
            setMediaBlob(null);
          };
          mediaRecorder.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunks.push(event.data);
            }
          };
          mediaRecorder.current.onstop = () => {
            const blob = new Blob(chunks, { type: "video/mp4" });
            setMediaBlob(blob);
          };
          mediaRecorder.current.start();
        })
        .catch((error) => {
          console.error("Error accessing media devices.", error);
        });
    } else {
      console.log("No webcamRef.current or webcamRef.current.video");
    }
    // Stop automatically after 10 seconds
    setTimeout(() => {
      if (isCapturing) {
        console.log("TIMEOUT - Stopping recording");
        handleStopRecording();
      }
    }, 10000);
  };

  const handleStopRecording = () => {
    console.log("Stopping recording...");
    setIsCapturing(false);
    interval.stop();
    stopAudio();
    console.log("Audio chunks after stopping:", audioChunks);
    mediaRecorder.current?.stop();
  };

  const prepareUpload = async () => {
    console.log(
      `handleUpload: frames ${frames.length}, audioChunks ${audioChunks.length}`
    );
    if (frames.length === 0 || audioChunks.length == 0) return;

    const audioChunk = audioChunks[0];
    console.log("Audio chunk:", audioChunk);
    const base64Audio = await convertBlobToBase64(audioChunk);
    handleUploadAll.mutateAsync({ audio: base64Audio, frames });
  };

  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleClose = () => {
    setFrames([]);
    setAudioChunks([]);
    chunks.length = 0; //TODO: setMediaBlob(null); ??
    finalAction();
  };

  return (
    <>
      <Box className="motion-upload__wrapper">
        <Box className="motion-upload__content">
          <Modal
            opened={display}
            onClose={handleClose}
            size="lg"
            title="Capture Motion"
            centered
          >
            <Container>
              <Stack>
                <Grid>
                  <Grid.Col span={6}>
                    <Box className="motion-upload__devices">
                      <Select
                        data={userDevices.map((device) => ({
                          value: device.deviceId,
                          label: device.label,
                        }))}
                        value={activeDevice}
                        onChange={(value) => setActiveDevice(value)}
                        placeholder="Select device"
                      />
                    </Box>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Box>
                      <Button fullWidth onClick={openHints}>
                        Hints
                      </Button>
                    </Box>
                  </Grid.Col>
                </Grid>
                <Box
                  className="motion-upload__webcam"
                  style={{ position: "relative" }}
                >
                  <Box
                    className="motion-upload__overview"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      zIndex: 10,
                    }}
                    hidden={
                      (frames.length === 0 || isCapturing || !mediaBlob) &&
                      !handleUploadAll.isPending
                    }
                  >
                    {(frames.length !== 0 && !isCapturing && mediaBlob) ||
                    handleUploadAll.isPending ? (
                      <Box>
                        <video controls width="100%" style={{ zIndex: 20 }}>
                          {mediaBlob && (
                            <source
                              src={URL.createObjectURL(mediaBlob)}
                              type="video/mp4"
                            />
                          )}
                        </video>
                      </Box>
                    ) : null}
                  </Box>
                  <Webcam
                    ref={webcamRef}
                    width="100%"
                    videoConstraints={{
                      deviceId: activeDevice ?? undefined,
                    }}
                    onUserMedia={() => {
                      if (userDevices.length === 0)
                        navigator.mediaDevices
                          .enumerateDevices()
                          .then((devices) => {
                            const videoDevices = devices.filter(
                              (device) => device.kind === "videoinput"
                            );
                            setUserDevices(videoDevices);
                            setActiveDevice(videoDevices[0].deviceId);
                          });
                    }}
                  />
                </Box>
                <Grid>
                  <Grid.Col span={6}>
                    {isCapturing ? (
                      <Button
                        onClick={handleStopRecording}
                        fullWidth
                        color="red"
                        disabled={!isCapturing}
                      >
                        Stop Recording
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStartRecording}
                        fullWidth
                        color={
                          frames.length > 0 || handleUploadAll.isPending
                            ? "orange"
                            : "violet"
                        }
                        disabled={isCapturing || handleUploadAll.isPending}
                      >
                        {isCapturing
                          ? "Recording..."
                          : frames.length > 0 || handleUploadAll.isPending
                          ? "Retake"
                          : "Start Recording"}
                      </Button>
                    )}
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Button
                      onClick={prepareUpload}
                      fullWidth
                      disabled={frames.length === 0 || isCapturing}
                      loading={handleUploadAll.isPending}
                      loaderProps={{ color: "white", size: "md", type: "dots" }}
                    >
                      Send
                    </Button>
                  </Grid.Col>
                </Grid>
                {handleUploadAll.isError && (
                  <Text c="red">{handleUploadAll.error.message}</Text>
                )}
              </Stack>
              {Object.keys(selectedHints).length > 0 && (
                <Dialog opened={Object.keys(selectedHints).length > 0}>
                  <Box
                    style={{
                      height: "100%",
                    }}
                  >
                    {Object.entries(selectedHints).map(([category, hint]) => (
                      <Box key={category} mb="xs">
                        <Box
                          style={(theme) => ({
                            backgroundColor: theme.colors.violet[5],
                            padding: theme.spacing.xs,
                            borderRadius: theme.radius.sm,
                          })}
                        >
                          <Text color="white">
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </Text>
                        </Box>
                        <Box
                          style={(theme) => ({
                            padding: theme.spacing.xs,
                            borderRadius: theme.radius.sm,
                          })}
                        >
                          <Text size="sm">{hint}</Text>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Dialog>
              )}
            </Container>
          </Modal>
        </Box>
      </Box>
      <HintsModal
        display={hintsModal}
        ending={false}
        storyImprov={false}
        selectedHints={selectedHints}
        setSelectedHints={setSelectedHints}
        finalAction={closeHints}
        setEndStory={function (): void {
          throw new Error("Function not implemented.");
        }}
      />
    </>
  );
};

export default StartImprovUploadModal;
