import { Card, Spoiler, Text, Image, rem, Loader, Skeleton } from "@mantine/core";
import { TCharacter } from "../types/Character";
import { TImage } from "../types/Image";
import ReadController from "./ReadController";
import useTranslation from "../hooks/useTranslation";
import { setCharacterImage } from '../stores/adventureStore';
import { useQuery } from "@tanstack/react-query";
import getAxiosInstance from '../utils/axiosInstance';
import { usePreferencesStore } from "../stores/preferencesStore";

type Props = {
  image: TImage;
  character: TCharacter;
};

const CharacterCard = ({ image, character }: Props) => {
  const { data: fullname, isLoading: fullnameLoading } = useTranslation(
    character.fullname
  );
  const { data: backstory, isLoading: backstoryLoading } = useTranslation(
    character.backstory
  );
  const language = usePreferencesStore.use.language();

  const instance = getAxiosInstance();
  const { isLoading: imageLoading } = useQuery({
    queryKey: ["character-image", character],
    queryFn: ({ signal }) => {
      return instance
        .post(
          "/story/character_image",
          {
            character: character,
          },
          { signal }
        )
        .then((res) => {
          console.log("Character Image - res:", res);
          const img = { src: res.data.data.image_url, style: "Realistic" }; //TODO: style needed to generate next story images, change style?
          setCharacterImage(img);
          image = img;
          console.log("Image:", image);
          return res.data.data;
        });
    },
    enabled: !image && !!character,
    staleTime: Infinity,
    refetchOnMount: false,
  });

  return (
    <Card shadow="sm" my={8} padding="sm" radius="md" withBorder>
      <Card.Section mb="sm">
        {image ? (<Image src={image.src} alt={image.content} height={rem(128)} />)
          : (imageLoading && <Skeleton height={rem(128)} />)}
      </Card.Section>
      {fullname && (
        <Text size="lg" fw={500}>
          {fullname}
        </Text>
      )}
      {backstory && (
        <Spoiler maxHeight={100} showLabel={language === "it" ? "Mostra di più" : "Show more"} hideLabel={language === "it" ? "Nascondi" : "Hide"}>
          {backstory}
        </Spoiler>
      )}
      {(fullnameLoading || backstoryLoading) && (
        <Loader color="gray" type="dots" size="lg" />
      )}
      <Card.Section p="xs">
        <ReadController text={backstory} />
      </Card.Section>
    </Card>
  );
};

export default CharacterCard;
