import { Card, Text } from "@mantine/core";
import ReadController from "./ReadController";
import { usePreferencesStore } from "../stores/preferencesStore";

type Props = {
  gameMode: string;
};

const PracticeInstructionCard = ({ gameMode }: Props) => {
  const intro = {
    en: "HOW TO PLAY",
    it: "COME GIOCARE",
  }
  const instrEnd = {
    en: "Read the proposed story.\nInvent a conclusion for the story and act it out using your improvisation skills.\nRead the conclusion generated with your improvisation.\nIf you are satisfied, move on to the next story, otherwise you can try again.\nHave fun!",
    it: "Leggi la storia proposta.\nInventa una conclusione per la storia e mettila in atto tramite le tue capacità di improvvisazione.\nLeggi la conclusione generata con la tua improvvisazione.\nSe sei soddisfatto, passa alla storia successiva, altrimenti puoi riprovare.\nBuon divertimento!",
  }
  const instr3T = {
    en: "Read the proposed question.\nUse your reactivity and answer with the first 3 answers that come to mind.\nSeparate the 3 answers using a comma and press 'Enter' to move on to the next question.\nHave fun!",
    it: "Leggi la domanda proposta.\nSfrutta la tua reattività e rispondi con le prime 3 risposte che ti vengono in mente.\nSepara le 3 risposte usando la virgola e premi 'Invio' per passare alla prossima domanda.\nBuon divertimento!",
  }

  const language = usePreferencesStore.use.language();
  const shorttext = intro[language === 'it' ? 'it' : 'en'];
  const longtext = gameMode === 'endings' ? instrEnd[language === 'it' ? 'it' : 'en'] : instr3T[language === 'it' ? 'it' : 'en'];

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

export default PracticeInstructionCard;
