import { Box, Group, Stack, Grid, Center, Loader, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import { appendStory, startStory, usePracticeEndingsStore } from "../stores/practiceEndingsStore";
import PracticeEndPart from "./PracticeEndPart";
import { useEffect, useState } from "react";

type Props = {
  reset: () => void;
};

const PracticeEndingsView = ({ reset }: Props) => {
  const instance = getAxiosInstance();
  const { id, story } = usePracticeEndingsStore();
  const [next, setNext] = useState<boolean>(false);

  const { isError, isLoading, refetch } = useQuery({
    queryKey: ["practice-ending-init", id],
    queryFn: ({ signal }) => {
      return instance
        .post(
          "/practice/generate_storytoend",
          { signal }
        )
        .then((res) => {
          console.log("PracticeEndingsView - res.data.data:", res.data.data);
          if (!next) {
            startStory({ start: Date.now(), ...res.data.data });
          }
          else {
            appendStory(res.data.data.parts[0], true);
          }
          setNext(false);
          return res.data.data;
        });
    },
    enabled: !story || next,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (next) {
      refetch();
    }
  }, [next, refetch]);

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
    console.log("No story in PracticeEndingsView.");
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
                <PracticeEndPart
                  key={i}
                  isNew={i === story.parts.length - 1}
                  part={part}
                  setNext={setNext}
                  reset={reset}
                />
              ))}
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default PracticeEndingsView;
