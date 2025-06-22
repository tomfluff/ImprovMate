import { ActionIcon, Popover } from "@mantine/core";
import { FaCog } from "react-icons/fa";
import PreferencePane from "../PreferencePane";

const PreferencePopover = () => {
  return (
    <Popover withArrow trapFocus withinPortal position="bottom-end">
      <Popover.Target>
        <ActionIcon variant="default" size="xl" aria-label="Open preference">
          <FaCog />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <PreferencePane />
      </Popover.Dropdown>
    </Popover>
  );
};

export default PreferencePopover;
