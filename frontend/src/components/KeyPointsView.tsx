import getAxiosInstance from "../utils/axiosInstance";
import { usePreferencesStore } from "../stores/preferencesStore";
import { useQuery } from "@tanstack/react-query";
import { Table, Loader, Center, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { getKeyPointsTable, useKeyPointsState, checkFormat } from "../stores/adventureStore";


const KeyPointsView = () => {
  const instance = getAxiosInstance();
  const sourceLanguage = "en";
  const targetLanguage = usePreferencesStore.use.language();

  const [keyPoints, setKeyPoints] = useState(getKeyPointsTable());

  const [toTranslate, setToTranslate] = useState<boolean>(false);

  useEffect(() => {
    setToTranslate(false);
    const unsubscribe = useKeyPointsState.subscribe(() => {
      setKeyPoints(getKeyPointsTable());
      setToTranslate(true);
      // console.log("useTableTranslation - toTranslate:", toTranslate);
    });
    return () => unsubscribe();
  }, []);

  const { data, isError, isLoading, error } = useQuery({
    queryKey: ["translate", keyPoints, sourceLanguage, targetLanguage],
    queryFn: ({ signal }) => {
      if (sourceLanguage === targetLanguage) return keyPoints;
      setToTranslate(false);

      return instance
        .get("/translate_keypoints", { //TODO: ASK for JSON format? -> avoid formatting errors
          params: {
            keypoints: JSON.stringify(keyPoints),
            src_lang: sourceLanguage,
            tgt_lang: targetLanguage,
          },
          signal,
        })
        .then((res) => {
          const text = res.data.data.text;
          let translatedKeyPoints: { head: string[]; body: (string | string[])[][] };
          if (text && text.body && Array.isArray(text.head)) {
            translatedKeyPoints = { body: text.body, head: text.head as string[] };
          } else if (text && text.corpo && Array.isArray(text.testa)) {
            translatedKeyPoints = { body: text.corpo, head: text.testa as string[] };
          }
          else {
            throw new Error("Invalid translation response format");
          }
          console.log("useTableTranslation - translatedKeyPoints:", translatedKeyPoints);
          return checkFormat(translatedKeyPoints);
        });
    },
    enabled: !!keyPoints && keyPoints.body && keyPoints.body.length > 0 && toTranslate, //CONDITION HERE??
    staleTime: Infinity,
    refetchOnMount: false, //REFETCH HERE??
  });

  if (isLoading) {
    return (
      <Center>
        <Loader color="gray" size="xl" type="dots" />
      </Center>
    );
  }

  if (isError) {
    console.error("Error loading keypoints:", error);
    return (
      <Center>
        <Text c="red">Error loading keypoints</Text>
      </Center>
    );
  }

  return (
    <>
      <Table data={data} />
    </>
  );
};

export default KeyPointsView;