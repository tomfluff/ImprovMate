import { ActionIcon, Modal } from "@mantine/core";
import PreferencePane from "../PreferencePane";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { FaCog } from "react-icons/fa";

const PreferenceModal = () => {
  const [opened, { toggle: toggleOpened }] = useDisclosure(false);
  const isMobile = useMediaQuery("(max-width: 50em)");

  return (
    <>
      <ActionIcon
        variant="default"
        size="xl"
        aria-label="Open preference"
        onClick={toggleOpened}
      >
        <FaCog />
      </ActionIcon>
      <Modal
        size="content"
        opened={opened}
        fullScreen={isMobile}
        centered
        title="Application Preferences"
        onClose={toggleOpened}
      >
        <PreferencePane />
      </Modal>
    </>
  );
};

export default PreferenceModal;
