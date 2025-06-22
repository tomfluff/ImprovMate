import {
  Box,
  Flex,
  Paper,
  useMantineColorScheme,
  Avatar,
  Group,
  Stack,
  Loader,
  TextInput,
} from "@mantine/core";
import { useMediaQuery, useScrollIntoView } from "@mantine/hooks";
import ReadController from "./ReadController";
import { TStoryPart } from "../types/Story";
import { usePractice3ThingsStore } from "../stores/practice3ThingsStore";
import { usePreferencesStore } from "../stores/preferencesStore";
import useTranslation from "../hooks/useTranslation";
import { useSessionStore } from "../stores/sessionStore";
import { useEffect, useState } from "react";

type Props = {
  part: TStoryPart;
  isNew: boolean;
  setNext: React.Dispatch<React.SetStateAction<boolean>>;
};

const Practice3ThingsPart = ({ part, isNew, setNext }: Props) => {
  const { colorScheme } = useMantineColorScheme();
  const isSm = useMediaQuery("(max-width: 48em)");
  const { targetRef, scrollIntoView } = useScrollIntoView<HTMLDivElement>({
    duration: 500,
  });

  const user_avatar = useSessionStore.use.avatar();
  const { data: text, isLoading: textLoading } = useTranslation(part.text);
  const autoReadStorySections = usePreferencesStore.use.autoReadStorySections();

  const finished = usePractice3ThingsStore.use.finished();
  const language = usePreferencesStore.use.language();

  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const validateInput = () => {
    const parts = value.split(',').map(part => part.trim());
    if (parts.length !== 3 || parts.some(part => part === '')) {
      setError(language === "it" ? "Per favore inserisci 3 elementi separati da virgole" : 'Please enter 3 items separated by commas');
      return false;
    }
    else {
      setError('');
      return true;
    }
  }

  const handleBlur = () => {
    validateInput();
  };

  const handleKeyDown = (event: { key: string; }) => {
    if (event.key === 'Enter') {
      if (validateInput()) {
        // setValue('');
        setNext(true);
      }
    }
  };

  useEffect(() => {
    if (isNew) {
      scrollIntoView();
    }
  }, [isNew, text]);

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
              {language === "en" ? "The story has ended!" : "La storia è finita!"}
            </Paper>
          )}
          <Flex direction="row" gap="md" style={{ marginTop: 8 }}>
            <TextInput
              placeholder={language === "it" ? "Un gatto, un cane, un topo" : "A cat, a dog, a mouse"}
              value={value}
              onChange={(event) => setValue(event.currentTarget.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              error={error}
              style={{ width: '100%' }}
              disabled={!isNew} />
          </Flex>
        </Flex>
      </Stack>
    </>
  );
};

export default Practice3ThingsPart;
