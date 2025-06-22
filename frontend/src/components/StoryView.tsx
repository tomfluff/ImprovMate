import { Box, Group, Stack, Grid, Center, Loader, Text } from "@mantine/core";
import StoryPart from "./StoryPart";
import { useQuery } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import { startStory, useAdventureStore } from "../stores/adventureStore";
import { createCallContext } from "../utils/llmIntegration";
import { useState } from "react";

const StoryView = () => {
  const instance = getAxiosInstance();
  const { id, character, premise, story } = useAdventureStore();

  const [storyImprovGenerated, setStoryImprovGenerated] = useState(false);


  const { isError, isLoading } = useQuery({
    queryKey: ["story-init", id],
    queryFn: ({ signal }) => {
      return instance
        .post(
          "/story/init",
          createCallContext({
            ...character,
            ...premise,
          }),
          { signal }
        )
        .then((res) => {
          startStory({ start: Date.now(), ...res.data.data });
          return res.data.data;
        });
    },
    enabled: !!id && !!character && !!premise && !story,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  if (isLoading) {
    return (
      <Center>
        <Loader color="gray" size="xl" type="dots" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center>
        <Text c="red">Error loading story</Text>
      </Center>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <Box component={Group} align="center" justify="center" pb="xl">
      <Grid w="100%">
        <Grid.Col span={{ sm: 12, md: 8 }} offset={{ sm: 0, md: 2 }}>
          <Stack>
            {story &&
              story.parts.length > 0 &&
              story.parts.map((part, i) => (
                <StoryPart
                  key={i}
                  index={i}
                  isNew={i === story.parts.length - 1}
                  part={part}
                  storyImprovGenerated={storyImprovGenerated}
                  setStoryImprovGenerated={setStoryImprovGenerated}
                />
              ))}
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default StoryView;
