import getAxiosInstance from "../utils/axiosInstance";
import { usePreferencesStore } from "../stores/preferencesStore";
import { useQuery } from "@tanstack/react-query";

const useTranslation = (content: string) => {
  const instance = getAxiosInstance();
  const sourceLanguage = "en";
  const targetLanguage = usePreferencesStore.use.language();

  const { data, isError, isLoading } = useQuery({
    queryKey: ["translate", content, sourceLanguage, targetLanguage],
    queryFn: ({ signal }) => {
      if (sourceLanguage === targetLanguage) return content;
      return instance
        .get("/translate", {
          params: {
            text: content,
            src_lang: sourceLanguage,
            tgt_lang: targetLanguage,
          },
          signal,
        })
        .then((res) => {
          return res.data.data.text;
        });
    },
    enabled: !!content,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  return { data, isError, isLoading };
};

export default useTranslation;
