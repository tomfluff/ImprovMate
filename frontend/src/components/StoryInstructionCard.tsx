import { Card, Text } from "@mantine/core";
import ReadController from "./ReadController";

const StoryInstructionCard = () => {
  const intro = "HOW TO PLAY";
  const instr =
    "In the 'Context' tab you can read the character description and the premise of the story.\nIn the 'Keypoints' tab the key points of each part of the story are listed.\nYou can advance the story using your improvisational skills. You can get help through the 'Hints' function to continue or finish the story.\nThe story continues thanks to your improvisation and then a new part is generated with new actions to take.\nAlternatively, you can use one of the two options proposed.\nRead the new developments and decide how to continue!\nHave fun!";

  const shorttext = intro;
  const longtext = instr;

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

export default StoryInstructionCard;
