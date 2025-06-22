import { Box, Title, Text, Button, Container, Group } from "@mantine/core";
import { Link } from "react-router-dom";
import classes from "./NotFoundTitle.module.css";

export function NotFoundTitle() {
  return (
    <Box w="100vw" h="100vh">
      <Group justify="center" align="center" h="100%">
        <Container className={classes.root}>
          <div className={classes.label}>404</div>
          <Title className={classes.title}>
            You have found a secret place.
          </Title>
          <Text
            c="dimmed"
            size="lg"
            ta="center"
            className={classes.description}
          >
            Unfortunately, this is only a 404 page. You may have mistyped the
            address, or the page has been moved to another URL.
          </Text>
          <Group justify="center">
            <Button component={Link} to={"/ImprovMate/"} variant="subtle" size="md">
              Take me back to home page
            </Button>
          </Group>
        </Container>
      </Group>
    </Box>
  );
}
