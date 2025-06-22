import { Card, Text } from "@mantine/core";
import ReadController from "./ReadController";

type Props = {
  gameMode: string;
};

const PracticeInstructionCard = ({ gameMode }: Props) => {
  const intro = "HOW TO PLAY";
  const instrEnd =
    "Read the proposed story.\nInvent a conclusion for the story and act it out using your improvisation skills.\nRead the conclusion generated with your improvisation.\nIf you are satisfied, move on to the next story, otherwise you can try again.\nHave fun!";
  const instr3T =
    "Read the proposed question.\nUse your reactivity and answer with the first 3 answers that come to mind.\nSeparate the 3 answers using a comma and press 'Enter' to move on to the next question.\nHave fun!";

  const shorttext = intro;
  const longtext = gameMode === "endings" ? instrEnd : instr3T;

  return (
    <Card shadow="md" my={8} padding="sm" radius="md">
      <Card.Section mb="sm">
        <Text
          size="md"
          fw={500}
          p="xs"
          bg="violet"
          c="white"
          style={{ align: "center" }}
        >
          {shorttext}
        </Text>
      </Card.Section>
      <ol>
        {longtext.split("\n").map((line, index) => (
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
