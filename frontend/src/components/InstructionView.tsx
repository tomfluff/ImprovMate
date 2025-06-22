import {
  Center,
  Paper,
  Stack,
  Title,
  Divider,
  rem,
  Text,
  Button,
  Box,
  Grid,
  Select,
  Flex,
} from "@mantine/core";
import { useAdventureStore } from "../stores/adventureStore";
import {
  initSession,
  instructionsLang,
  useSessionStore,
} from "../stores/sessionStore";
import getAxiosInstance from "../utils/axiosInstance";
import { useMutation } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import DrawingUploadModal from "./DrawingUploadModal";
import PremiseSelectModal from "./PremiseSelectModal";
import { useState } from "react";
import StartImprovUploadModal from "./StartImprovUploadModal";

type InstructionViewProps = {
  setGameMode: (mode: string) => void;
  setIsStartedEndings: (mode: boolean) => void;
  setIsStarted3Things: (mode: boolean) => void;
};

const InstructionView = ({
  setGameMode,
  setIsStartedEndings,
  setIsStarted3Things,
}: InstructionViewProps) => {
  const instance = getAxiosInstance();
  const session = useSessionStore.use.id();
  const character = useAdventureStore.use.character();
  const premise = useAdventureStore.use.premise();

  const [captureModal, { open: openCapture, close: closeCapture }] =
    useDisclosure();
  const [premiseModal, { open: openPremise, close: closePremise }] =
    useDisclosure();
  const [improvModal, { open: openImprov, close: closeImprov }] =
    useDisclosure();

  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const instructions = instructionsLang["en"];

  const newSession = useMutation({
    mutationKey: ["session"],
    mutationFn: () => {
      return instance.get("/session").then((res) => res.data);
    },
    onSuccess: (data) => {
      initSession(data.data.id);
    },
  });

  const handleGameModeChange = (value: string | null) => {
    if (value !== null) {
      setGameMode(value);
      setSelectedMode(value);

      // Perform any action based on the selected value
      console.log("Selected game mode:", value);
    }
  };

  const handleStartEndings = () => {
    setIsStartedEndings(true);
    console.log("Started endings:", true);
  };

  return (
    <>
      <Center>
        <Stack align="center" mb={rem(20)}>
          <Paper withBorder p="xl" radius="lg" mt={rem(20)}>
            <Stack align="center" mb={rem(20)}>
              <Title order={3} fs="italic">
                {instructions[0]}
              </Title>
              <Divider size="sm" w={rem(128)} />
            </Stack>
            <Stack align="start" gap="sm">
              <Box opacity={!session ? 1 : 0.5}>
                <Text>
                  {instructions[1]}{" "}
                  <Button
                    m="xs"
                    size="compact-md"
                    onClick={() => newSession.mutate()}
                    disabled={session != null}
                  >
                    {instructions[2]}
                  </Button>{" "}
                  {instructions[3]}
                </Text>
              </Box>

              <Box opacity={session != null && !character ? 1 : 0.5}>
                <Flex align="center">
                  <Text mr="xs">{instructions[4]}</Text>
                  <Select
                    m="xs"
                    placeholder="Game Mode"
                    data={[
                      { value: "story", label: "Story" },
                      { value: "practice", label: "Practice" },
                    ]}
                    disabled={session == null || character != null}
                    value={selectedMode}
                    onChange={handleGameModeChange}
                  />
                  <Text>.</Text>
                </Flex>
              </Box>
            </Stack>
          </Paper>{" "}
          {(selectedMode == "story" || selectedMode == "storia") && (
            // <Grid>
            //   <Grid.Col span={6}>
            //     <Box opacity={session!=null ? 1 : 0.5}>
            //     <Paper withBorder p="xl" radius="lg" mt={rem(20)}>
            //       <Stack align="center" mb={rem(20)}>
            //         <Title order={3} fs="italic">
            //           {instructions[5]}
            //         </Title>
            //         <Divider size="sm" w={rem(128)} />
            //       </Stack>
            //       <Stack>
            //         <Box opacity={session != null && !character ? 1 : 0.5}>
            //           <Text>
            //            {instructions[6]}{" "}
            //             <Button
            //               m="xs"
            //               size="compact-md"
            //               onClick={openCapture} //TODO: change from character to context (+character)
            //               disabled={session == null || character != null}
            //             >
            //               {instructions[7]}
            //             </Button>{" "}
            //             {instructions[8]}
            //           </Text>
            //         </Box>
            //         <Box
            //           opacity={session != null && character != null && !premise ? 1 : 0.5}>
            //           <Text>
            //             {instructions[9]}{" "}
            //               <Button
            //                 m="xs"
            //                 size="compact-md"
            //                 onClick={openPremise}
            //                 disabled={character == null || premise != null}
            //               >
            //                 {instructions[10]}
            //               </Button>{" "}
            //             {instructions[11]}
            //           </Text>
            //         </Box>
            //       </Stack>
            //     </Paper>
            //     </Box>
            //   </Grid.Col>
            //   <Grid.Col span={6}>
            <Box opacity={session != null ? 1 : 0.5}>
              <Paper withBorder p="xl" radius="lg" mt={rem(20)}>
                <Stack align="center" mb={rem(20)}>
                  <Title order={3} fs="italic">
                    {instructions[12]}
                  </Title>
                  <Divider size="sm" w={rem(128)} />
                </Stack>
                <Stack>
                  <Box>
                    <Text>{instructions[13]}</Text>
                  </Box>

                  <Box>
                    <Text>
                      {instructions[14]}{" "}
                      <Button
                        m="xs"
                        size="compact-md"
                        onClick={openImprov}
                        disabled={
                          character != null ||
                          premise != null ||
                          session == null
                        }
                      >
                        {instructions[15]}
                      </Button>{" "}
                      {instructions[16]}
                    </Text>
                  </Box>
                </Stack>
              </Paper>
            </Box>
            //   </Grid.Col>
            // </Grid>
          )}
          {selectedMode == "practice" && (
            <Grid>
              <Grid.Col span={6}>
                <Box opacity={session != null ? 1 : 0.5}>
                  <Paper withBorder p="xl" radius="lg" mt={rem(20)}>
                    <Stack align="center" mb={rem(20)}>
                      <Title order={3} fs="italic">
                        {instructions[17]}
                      </Title>
                      <Divider size="sm" w={rem(128)} />
                    </Stack>
                    <Stack>
                      <Box>
                        <Text mb={rem(20)}>{instructions[18]}</Text>
                        <Text mb={rem(20)}>{instructions[19]}</Text>
                        <Box style={{ textAlign: "center" }}>
                          <Button
                            m="xs"
                            size="compact-md"
                            onClick={() => setIsStarted3Things(true)} //TODO: change
                            //TODO: add disabled?
                          >
                            {instructions[20]}
                          </Button>{" "}
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box opacity={session != null ? 1 : 0.5}>
                  <Paper withBorder p="xl" radius="lg" mt={rem(20)}>
                    <Stack align="center" mb={rem(20)}>
                      <Title order={3} fs="italic">
                        {instructions[21]}
                      </Title>
                      <Divider size="sm" w={rem(128)} />
                    </Stack>
                    <Stack>
                      <Box>
                        <Text mb={rem(20)}>{instructions[22]}</Text>
                        <Text mb={rem(20)}>{instructions[23]}</Text>
                        <Box style={{ textAlign: "center" }}>
                          <Button
                            m="xs"
                            size="compact-md"
                            onClick={handleStartEndings} //TODO: change
                            //TODO: add disabled?
                          >
                            {instructions[24]}
                          </Button>{" "}
                        </Box>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>
              </Grid.Col>
            </Grid>
          )}
        </Stack>
      </Center>
      <DrawingUploadModal display={captureModal} finalAction={closeCapture} />
      <PremiseSelectModal
        character={character}
        display={premiseModal}
        finalAction={closePremise}
      />
      <StartImprovUploadModal display={improvModal} finalAction={closeImprov} />
    </>
  );
};

export default InstructionView;
