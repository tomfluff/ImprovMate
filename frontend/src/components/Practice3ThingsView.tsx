import {
  Box,
  Group,
  Stack,
  Grid,
  Center,
  Loader,
  Text,
  RingProgress,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import getAxiosInstance from "../utils/axiosInstance";
import {
  appendStory,
  startStory,
  usePractice3ThingsStore,
} from "../stores/practice3ThingsStore";
import Practice3ThingsPart from "./Practice3ThingsPart";
import { useEffect, useState, useRef } from "react";

// type Props = {
// reset: () => void;
// };

const Practice3ThingsView = () => {
  const instance = getAxiosInstance();
  const { id, story } = usePractice3ThingsStore();
  const [next, setNext] = useState<boolean>(false);
  const [questions, setQuestions] = useState<any[]>([]); //array of questions
  const [cntQ, setCntQ] = useState<number>(0);
  const maxQ = 20;
  const [timeLeft, setTimeLeft] = useState<number>(15);

  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const { isError, isLoading, refetch } = useQuery({
    queryKey: ["practice-3things-init", id],
    queryFn: ({ signal }) => {
      return instance
        .post("/practice/generate_questions", { maxQ: maxQ }, { signal })
        .then((res) => {
          console.log("Practice3ThingsView - res:", res);
          //generate like 20 questions, start with 1st
          setQuestions(res.data.data.parts);
          if (cntQ == 0) {
            startStory({
              start: Date.now(),
              id: res.data.data.id,
              parts: [res.data.data.parts[cntQ]],
            });
          } else {
            appendStory(res.data.data.parts[0]);
          }
          setCntQ(1);
          return res.data.data;
        });
    },
    enabled: !story,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!isLoading && story && story.parts.length > 0) {
      setTimeLeft(30);

      timerRef.current = setTimeout(() => {
        setNext(true);
      }, 30000);

      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [story?.parts.length, isLoading]);

  useEffect(() => {
    if (next) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (cntQ === maxQ) {
        console.log("Refetching...");
        refetch();
      } else {
        appendStory(questions[cntQ]);
        setCntQ(cntQ + 1);
        console.log("CntQ:", cntQ);
      }
      setNext(false);
    }
  }, [next, refetch, cntQ, maxQ, questions]);

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
        <Text c="red">Error loading questions</Text>
      </Center>
    );
  }

  if (!story) {
    console.log("No questions in Practice3ThingsView.");
    return null;
  }

  return (
    <Box component={Group} align="center" justify="center" pb="xl">
      <Grid w="100%">
        <Grid.Col span={{ sm: 12, md: 8 }} offset={{ sm: 0, md: 2 }}>
          <Stack>
            {story.parts.map((part, i) => (
              <Box key={i} style={{ position: "relative", marginBottom: 8 }}>
                <Practice3ThingsPart
                  isNew={i === story.parts.length - 1}
                  part={part}
                  setNext={setNext}
                />
                {i === story.parts.length - 1 && (
                  <Box
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Box style={{ position: "relative" }}>
                      <RingProgress
                        roundCaps
                        size={60}
                        thickness={6}
                        sections={[
                          { value: (timeLeft / 15) * 100, color: "violet" },
                        ]}
                      />
                      <Text
                        size="xs"
                        style={{
                          textAlign: "center",
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          fontWeight: "bold",
                        }}
                      >
                        {timeLeft}s
                      </Text>
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
};

export default Practice3ThingsView;
