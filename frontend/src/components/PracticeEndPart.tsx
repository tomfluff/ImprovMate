import { useEffect } from "react";
import {
  Box,
  Flex,
  Paper,
  useMantineColorScheme,
  Avatar,
  Group,
  Stack,
  Loader,
} from "@mantine/core";
import { useMediaQuery, useScrollIntoView } from "@mantine/hooks";
import ReadController from "./ReadController";
import { TAction, TStoryPart } from "../types/Story";
import ActionButton from "./ActionButton";
import getAxiosInstance from "../utils/axiosInstance";
import { useMutation } from "@tanstack/react-query";
import {
  appendStory,
  chooseAction,
  getLastStoryText,
  printState,
  tryAgain,
  usePracticeEndingsStore,
} from "../stores/practiceEndingsStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import useTranslation from "../hooks/useTranslation";
import { useSessionStore } from "../stores/sessionStore";
import { useDisclosure } from "@mantine/hooks";
import PracticeEndImprovModal from "./PracticeEndImprovModal";

type Props = {
  part: TStoryPart;
  isNew: boolean;
  setNext: React.Dispatch<React.SetStateAction<boolean>>;
  reset: () => void;
};

const PracticeEndPart = ({ part, isNew, setNext, reset }: Props) => {
  const instance = getAxiosInstance();
  const { colorScheme } = useMantineColorScheme();
  const isSm = useMediaQuery("(max-width: 48em)");
  const { targetRef, scrollIntoView } = useScrollIntoView<HTMLDivElement>({
    duration: 500,
  });

  const user_avatar = useSessionStore.use.avatar();
  const { data: text, isLoading: textLoading } = useTranslation(part.text);
  const autoReadStorySections = usePreferencesStore.use.autoReadStorySections();

  const finished = usePracticeEndingsStore.use.finished();

  const outcome = useMutation({
    mutationKey: ["story-part"],
    mutationFn: () => {
      scrollIntoView();
      return instance
        .post("/practice/generate_storytoend")
        .then((res) => res.data.data);
    },
    onSuccess: (data) => {
      console.log("Ending generated: ", data);
      appendStory(data, true); //TODO: remove story id
    },
  });

  useEffect(() => {
    if (isNew) {
      scrollIntoView();
    }
  }, [isNew, text]);

  const [captureModal, { open: openCapture, close: closeCapture }] =
    useDisclosure();

  const handleMotionClick = (action: TAction) => {
    if (!action.active) return;
    openCapture();
    printState();
  };

  const handleActionClick = (action: TAction) => {
    console.log("Action clicked: ", action);
    if (!action.active) return;
    chooseAction(action);
    const story = getLastStoryText();
    if (!story) return;
    if (action.title.toLowerCase() === "finish") {
      //TODO: = reset?
      //   ending.mutate({
      //     story: story,
      //   });
      reset();
    } else if (action.title.toLowerCase() === "next") {
      setNext(true);
    } else {
      //try again
      console.log("Try again...");
      tryAgain();
      console.log("Try again: ", getLastStoryText());
    }
    printState();
  };

  return (
    <>
      <Stack gap="sm">
        <Flex direction={isSm ? "column" : "row"} gap="sm">
          <Group gap="sm" align="start" justify={"flex-start"}>
            <Avatar
              src={
                part.sentiment
                  ? `avatar/bot/bot${part.sentiment}.png`
                  : "avatar/bot/botneutral.png"
              }
              radius="sm"
            />
          </Group>
          <Box maw={{ sm: "100%", md: "100%" }}>
            <Stack gap="xs">
              <Paper
                radius="md"
                p="sm"
                bg={colorScheme === "dark" ? "violet.8" : "violet.4"}
                c={"white"}
              >
                {textLoading && (
                  <Loader color="white" size="sm" type="dots" p={0} m={0} />
                )}
                {text && text}
              </Paper>
              <ReadController
                id={part.id}
                text={text}
                autoPlay={isNew && autoReadStorySections}
              />
            </Stack>
          </Box>
        </Flex>
        <Flex
          ref={targetRef}
          direction={isSm ? "column" : "row-reverse"}
          justify="flex-start"
          align="flex-end"
          gap="sm"
        >
          <Avatar src={`avatar/user/${user_avatar}`} radius="sm" />
          {finished && isNew && (
            <Paper
              radius="md"
              p="sm"
              bg={colorScheme === "dark" ? "violet.8" : "violet.4"}
              c={"white"}
            >
              The story has ended!
            </Paper>
          )}
          {part.actions?.map((action: TAction, i: number) => {
            if (action.isImprov) {
              return (
                <ActionButton
                  key={i}
                  action={action}
                  isEnd={i === part.actions!.length - 1 && !action.isImprov}
                  handleClick={() => handleMotionClick(action)}
                />
              );
            } else {
              return (
                <ActionButton
                  key={i}
                  action={action}
                  isEnd={i === part.actions!.length - 1}
                  handleClick={() => handleActionClick(action)}
                />
              );
            }
          })}
          {outcome.isPending && <Loader color="gray" size="md" />}
        </Flex>
      </Stack>
      <PracticeEndImprovModal
        display={captureModal}
        finalAction={closeCapture}
      />
    </>
  );
};

export default PracticeEndPart;
