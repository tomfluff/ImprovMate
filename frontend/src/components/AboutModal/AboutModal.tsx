import {
  Stack,
  ActionIcon,
  Modal,
  Title,
  Text,
  Anchor,
  Divider,
  Box,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { FaInfo } from "react-icons/fa";

const AboutModal = () => {
  const [opened, { toggle: toggleOpened }] = useDisclosure(false);
  const isMobile = useMediaQuery("(max-width: 50em)");
  return (
    <>
      <ActionIcon
        variant="default"
        size="xl"
        aria-label="About ImprovMate."
        onClick={toggleOpened}
      >
        <FaInfo />
      </ActionIcon>
      <Modal
        size="md"
        opened={opened}
        fullScreen={isMobile}
        centered
        title="About This Project"
        onClose={toggleOpened}
      >
        <Stack gap="sm">
          <Title order={1} fs="italic">
            ImprovMate.
          </Title>
          <Text>
          ImprovMate is an AI-powered system designed to support 
          improvisation training by generating creative stimuli and tracking
          narrative, using motion and voice input combined for a more
          realistic experience.
          </Text>
          <Text>
            Use your improvisation skills to start a story and let the AI
            help you. Choose how the story unfolds at each stage and be the
            great storyteller you are.
          </Text>
          <Divider />
          <Box>
            <Text fz="md">Credits</Text>
            <Text fz="sm">
              Icons made by <i>Icon.doit</i>, <i>Smashicons</i> and{" "}
              <i>Freepik</i> from{" "}
              <Anchor href="https://www.flaticon.com/" target="_blank">
                flaticon
              </Anchor>
              .
            </Text>
          </Box>
        </Stack>
      </Modal>
    </>
  );
};

export default AboutModal;
