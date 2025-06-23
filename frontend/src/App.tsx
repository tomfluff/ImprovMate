import "./App.css";
import {
  ActionIcon,
  AppShell,
  Box,
  Button,
  Flex,
  FloatingIndicator,
  Group,
  ScrollArea,
  Tabs,
  Text,
  Tooltip,
  rem,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link } from "react-router-dom";
import { FaQuestionCircle, FaStar } from "react-icons/fa";
import StoryView from "./components/StoryView";
import { ColorSchemeToggle } from "./components/ColorSchemeToggle/ColorSchemeToggle";
import { resetSession, useSessionStore } from "./stores/sessionStore";
import { useAdventureStore, clearStore } from "./stores/adventureStore";
import { clearEndStore } from "./stores/practiceEndingsStore";
import { clear3ThingsStore } from "./stores/practice3ThingsStore";
import CharacterCard from "./components/CharacterCard";
import { useMemo, useState } from "react";
import PremiseCard from "./components/PremiseCard";
import PreferenceModal from "./components/PreferenceModal/PreferenceModal";
import { resetPreferences } from "./stores/preferencesStore";
import AboutModal from "./components/AboutModal/AboutModal";
import InstructionView from "./components/InstructionView";
import PracticeEndingsView from "./components/PracticeEndingsView";
import Practice3ThingsView from "./components/Practice3ThingsView";
import KeyPointsView from "./components/KeyPointsView";
import PracticeInstructionCard from "./components/PracticeInstructionCard";
import StoryInstructionCard from "./components/StoryInstructionCard";

