import getAxiosInstance from "../utils/axiosInstance";
import { useMediaQuery } from "@mantine/hooks";
import { Accordion, Box, Button, Container, Grid, Modal, Center, Loader } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { FaPlus } from "react-icons/fa";
import { createCallContext } from "../utils/llmIntegration";
import { useEffect, useState } from "react";
import { usePreferencesStore } from "../stores/preferencesStore";

type Props = {
  display: boolean;
  ending: boolean;
  storyImprov: boolean;
  selectedHints: { [key: string]: string };
  setSelectedHints: (val: { [key: string]: string } | ((prev: { [key: string]: string }) => { [key: string]: string })) => void;
  setEndStory: (value: boolean) => void;
  finalAction: () => void;
};

const HintsModal = ({ display, ending: startingEnding, storyImprov, selectedHints = {}, setSelectedHints, setEndStory, finalAction }: Props) => {
  const instance = getAxiosInstance();
  const isMobile = useMediaQuery("(max-width: 50em)");
  const [hintList, setHintList] = useState<{ [key: string]: string }[]>([]);
  const [ending, setEnding] = useState<boolean>(startingEnding);
  const targetLanguage = usePreferencesStore.use.language();
  // console.log("Preference language:", targetLanguage);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["hints"],
    queryFn: ({ signal }) => {
      console.log("Getting hints...");
      if (ending) {
        return instance
          .post("/story/end_hints", { language: targetLanguage, context: createCallContext({}) }, { signal }) //TODO: Add in createCallContext
          .then((res) => {
            console.log("HintList: ", res.data.data.list);
            return res.data.data.list;
          }
          );
      }
      return instance
        .post("/story/hints", { language: targetLanguage, context: createCallContext({}) }, { signal }) //TODO: Add in createCallContext
        .then((res) => {
          console.log("HintList: ", res.data.data.list);
          return res.data.data.list;
        }
        );
    },
    enabled: display,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // NOTE: React-Query storage and cache will only persist until refresh so need to check existing storage
  });

  useEffect(() => {
    if (data) {
      setHintList(data);
    }
  }, [data]);

  useEffect(() => {
    if (hintList.length > 0) {
      console.log("Language changed, refetching hints...");
      refetch();
    }
  }, [targetLanguage]);

  const handleSelectHint = (category: string, hint: string) => {
    setSelectedHints((prev: { [key: string]: string }) => ({
      ...prev,
      [category]: hint,
    }));
    console.log("Selected hints: ", selectedHints);
  };

  const handleSelectEndHint = (category: string, hint: string) => {
    setSelectedHints({ [category]: hint });
    console.log("Selected EndHint: ", selectedHints);
  };

  const handleNewHints = () => {
    console.log("Deleting hints: ", selectedHints);
    setSelectedHints({});
    setHintList([]);
    refetch();
  };

  const toggleMode = () => {
    console.log("Changing mode...", selectedHints);
    console.log("Ending: ", ending);
    const newEnding = !ending;
    setEnding(newEnding);
    setEndStory(newEnding);
    console.log("Toggled ending: ", newEnding);
    setSelectedHints({});
    setHintList([]);
    refetch();
  }

  useEffect(() => {
    console.log("UseEffect for refetching hints...");
    setHintList([]);
    refetch(); //TODO: check if right logic
  }, [ending]);

  if (!display) return null;

  return ( //TODO: render next to the camera window
    <Modal
      size="lg"
      opened={display}
      onClose={finalAction}
      title="Hints for your improvisation"
      centered
      fullScreen={isMobile}
      closeOnEscape={!isLoading}
      withCloseButton={!isLoading}
      closeOnClickOutside={!isLoading}
    >
      <Container>
        {(isLoading || hintList.length === 0) && (
          <Center>
            <Loader color="gray" type="dots" size="lg" />
          </Center>
        )}
        {hintList && hintList.length > 0 && (
          <Accordion chevron={<FaPlus />}>
            {!ending && hintList.length > 0 && Object.keys(hintList[0]).map((category) => (
              <Accordion.Item key={category} value={category}>
                <Accordion.Control>
                  {category.charAt(0).toUpperCase() + category.slice(1)}?
                </Accordion.Control>
                <Accordion.Panel>
                  {hintList.map((hint: { [key: string]: string }, index: number) => (
                    <Box key={index} mb="sm">
                      <Grid align="center">
                        <Grid.Col span={10}>
                          <span>{index + 1} - {hint[category]}</span>
                        </Grid.Col>
                        <Grid.Col span={2}>
                          <Button
                            size="xs"
                            onClick={() => handleSelectHint(category, hint[category])}
                            disabled={selectedHints[category] !== undefined && hint[category] !== undefined && selectedHints[category] === hint[category]}>
                            {targetLanguage === "it" ? "Seleziona" : "Select"}
                          </Button>
                        </Grid.Col>
                      </Grid>
                    </Box>
                  ))}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
            {ending && hintList.length > 0 && Object.keys(hintList[0]).map((category) => (
              <Accordion.Item key={category} value={category}>
                <Accordion.Control>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Accordion.Control>
                <Accordion.Panel>
                  {hintList.map((hint: { [key: string]: string }, index: number) => (
                    <Box key={index} mb="sm">
                      <Grid align="center">
                        <Grid.Col span={10}>
                          <span>{index + 1} - {hint[category]}</span>
                        </Grid.Col>
                        <Grid.Col span={2}>
                          <Button
                            size="xs"
                            onClick={() => handleSelectEndHint(category, hint[category])}
                            disabled={Object.values(selectedHints).includes(hint[category])}>
                            {targetLanguage === "it" ? "Seleziona" : "Select"}
                          </Button>
                        </Grid.Col>
                      </Grid>
                    </Box>
                  ))}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        )}
        <Box style={{ display: "flex", justifyContent: "center" }} mt="md">
          <Button disabled={isLoading} onClick={finalAction} mr="md">
            {targetLanguage === "it" ? "Avanti" : "Done"}
          </Button>
          <Button disabled={isLoading} onClick={handleNewHints} mr="md">
            {targetLanguage === "it" ? "Altri Suggerimenti" : "New Hints"}
          </Button>
          {storyImprov && (
            <Button disabled={isLoading} onClick={toggleMode}>
              {targetLanguage === "it" ? (ending ? "Continua Storia" : "Termina Storia") : (ending ? "Continue Story" : "End Story")}
            </Button>
          )}
        </Box>
      </Container>
    </Modal>
  );
};

export default HintsModal;
