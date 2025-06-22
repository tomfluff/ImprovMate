import useWebcam from "../hooks/useWebcam";
import {
  Text,
  Grid,
  Stack,
  Button,
  Container,
  Image,
  Modal,
  Loader,
} from "@mantine/core";
import Webcam from "react-webcam";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import { setCharacter } from "../stores/adventureStore";
import { createCallContext } from "../utils/llmIntegration";
import { useMemo } from "react";

type Props = {
  display: boolean;
  finalAction: () => void;
};

const DrawingUploadModal = ({ display, finalAction }: Props) => {
  const { webcamRef, base64Capture, capture, clear } = useWebcam();
  const [click, { toggle: toggleClick }] = useDisclosure(false);
  const instance = getAxiosInstance();
  const isMobile = useMediaQuery("(max-width: 50em)");

  const [webcamDirection, { toggle: toggleWebcamDirection }] = useDisclosure(
    !isMobile
  );

  const videoConstraints = useMemo(() => {
    return {
      facingMode: webcamDirection ? "user" : { exact: "environment" },
    };
  }, [webcamDirection]);

  const uploadImage = useMutation({
    mutationKey: ["webcam"],
    mutationFn: (capture: string) => {
      return instance
        .post("/character", createCallContext({ image: capture, type: "jpeg" }))
        .then((res) => res.data);
    },
    onSuccess: (data) => {
      const id = data.data.id;
      const image = data.data.image;
      const character = data.data.character;
      setCharacter(id, image, character);
      clear();
      finalAction();
    },
  });

  const handleCapture = () => {
    capture();
    toggleClick();
  };

  const handleRetake = () => {
    clear();
    toggleClick();
  };

  const handleSend = () => {
    if (!base64Capture) return;
    uploadImage.mutate(base64Capture);
  };

  return (
    <Modal
      size="lg"
      opened={display}
      onClose={finalAction}
      title="Capture Drawing"
      centered
      fullScreen={isMobile}
      closeOnEscape={!uploadImage.isPending}
      withCloseButton={!uploadImage.isPending}
      closeOnClickOutside={!uploadImage.isPending}
    >
      <Container>
        <Stack>
          {(!click || !base64Capture) && (
            <Webcam ref={webcamRef} videoConstraints={videoConstraints} />
          )}
          {click && base64Capture && (
            <Image src={base64Capture} alt="placeholder" />
          )}
          <Grid>
            {click && base64Capture && (
              <Grid.Col span={8}>
                <Button
                  onClick={handleSend}
                  disabled={uploadImage.isPending}
                  fullWidth
                >
                  {uploadImage.isPending ? (
                    <Loader color="gray" type="dots" size="md" />
                  ) : (
                    "Send"
                  )}
                </Button>
              </Grid.Col>
            )}
            {click && base64Capture && (
              <Grid.Col span={4}>
                <Button
                  onClick={handleRetake}
                  disabled={uploadImage.isPending}
                  fullWidth
                >
                  Retake
                </Button>
              </Grid.Col>
            )}
            {(!click || !base64Capture) && (
              <Grid.Col span={isMobile ? 8 : 12}>
                <Button onClick={handleCapture} fullWidth>
                  Capture
                </Button>
              </Grid.Col>
            )}
            {!click && isMobile && (
              <Grid.Col span={4}>
                <Button onClick={toggleWebcamDirection} fullWidth>
                  Flip
                </Button>
              </Grid.Col>
            )}
          </Grid>
          {uploadImage.isError && (
            <Text c="red">{uploadImage.error.message}</Text>
          )}
        </Stack>
      </Container>
    </Modal>
  );
};

export default DrawingUploadModal;
