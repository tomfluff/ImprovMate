import { useState } from "react";
import { Card, Switch, Stack, Select, Divider } from "@mantine/core";
import {
  setPreferences,
  usePreferencesStore,
} from "../stores/preferencesStore";
import {
  /*complexityOptions,*/ languageOptions,
} from "../utils/llmIntegration";
import { useOs } from "@mantine/hooks";

const PreferencePane = () => {
  const os = useOs();
  const storyLanguageOptions = languageOptions.map((d) => ({
    label: d.label,
    value: d.value,
  }));
  /*const storyComplexityOptions = complexityOptions.map((d) => ({
    label: d.label,
    value: d.value,
  }));
  const maxComplexity = Math.max(...complexityOptions.map((d) => d.value));
  const minComplexity = Math.min(...complexityOptions.map((d) => d.value));*/

  const [language, setLanguage] = useState(
    usePreferencesStore.getState().language
  );
  const [autoReadStorySections, setAutoReadStorySections] = useState(
    usePreferencesStore.getState().autoReadStorySections
  );
  const [includeStoryImages, setIncludeStoryImages] = useState(
    usePreferencesStore.getState().includeStoryImages
  );
  /*const [storyComplexity, setStoryComplexity] = useState(
    usePreferencesStore.getState().storyComplexity
  );*/

  return (
    <Card shadow="sm">
      <Stack gap="md">
        <Select
          label="Story Language"
          description="Select the language of the story."
          radius="md"
          data={storyLanguageOptions}
          value={language}
          onChange={(_value, option) => {
            setPreferences({ language: option.value });
            setLanguage(option.value);
          }}
        />
        <Divider />
        <Switch
          checked={autoReadStorySections}
          onChange={(e) => {
            setPreferences({ autoReadStorySections: e.currentTarget.checked });
            setAutoReadStorySections(e.currentTarget.checked);
          }}
          label="Auto-read"
          description="Automatically read the story sections."
          disabled={os === "ios"}
        />

        <Switch
          checked={includeStoryImages}
          onChange={(e) => {
            setPreferences({ includeStoryImages: e.currentTarget.checked });
            setIncludeStoryImages(e.currentTarget.checked);
          }}
          label="Story Images"
          description="Include images in the story."
        />

        <Divider />
        {/* <Box>
          <Text size="sm">Story Complexity</Text>
          <Slider
            marks={storyComplexityOptions}
            label={null}
            value={storyComplexity}
            onChange={(value) => {
              setPreferences({ storyComplexity: value });
              setStoryComplexity(value);
            }}
            step={1}
            min={minComplexity}
            max={maxComplexity}
            mb="md"
            mt="xs"
          />
        </Box> */}
      </Stack>
    </Card>
  );
};

export default PreferencePane;
