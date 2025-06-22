import { useEffect, useRef } from "react";
import {
  Image,
  Box,
  Flex,
  Paper,
  useMantineColorScheme,
  Avatar,
  Group,
  Stack,
  Loader,
  Skeleton,
  Center,
} from "@mantine/core";
import { useMediaQuery, useScrollIntoView } from "@mantine/hooks";
import ReadController from "./ReadController";
import { TAction, TStoryPart } from "../types/Story";
import ActionButton from "./ActionButton";
import getAxiosInstance from "../utils/axiosInstance";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  appendStory,
  chooseAction,
  getStoryText,
  printState,
  setFinished,
  updateActions,
  updateStoryImage,
  useAdventureStore,
} from "../stores/adventureStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import useTranslation from "../hooks/useTranslation";
import { createCallContext } from "../utils/llmIntegration";
import { useSessionStore } from "../stores/sessionStore";
import { useDisclosure } from "@mantine/hooks";
import ImprovPartUploadModal from "./ImprovPartUpload";

type Props = {
  index: number;
  part: TStoryPart;
  isNew: boolean;
  storyImprovGenerated: boolean;
  setStoryImprovGenerated: (generated: boolean) => void;
};

const StoryPart = ({
  index,
  part,
  isNew,
  storyImprovGenerated,
  setStoryImprovGenerated,
}: Props) => {
  const instance = getAxiosInstance();
  const { colorScheme } = useMantineColorScheme();
  const isSm = useMediaQuery("(max-width: 48em)");
  const { targetRef, scrollIntoView } = useScrollIntoView<HTMLDivElement>({
    duration: 500,
  });

  const user_avatar = useSessionStore.use.avatar();

  const { data: text, isLoading: textLoading } = useTranslation(part.text);

  const autoReadStorySections = usePreferencesStore.use.autoReadStorySections();
  const includeStoryImages = usePreferencesStore.use.includeStoryImages();

  const finished = useAdventureStore.use.finished();

  const { isLoading: actionLoading } = useQuery({
    queryKey: ["actions", part.id],
    queryFn: ({ signal }) => {
      const character = useAdventureStore.getState().character;
      return instance
        .post("/story/actions", createCallContext({ part, character }), {
          signal,
        })
        .then((res) => {
          updateActions(res.data.data.list);
          scrollIntoView();
          return res.data.data.list;
        });
    },
    enabled:
      !finished &&
      !part.improv &&
      (!part.actions || (!!part.actions && part.actions.length === 0)),
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const { isLoading: imageLoading } = useQuery({
    queryKey: ["story-image", part.id],
    queryFn: ({ signal }) => {
      return instance
        .post(
          "/story/image",
          {
            content: part.keymoment,
            style: useAdventureStore.getState().image?.style,
          },
          { signal }
        )
        .then((res) => {
          updateStoryImage(index, res.data.data.image_url);
          return res.data.data;
        });
    },
    enabled: !part.image && includeStoryImages,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const outcome = useMutation({
    mutationKey: ["story-part"],
    mutationFn: (context: {
      story: string;
      premise?: string;
      action?: TAction;
    }) => {
      console.log("StoryPart - Generating new story part: ", context);
      scrollIntoView();
      return instance
        .post("/story/part", createCallContext({ ...context }))
        .then((res) => res.data.data);
    },
    onSuccess: (data) => {
      appendStory(data, false);
    },
  });

  const ending = useMutation({
    mutationKey: ["story-end"],
    mutationFn: (context: { story: string }) => {
      return instance
        .post("/story/end", createCallContext(context))
        .then((res) => res.data.data);
    },
    onSuccess: (data) => {
      appendStory(data, false);
      setFinished();
    },
  });

  const handleActionClick = (action: TAction) => {
    console.log("Action clicked: ", action);
    if (!action.active) return;
    chooseAction(action);
    const story = getStoryText()?.join(" ");
    if (!story) return;
    if (action.title.toLowerCase() === "ending") {
      ending.mutate({
        story: story,
      });
    } else {
      outcome.mutate({
        premise: useAdventureStore.getState().premise?.desc,
        action: action,
        story: story,
      });
    }
    printState();
  };

  useEffect(() => {
    if (isNew) {
      scrollIntoView();
    }
  }, [isNew, text]);

  const [captureModal, { open: openCapture, close: closeCapture }] =
    useDisclosure();

  const handleMotionClick = (action: TAction) => {
    if (!action.active) return;
    // chooseAction(action);
    openCapture();
    printState();
  };

  const hasRunRef = useRef(false); //TODO: remove?

  useEffect(() => {
    if (isNew && storyImprovGenerated && !hasRunRef.current) {
      hasRunRef.current = true;
      console.log("storyImprovGenerated is set to:", storyImprovGenerated);
      setStoryImprovGenerated(false);
      const story = getStoryText()?.join(" ");
      if (!story) return;
      setTimeout(() => {
        console.log("Generating new story part triggered...");
        outcome.mutate({
          premise: useAdventureStore.getState().premise?.desc,
          story: story,
        });
      }, 1000); // 10-second delay (to give time to generate previous image) TODO: decrease?
    }
  }, [storyImprovGenerated]);

  const finalActionImprov = () => {
    closeCapture();
    console.log("storyImprovGenerated: ", storyImprovGenerated);
  };

  return (
    <>
      <Stack gap="sm">
        {((part.actions && part.actions.length > 0) || finished) && (
          <Flex direction={isSm ? "column" : "row"} gap="sm">
            <Group gap="sm" align="start" justify={"flex-start"}>
              <Flex direction="column" gap="sm">
                <Avatar
                  src={
                    part.sentiment
                      ? `avatar/bot/bot${part.sentiment}.png`
                      : "avatar/bot/botneutral.png"
                  }
                  radius="sm"
                />
              </Flex>
            </Group>
            {includeStoryImages && (
              <Group gap="sm" align="start" justify="center">
                {part.image ? (
                  <Image
                    src={part.image}
                    alt={part.keymoment}
                    radius="md"
                    w={240}
                    h={240}
                  />
                ) : (
                  imageLoading && <Skeleton radius="md" w={240} h={240} />
                )}
              </Group>
            )}
            <Box maw={{ sm: "100%", md: "50%" }}>
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
        )}
        {!part.actions ||
          (part.actions.length == 0 && (
            <Flex direction={isSm ? "column" : "row"} gap="sm">
              <Box maw={{ sm: "100%", md: "50%" }}>
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
              {includeStoryImages && (
                <Group gap="sm" align="start" justify="center">
                  {part.image ? (
                    <Image
                      src={part.image}
                      alt={part.keymoment}
                      radius="md"
                      w={240}
                      h={240}
                    />
                  ) : (
                    imageLoading && <Skeleton radius="md" w={240} h={240} />
                  )}
                </Group>
              )}
              <Group gap="sm" align="start" justify={"flex-start"}>
                <Avatar src={`avatar/user/${user_avatar}`} radius="sm" />
              </Group>
            </Flex>
          ))}
        <Flex
          ref={targetRef}
          direction={isSm ? "column" : "row-reverse"}
          justify="flex-start"
          align="flex-end"
          gap="sm"
        >
          {part.actions && part.actions.length > 0 && (
            <Avatar src={`avatar/user/${user_avatar}`} radius="sm" />
          )}
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
          {part.actions &&
            part.actions?.map((action: TAction, i: number) => {
              if (action.isImprov) {
                return (
                  <ActionButton
                    key={i}
                    action={action}
                    isEnd={i === part.actions!.length - 1}
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
          {(actionLoading || outcome.isPending || ending.isPending) && (
            <Center>
              <Loader color="gray" size="md" />
            </Center>
          )}
        </Flex>
      </Stack>
      <ImprovPartUploadModal
        display={captureModal}
        finalAction={finalActionImprov}
        setGenerated={setStoryImprovGenerated}
      />
    </>
  );
};

export default StoryPart;