function App() {
  const [opened, { toggle: toggleNavbar }] = useDisclosure(false);
  const sessionId = useSessionStore.use.id();
  const isSession = useMemo(() => sessionId !== null, [sessionId]);

  const reset = () => {
    clearStore();
    clearEndStore();
    clear3ThingsStore();
    setIsStartedEndings(false);
    setIsStarted3Things(false);
    resetSession();
    resetPreferences();
  };

  const image = useAdventureStore.use.image();
  const character = useAdventureStore.use.character();
  // const isCharacter = useMemo(
  //   () => image !== null && character !== null,
  //   [image, character]
  // );
  const isCharacter = useMemo(() => character !== null, [character]);

  const premise = useAdventureStore.use.premise();
  const isPremise = useMemo(() => premise !== null, [premise]);

  const [gameMode, setGameMode] = useState<string | null>(null);
  const [isStartedEndings, setIsStartedEndings] = useState<boolean>(false);
  const [isStarted3Things, setIsStarted3Things] = useState<boolean>(false);

  const [tabRootRef, setTabRootRef] = useState<HTMLDivElement | null>(null);
  const [tabValue, setTabValue] = useState<string | null>("1");
  const [tabControlsRefs, setTabControlsRefs] = useState<
    Record<string, HTMLButtonElement | null>
  >({});
  const setTabControlRef = (val: string) => (node: HTMLButtonElement) => {
    tabControlsRefs[val] = node;
    setTabControlsRefs(tabControlsRefs);
  };

  return (
    <AppShell
      header={{ height: 60 }}
      footer={{ height: 60 }}
      navbar={{
        width: 320,
        breakpoint: "xs",
        collapsed: { mobile: !opened, desktop: !opened },
      }}
      padding="sm"
    >
      <AppShell.Header p="md">
        <Flex justify="space-between" align="center" direction="row" h="100%">
          <Tooltip label={"Instructions and more"} position="right" withArrow>
            <Group>
              <ActionIcon variant="default" size="xl" onClick={toggleNavbar}>
                <FaQuestionCircle />
              </ActionIcon>
            </Group>
          </Tooltip>
          <Text size="md" fw={500} fs="italic" ff="heading">
            ImprovMate.
          </Text>
          <Group gap="sm">
            <Button disabled={!isSession} onClick={reset} color="orange">
              Reset
            </Button>
            <AboutModal />
            <PreferenceModal />
            <ColorSchemeToggle />
          </Group>
        </Flex>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section
          grow
          mt="xs"
          component={ScrollArea}
          type="scroll"
          scrollHideDelay={500}
        >
          {(isCharacter || isPremise) && (
            <Tabs variant="none" value={tabValue} onChange={setTabValue}>
              <Tabs.List
                ref={setTabRootRef}
                justify="center"
                style={{ position: "sticky" }}
              >
                <Tabs.Tab
                  value="1"
                  ref={setTabControlRef("1")}
                  size="compact-md"
                  style={() => ({
                    fontWeight: 500,
                    zIndex: 1,
                    color: tabValue === "1" ? "white" : undefined,
                  })}
                >
                  Help
                </Tabs.Tab>
                <Tabs.Tab
                  value="2"
                  ref={setTabControlRef("2")}
                  size="compact-md"
                  style={() => ({
                    fontWeight: 500,
                    zIndex: 1,
                    color: tabValue === "2" ? "white" : undefined,
                  })}
                >
                  Context
                </Tabs.Tab>
                <Tabs.Tab
                  value="3"
                  ref={setTabControlRef("3")}
                  size="compact-md"
                  style={() => ({
                    fontWeight: 500,
                    zIndex: 1,
                    color: tabValue === "3" ? "white" : undefined,
                  })}
                >
                  Keypoints
                </Tabs.Tab>

                <FloatingIndicator
                  target={tabValue ? tabControlsRefs[tabValue] : null}
                  parent={tabRootRef}
                  style={(theme) => ({
                    backgroundColor: theme.colors.violet[6],
                    borderRadius: theme.radius.md,
                    boxShadow: theme.shadows.md,
                  })}
                ></FloatingIndicator>
              </Tabs.List>

              <Tabs.Panel value="1">
                <StoryInstructionCard />
              </Tabs.Panel>
              <Tabs.Panel value="2">
                <Flex direction="column">
                  {isCharacter && (
                    <CharacterCard image={image!} character={character!} />
                  )}
                  {isPremise && <PremiseCard premise={premise!} />}
                </Flex>
              </Tabs.Panel>
              <Tabs.Panel value="3">
                <KeyPointsView />
              </Tabs.Panel>
            </Tabs>
          )}{" "}
          {isSession && gameMode === "practice" && isStartedEndings && (
            <PracticeInstructionCard gameMode={"endings"} />
          )}
          {isSession && gameMode === "practice" && isStarted3Things && (
            <PracticeInstructionCard gameMode={"threethings"} />
          )}
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main w={rem("99vw")}>
        {(!isSession || !isCharacter || !isPremise) &&
          !isStartedEndings &&
          !isStarted3Things && (
            <InstructionView
              setGameMode={setGameMode}
              setIsStartedEndings={setIsStartedEndings}
              setIsStarted3Things={setIsStarted3Things}
            />
          )}
        {isSession && isCharacter && isPremise && gameMode === "story" && (
          <StoryView />
        )}
        {isSession && gameMode === "practice" && isStartedEndings && (
          <PracticeEndingsView reset={reset} />
        )}
        {isSession && gameMode === "practice" && isStarted3Things && (
          <Practice3ThingsView />
        )}
      </AppShell.Main>
      <AppShell.Footer p="sm">
        <Flex w="100%" h="100%" justify="center" align="center" gap="sm">
          <Box>
            <Text component="span" fw={500} fs="italic" ff="heading">
              ImprovMate.
            </Text>{" "}
            is a project by{" "}
            <Button
              component={Link}
              to="https://github.com/drgrico"
              replace={false}
              radius="lg"
              size="compact-sm"
              variant="gradient"
              gradient={{ from: "violet", to: "grape", deg: 90 }}
              c="white"
              px="sm"
              leftSection={<FaStar />}
            >
              drgrico
            </Button>{" "}
            and{" "}
            <Button
              component={Link}
              to="https://github.com/tomfluff"
              replace={false}
              radius="lg"
              size="compact-sm"
              variant="gradient"
              gradient={{ from: "violet", to: "grape", deg: 90 }}
              c="white"
              px="sm"
              leftSection={<FaStar />}
            >
              tomfluff
            </Button>
          </Box>
        </Flex>
      </AppShell.Footer>
    </AppShell>
  );
}

export default App;
