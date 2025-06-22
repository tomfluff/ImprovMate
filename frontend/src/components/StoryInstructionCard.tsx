import { Card, Text } from "@mantine/core";
import ReadController from "./ReadController";
import { usePreferencesStore } from "../stores/preferencesStore";

const StoryInstructionCard = () => {
  const intro = {
    en: "HOW TO PLAY",
    it: "COME GIOCARE",
  }
  const instr = {
    en: "In the 'Context' tab you can read the character description and the premise of the story.\nIn the 'Keypoints' tab the key points of each part of the story are listed.\nYou can advance the story using your improvisational skills. You can get help through the 'Hints' function to continue or finish the story.\nThe story continues thanks to your improvisation and then a new part is generated with new actions to take.\nAlternatively, you can use one of the two options proposed.\nRead the new developments and decide how to continue!\nHave fun!",
    it: "Nella scheda 'Contesto' puoi leggere la descrizione del personaggio e la premessa della storia.\nNella scheda 'Punti Chiave' vengono elencati i punti fondamentali di ogni parte di storia.\nPuoi portare avanti la storia usando le tue capacità di improvvisazione. Puoi ricevere dei suggerimenti tramite la funzione 'Suggerimenti' per continuare o terminare la storia.\nLa storia continua grazie alla tua improvvisazione e successivamente viene generata una nuova parte con nuove azioni da intraprendere.\nIn alternativa, puoi usare una delle due opzioni proposte.\nLeggi i nuovi sviluppi e decidi come continuare!\nBuon divertimento!",
  }

  const language = usePreferencesStore.use.language();
  const shorttext = intro[language === 'it' ? 'it' : 'en'];
  const longtext = instr[language === 'it' ? 'it' : 'en'];

  return (
    <Card shadow="md" my={8} padding="sm" radius="md">
      <Card.Section mb="sm">
        <Text size="md" fw={500} p="xs" bg="violet" c="white" style={{ align: "center" }}>
          {shorttext}
        </Text>
      </Card.Section>
      <ol>
        {longtext.split('\n').map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ol>
      <Card.Section p="xs">
        <ReadController id="card" text={longtext} />
      </Card.Section>
    </Card>
  );
};

export default StoryInstructionCard;
