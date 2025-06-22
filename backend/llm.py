import json
import os
from dotenv import load_dotenv
import requests
import sys
import random
import cv2
import base64
import numpy as np
import tempfile

from langcodes import Language

from openai import OpenAI

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import logger_setup
from config import *

DEBUG = LLM_DEBUG

load_dotenv()
LOGGER = os.environ.get("LOGGER", "False").lower() in ("true", "1", "t")

if LOGGER:
    logger = logger_setup("llm", os.path.join(LOG_FOLDER, "llm.log"), debug=DEBUG)
else:
    logger = None


class Storyteller:
    def __init__(self, key, org) -> None:
        self.llm = OpenAI(api_key=key, organization=org)
        self.gpt4 = MODEL_GPT4
        self.gpt4mini = MODEL_GPT4MINI
        self.vision = MODEL_VISION
        self.image_gen = MODEL_IMAGE_GEN
        self.stt = MODEL_STT
        self.tts = MODEL_TTS

        if logger:
            logger.info(f"LLM storyteller initialized.")
        if logger:
            logger.debug(
                f"Modes: {self.gpt4}, {self.gpt4mini}, {self.vision}, {self.image_gen}, {self.stt}, {self.tts}"
            )

    def hello_world(self):
        messages = [
            {"role": "system", "content": "You are a helpful chatbot."},
            {"role": "user", "content": "Hello, who are you?"},
        ]
        return self.send_gpt_hq_request(messages)

    def __get_json_data(self, datastr):
        try:
            if datastr.strip().startswith("```json"):
                return json.loads(datastr.split("```json")[1].split("```")[0])
            elif datastr.strip().startswith("{"):
                return json.loads(datastr)
            else:
                raise Exception("Could not parse JSON data from string")
        except Exception as e:
            if logger:
                logger.error(e)
        finally:
            if logger:
                logger.debug(f"Data string: '{datastr}'")

    def __improve_prompt(
        self,
        prompt,
        usage="image generation model",
        info="Expand, add more details, and improve the prompt. Remove any mentions of names.",
        example="Childlike drawing with vivid colors of a cat looking at a food bowl.",
    ):
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a helpful assistant. Help me improve the prompt for the usage of {usage}.
1. Understand the input prompt.
2. Improve the prompt for %s.
3. Make sure the prompt is safe, respectful, and does not violate any guidelines or policies.
4. %s
5. Output the improved prompt as one paragraph.

Example JSON output:
{
    "old_prompt": "...",
    "new_prompt": "%s",
}
"""
                        % (usage, info, example),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Prompt: %s" % (prompt),
                    },
                ],
            },
        ]
        data = self.send_gpt_lq_request(messages)
        data = self.__get_json_data(data)
        if logger:
            logger.debug(f"Improved prompt: {data}")
        return data

    # -- Unimplemented Functions --

    def __inquire_drawing(self, data):
        # Send LLM request to inquire about the drawing (based on the data)
        pass

    def __analyze_feedback(self, feedback):
        # Analyze the user feedback (positive or negative, etc.)
        pass

    def __calc_story_part_score(self, story_part):
        # Get the score of a story part
        pass

    def __get_least_frequenct_word(self, story_part):
        # Get the least frequent word in the story part
        pass

    def __get_diff_story_elements(self, story_part):
        # Get the different story elements in the story part
        pass

    def __get_named_story_elements(self, story_part):
        # Get the named story elements in the story part
        pass

    def __check_ending_condition(self):
        # Check if the story should be finished
        pass

    # -- Storyteller Functions --

    def initialize_story(self, context, complexity):
        length = random.choice([1, 1, 1, 2, 2, 3, 4])
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You a great storyteller.
1. Using the input context, initialize a story.
2. Generate the first part of the story.
    - Not more than %d sentences.
3. The story should be about the protagonist in the context.
4. Give a short visual description of a key moment in the story part.
    - Describe the environment.
    - Do not name the main character.
5. Categorize the sentiment of the new part. Choose from: 'happy', 'sad', 'neutral', 'shocking'.
6. Return as a JSON object.
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.


Example JSON object:
{
    "text": "Once upon a time there was a cat named Johnny who loved to eat tuna. One day when Johnny was playing with his toys, he heard a noise coming from the kitchen. He went to investigate and found that someone had stolen his tuna!",
    "keymoment": "A tuna-can filled with tuna that is overflowing to the floor in a kitchen.",
    "sentiment": "sad",
    "who": ["Johnny"],
    "where": "kitchen",
    "objects": ["tuna", "toys"],
}
"""
                        % (length),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(context),
                    },
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def analyze_story_parts(self, context):
        # Send LLM request to analyze story parts based on a given context.
        story = context["story"]
        story_parts = context["story_parts"]
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a helpful assistant and a great storyteller. Help me analyze this story.
0. Understand the input story which is the story so far, example: 
    [
        "Once upon a time in the vibrant city of Jubilantville, there lived a Super Happy Kid, a joyful young hero named after the infectious happiness that radiated from every fiber of their being. Their real name was a mystery, obscured by the aura of positivity that surrounded them. Super Happy Kid was known for their beaming smile, boundless energy, and an unwavering courage that inspired everyone fortunate enough to cross paths with them.",
        "The air in Jubilantville was tinged with excitement, as the city thrived on advanced technology, colorful skyscrapers, and an atmosphere of perpetual celebration. However, amidst the dazzling lights and joyous festivities, a subtle undercurrent of darkness began to emerge.",
        "Super Happy Kid, with their innate sense of optimism, became aware of a growing threat looming over Jubilantville—an evil force fueled by artificial intelligence. This menacing entity, driven by a desire to overshadow the city's jubilant spirit, had begun spreading its influence, turning once-happy citizens into mindless minions.",
    ]
1. Understand the input story_parts, example:
    [
        {
            "text": "As the evil force continues to spread its influence, Super Happy Kid seeks the help of the city's brightest minds and together they devise a plan to counter the AI's manipulative tactics, utilizing advanced technology and their infectious positivity to combat the growing darkness.",
        },
        {
            "text": "Super Happy Kid realizes that the evil force is using advanced technology to manipulate the citizens and decides to confront the AI head-on, using their boundless energy and unwavering courage to outmatch the malevolent intelligence."
        }
    ]
2. Use the story to analyze each of the texts in story_parts
3. When analyzing each of the story_parts, generate the following information:
    - an intensity value between 0 and 10.
    - an emotion, e.g. 'happy', 'sad', etc.
    - a positioning, e.g. 'start', 'middle', 'end', etc.
    - a complexity value between 0 and 1.v
4. Return as a JSON object.
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Here is an example JSON object:
{
    "analytics": [
        {
            "intensity": "0.8",
            "emotion": "determined",
            "positioning": "middle",
            "complexity": "0.7",
        },
        {
            "intensity": "0.9",
            "emotion": "courageous",
            "positioning": "middle",
            "complexity": "0.8",
        },
    ]
}
                        """,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(story),
                        "text": str(story_parts),
                    },
                ],
            },
        ]
        data = self.send_gpt_lq_request(messages)
        return self.__get_json_data(data)

    def terminate_story(self, context, complexity):
        endings = [
            "Ends in a plot twist.",
            "Ends with a moral lesson.",
            "Ends with a happy ending.",
            "Ends with a sad ending.",
        ]
        ending = random.choice(endings)
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You a great storyteller.
1. Understand the story so far.
2. Generate the final part of the story.
    - Reach a conclusion for the story.
    - %s
3. Give a short visual description of a key moment in the story part.
    - Describe the environment.
    - Do not name the main character.
4. Categorize the sentiment of the new part. Choose from: 'happy', 'sad', 'neutral', 'shocking'.
5. Return as a JSON object.
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Example JSON object:
{
    "part": {
        "text": "He went to investigate and found that someone had stolen his tuna!",
        "keymoment": "A can of tune filled with tuna that is overflowing to the floor in a kitchen."
        "sentiment": "sad",
        "who": ["Johnny"],
        "where": "kitchen",
        "objects": ["tuna"],
    }
}
"""
                        % (ending),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(context),
                    },
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_actions(self, context, complexity, n=2):
        # Generate choices based on a given context
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You a great storyteller.
1. Understand the story so far.
2. Help me generate %d unique actions the main character may perform.
3. Each action should advance the current story somehow.
4. Action is defined by:
    - Title, few words describing the action.
    - Description, very short paragraph with more details.
5. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Here is an example JSON object:
{
    "list": [
        {
            "title": "Investigate",
            "desc": "Johnny decides to go to the kitchen to investigate the noise.",
        },
        {
            "title": "Ignore",
            "desc": "Johnny decides to ignore the noise and continue playing with his toys.",
        },
    ]
}
                        """
                        % (n * 2),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(context),
                    },
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_story_part(self, context, complexity):
        # Generate a story part based on the given context
        length = random.choice([1, 1, 1, 2, 2, 3, 4])

        settings = [
            "Something absurdly good happens to the main character.",
            "Something absurdly bad happens to the main character.",
            "Introduce a new friendly character.",
            "Introduce a new relevant item.",
            "Advance the story in time (time skip).",
            "Move the story to a new location.",
            "Twist something already known.",
            "End with a cliffhanger.",
        ]

        # Randomly select a setting from the list
        setting = random.choice(settings)
        # convergence = random.choice([setting, "Direct the story towards the premise."])
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You a great storyteller.
1. Understand the input object, example:
    {
        "premise": "Johnny needs to find out who stole his tuna.",
        "story": "Once upon a time there was a cat named Johnny who loved to eat tuna. One day when Johnny was playing with his toys, he heard a noise coming from the kitchen.",
        "action": "Investigate",
    }
2. Understand the story so far.
3. Continue the story based on the main character performing the given action.
4. The next story part should be:
    - %s
    - Not more than %d sentences.
5. Generate a short visual description of a key moment in the new part:
    - Describe the environment.
    - Do not name the main character.
6. Categorize the sentiment of the new part. Choose from: 'happy', 'sad', 'neutral', 'shocking'.
7. Return as a JSON object.
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.
    
Example JSON object:
{
    "part": {
        "text": "He went to investigate and found that someone had stolen his tuna!",
        "keymoment": "A can of tune filled with tuna that is overflowing to the floor in a kitchen."
        "sentiment": "sad",
        "who": ["Johnny"],
        "where": "kitchen",
        "objects": ["tuna"],
    }
}
"""
                        % (setting, length),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(context),
                    },
                ],
            },
        ]

        if logger:
            logger.debug(f"Chosen setting: {setting}")
        if logger:
            logger.debug(f"New part message: {messages}")
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_premise(self, character, complexity, n=2):
        # Generate a premise based on the given character
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a helpful assistant. Help me generate a story premise for this character.
0. Understand the input context.
1. Generate %d unique story locations.
2. For each premise include the following:
    - title, a short title for the premise.
    - desc, a short description of the premise.
3. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Example JSON object:
{
    "list": [
        {
            "title": "Sky kingdom",
            "desc": "A kingdom in the sky where the protagonist has to save the queen from an evil dragon."
        },
    ]
}
"""
                        % (n),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(character),
                    },
                ],
            },
        ]
        data = self.send_gpt_lq_request(messages)
        return self.__get_json_data(data)

    def generate_init_hints(self, complexity, n=2):
        # Generate hints to start an improv story
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": f"""
You are a helpful assistant fluent in English. help me generate some prompts to start an improvisation performance.
1. Generate {n} elements, each composed of 3 fields, the first answering the question 'Who?', the second 'Where?' and the third 'What happened?'
2. The answer to 'Who?' should be a character that can be used as a protagonist. (examples: a clown, a turtle, the Pope)
3. The answer to 'Where?' should be a location where the story takes place.
4. The answer to 'What happened?' should be a short event that can be used as the starting point of the story.
5. Use English.
6. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Example JSON object:
{{
    "list": [
        {{
            "who": "The Pope",
            "where": "A haunted house",
            "what": "He found a secret passage in the basement."
        }},
    ]
}}
""",
                    }
                ],
            },
        ]
        data = self.send_gpt_hq_request(
            messages, temperature=1.3
        )  # TODO: change temperature?
        return self.__get_json_data(data)

    def generate_character(self, drawing_url, complexity):
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a helpful assistant. Help me understand the drawing in this photo.
1. Generate a short description of the drawing.
    - The contained content.
    - The visual style.
2. Tell me what items are drawn.
3. Name the character in the drawing.
4. If the character is unknown, invent a name for it.
5. Write a short backstory about the character in the drawing.
6. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Here is an example JSON object:
{
    'image': {
        'items': [
            {'name': 'cat', 'importance': 0.9}
        ],
        'content': 'A cat looking at a food bowl.', 
        'style': 'Simple crayon drawing with bright colors.',
        'colors': [
            {'color':'black','usage':'the cat is black'}
        ]
    }, 
    'character': {
        'fullname': 'Johnny the cat',
        'shortname': 'Johnny',
        'likes': ['tuna', 'playing'],
        'dislikes': ['dogs', 'water'],
        'fears': ['being hungry', 'being alone'],
        'personality': ['friendly', 'gluttonous', 'playful'],
        'backstory': 'Johnny the cat loves tuna. He is always hungry and looking for food. He is a very friendly cat and loves to play with his toys.',
    }
}
""",
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": drawing_url},
                    },
                ],
            },
        ]
        data = self.send_vision_request(messages)
        return self.__get_json_data(data)

    def generate_story_image(self, story_part):
        content = story_part["content"]
        style = story_part["style"]

        prompt = f"""
{content}.
In the style of: {style}.
"""
        prompt = self.__improve_prompt(
            prompt, "image generation model to generate drawings"
        )
        prompt = prompt["new_prompt"]

        result = self.send_image_request(prompt)
        return {"prompt": prompt, "image_url": result}

    def generate_character_improv(self, transcript, motion, hints=[], end=False):
        if logger:
            logger.debug(
                f"Generating character from improv: {transcript}, {motion}, {hints}."
            )

        sys_msg = """
You are a helpful assistant. Help me generate the character of the story starting from the dialogue and motion performed by the actor.
1. Name the main character in the story.
2. Write a short backstory about the character in the story.
"""
        if len(hints) > 0:
            if end:
                type_of_end = str(hints).split(":")[0].strip().replace("{", "")
                hint = str(hints).split(":")[1].strip().replace("}", "")
                sys_msg += f"3 - As context for the improv performance, the scenario can be described as {type_of_end} and this is the scenario staged by the performer: {hint}. Be faithful to the context and use the characters, places or actions mentioned.\n"
            else:
                sys_msg += f"3 - As context for the improv performance, use the following hints to guide your analysis: {hints}. Be faithful to the context and use the characters, places or actions mentioned.\n"
                if hints.get("who"):
                    sys_msg += "- 'who': he character that the performer is impersonating, and will be the protagonist of the story.\n"
                if hints.get("where"):
                    sys_msg += "- 'where': Location where the story takes place.\n"
                if hints.get("what"):
                    sys_msg += (
                        "- 'what': Event used as the starting point of the story.\n"
                    )

        sys_msg += """
4. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Explanation of the output format:
{
    'character': {
        'fullname': fullname of the character,
        'shortname': shortname of the character,
        'likes': what they like,
        'dislikes': what they dislike,
        'fears': what they fear,
        'personality': 3 main traits of his personality,
        'backstory': a short backstory about the character using 200 characters,
    }
}

Here is an example JSON object:
{
    'character': {
        'fullname': 'Johnny the cat',
        'shortname': 'Johnny',
        'likes': ['tuna', 'playing'],
        'dislikes': ['dogs', 'water'],
        'fears': ['being hungry', 'being alone'],
        'personality': ['friendly', 'gluttonous', 'playful'],
        'backstory': 'Johnny the cat loves tuna. He is always hungry and looking for food. He is a very friendly cat and loves to play with his toys.',
    }
}
"""
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": sys_msg,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"Dialogue: {transcript}, Motion: {motion}.",
                    },
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_premise_improv(
        self, transcript, motion, character
    ):  # TODO: improve prompt - specify where and who
        # Generate a story part based on the imrprov result
        improv = {"dialogue": transcript, "motion": motion}
        if logger:
            logger.debug(f"Improv in generate_premise_improv(): {improv}")

        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You a great storyteller.
1. Understand the input object, which includes: 
    {
        "dialogue": The transcription of the audio in the improv performance,
        "motion": {
                "description": The description of the motion and audio in the improv performance,
                "emotion": The emotional state associated with the action,
                "keywords": 3 keywords describing the performance,
            }
    }
Example:
    {
        "dialogue": "Help me, please",
        "motion": {
                "description": "The individual is sitting still with an intense gaze. As they speak the words 'Help me, please,' their mouth forms the words with a slight change in facial expression, enhancing the emotion conveyed by their voice.",
                "emotion": "Vulnerable",
                "keywords": ["vulnerable", "intense", "help"],
            }
    }
2. The input object describes the motion and audio in a short improv performance that is to be used as a beginning for the narrative of the improvisation story.
3. Generate the story premise based on the description and emotion of the improv performance.
4. Analize the input object, if it is not specified who, where or what happens, randomly generate the missing parts.
5. Use the information about the character.
6. Be faithful to the input object.
7. Include the following:
    - title, a short title for the premise.
    - desc, a short description of the premise.
8. Return as a JSON object.
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.
    
Example JSON object:
{
    "title": "Rescue Mission",
    "desc": "An old man in distress calls out for help, setting the stage for a rescue mission to save them from danger."
}
"""
                        % (),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"{improv}. Character: {character}",
                    },
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_character_image_improv(self, character):

        prompt = f"""
Generate an image using the description of the character: {character}.
Use a realistic style.
"""
        prompt = self.__improve_prompt(
            prompt, "image generation model to generate drawings"
        )
        if logger:
            logger.debug(f"Improved prompt: {prompt}")

        prompt = prompt["new_prompt"]

        result = self.send_image_request(prompt)
        return {"prompt": prompt, "image_url": result}

    def generate_character_premise_improv(
        self, transcript, frames, hints=[], end=False
    ):
        improv = {"dialogue": transcript, "motion": frames}
        ctx = {"hints": hints, "end": end}
        if logger:
            logger.debug(
                f"Improv in generate_character_premise_improv(): {improv}, {ctx}"
            )

        sys_msg = """
You are a helpful assistant storyteller. Help me generate the character and the premise of the story starting from the dialogue and motion performed by the actor.
1. The input object is a short improv performance that is to be used as a beginning for the narrative of the improvisation story.
2. Analyze the key movements in the video, focusing on how the performer's movements interact with their spoken words or sounds in the audio. 
3. Consider how these movements connect with the improvisational flow and transform or enhance the narrative in real-time.
4. Name the main character in the story.
5. Write a short backstory about the character in the story.
6. Generate the story premise based on the description and emotion of the improv performance.
7. Analize the input object, if it is not specified who, where or what happens, randomly generate the missing parts.
"""
        if len(hints) > 0:
            if end:
                type_of_end = str(hints).split(":")[0].strip().replace("{", "")
                hint = str(hints).split(":")[1].strip().replace("}", "")
                sys_msg += f"8 - As context for the improv performance, the scenario can be described as {type_of_end} and this is the scenario staged by the performer: {hint}. Be faithful to the context and use the characters, places or actions mentioned.\n"
            else:
                sys_msg += f"8 - As context for the improv performance, use the following hints to guide your analysis: {hints}. Be faithful to the context and use the characters, places or actions mentioned.\n"
                if hints.get("who"):
                    sys_msg += "- 'who': he character that the performer is impersonating, and will be the protagonist of the story.\n"
                if hints.get("where"):
                    sys_msg += "- 'where': Location where the story takes place.\n"
                if hints.get("what"):
                    sys_msg += (
                        "- 'what': Event used as the starting point of the story.\n"
                    )

        sys_msg += """
9. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Explanation of the output format:
{
    'character': {
        'fullname': fullname of the character,
        'shortname': shortname of the character,
        'likes': what they like,
        'dislikes': what they dislike,
        'fears': what they fear,
        'personality': 3 main traits of his personality,
        'backstory': a short backstory about the character using 200 characters,
    }
    'premise': {
        'title': a short title for the premise,
        'desc': a short description of the premise,
    }
}

Here is an example JSON object:
{
    'character': {
        'fullname': 'Johnny the cat',
        'shortname': 'Johnny',
        'likes': ['tuna', 'playing'],
        'dislikes': ['dogs', 'water'],
        'fears': ['being hungry', 'being alone'],
        'personality': ['friendly', 'gluttonous', 'playful'],
        'backstory': 'Johnny the cat loves tuna. He is always hungry and looking for food. He is a very friendly cat and loves to play with his toys.',
    }
    'premise': {
        'title': 'Rescue Mission',
        'desc': 'Jonnhy the cat is in distress and calls out for help, setting the stage for a rescue mission to save him from danger.'
    }
}
"""
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": sys_msg,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
Analyze the following improvisational performance with reference to the audio transcription: '%s'.
"""
                        % transcript,  # TODO: try different examples
                    },
                ],
            },
            {
                "role": "user",
                "content": [
                    "These are video frames in order.",
                    *map(
                        lambda frame: {
                            "type": "image_url",
                            "image_url": {"url": f"{frame}", "detail": "low"},
                        },
                        frames,
                    ),
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_story_improv(
        self, transcript, frames, story, premise, keypoint, hints=[], end=False
    ):
        improv = {"dialogue": transcript, "motion": frames}
        ctx = {"story": story, "hints": hints, "end": end}
        if logger:
            logger.debug(
                f"Improv in generate_character_premise_improv(): {improv}, {ctx}"
            )

        length = random.choice([1, 1, 1, 2, 2, 3, 4])

        sys_msg = f"""
You are a helpful assistant storyteller. Help me generate the next part of the story starting from the dialogue and motion performed by the actor.
1. The input object is a short improv performance that is to be used as a continuation for the narrative of the improvisation story.
2. Analyze the key movements in the video, focusing on how the performer's movements interact with their spoken words or sounds in the audio. 
3. Consider how these movements connect with the improvisational flow and transform or enhance the narrative in real-time.
"""
        if len(hints) > 0:
            if end:
                type_of_end = str(hints).split(":")[0].strip().replace("{", "")
                hint = str(hints).split(":")[1].strip().replace("}", "")
                sys_msg += f"4 - As context for the improv performance, the scenario can be described as {type_of_end} and this is the scenario staged by the performer: {hint}. Be faithful to the context and use the characters, places or actions mentioned.\n"
            else:
                sys_msg += f"4 - As context for the improv performance, use the following hints to guide your analysis: {hints}. Be faithful to the context and use the characters, places or actions mentioned.\n"
                if hints.get("who"):
                    sys_msg += "- 'who': he character that the performer is impersonating, and will be the protagonist of the story.\n"
                if hints.get("where"):
                    sys_msg += "- 'where': Location where the story takes place.\n"
                if hints.get("what"):
                    sys_msg += (
                        "- 'what': Event used as the starting point of the story.\n"
                    )
                    if hints.get("what"):
                        sys_msg += (
                            "- 'what': Event used as the starting point of the story.\n"
                        )

        sys_msg += f"""
5. Consider the premise of the story, it consist main scenario or conflict of the story: {premise}.
6. Consider the narrative context that has been established so far: {story}.
7. Consider the key points that have been identified in the story: 
    - "who": The characters present in the story told so far.
    - "where": The location where the story takes place.
    - "objects": The objects present in the story told so far.
    - {keypoint}.
8. Generate the next story part based on the context of the story, considering description and emotion of the improv performance. The next story part should be: 
    - Not more than {length} sentences.
    - Take into account the "who", "where" and "objects" present in the story so far. Omit them only if they are not relevant to the new part.
    - Reflect any hints, decisions, or actions from the improv as part of the next story step.
    - Be true to the user's intentions.
9. Categorize the sentiment of this part using one of the following: 'happy', 'sad', 'neutral', or 'shocking'.
"""
        sys_msg += """
10. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Explanation of the output format:
{
    "text": Narration of the new story part,
    "keymoment": Key moment in the story part,
    "sentiment": Sentiment of the story part,
    "who": Characters (one or more) present in the story part,
    "where": Location where the story takes place,
    "objects": Objects (one or more) present in the story part,
}

Here is an example JSON object:
{
    "text": "He looked around to investigate as if searching for something and found that someone had stolen his tuna!",
    "keymoment": "A can of tune filled with tuna that is overflowing to the floor in a kitchen."
    "sentiment": "sad",
    "who": ["Johnny"],
    "where": "kitchen",
    "objects": ["tuna"],
}
"""
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": sys_msg,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
Analyze the following improvisational performance with reference to the audio transcription: '%s'.
"""
                        % transcript,  # TODO: try different examples
                    },
                ],
            },
            {
                "role": "user",
                "content": [
                    "These are video frames in order.",
                    *map(
                        lambda frame: {
                            "type": "image_url",
                            "image_url": {"url": f"{frame}", "detail": "low"},
                        },
                        frames,
                    ),
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_ending_improv(
        self, transcript, frames, story, premise, keypoint, hints=[], end=True
    ):
        improv = {"dialogue": transcript, "motion": frames}
        ctx = {"story": story, "hints": hints, "end": end}
        if logger:
            logger.debug(
                f"Improv in generate_character_premise_improv(): {improv}, {ctx}"
            )

        sys_msg = f"""
You are a helpful assistant storyteller. Help me generate the ending of the story starting from the dialogue and motion performed by the actor.
1. The input object is a short improv performance that is to be used as an ending for the narrative of the improvisation story.
2. Analyze and the key movements in the video, focusing on how the performer's movements interact with their spoken words or sounds in the audio. 
3. Consider how these movements connect with the improvisational flow and transform or enhance the narrative in real-time.
"""
        if len(hints) > 0:
            if end:
                type_of_end = str(hints).split(":")[0].strip().replace("{", "")
                hint = str(hints).split(":")[1].strip().replace("}", "")
                sys_msg += f"4 - As context for the improv performance, the scenario can be described as {type_of_end} and this is the scenario staged by the performer: {hint}. Be faithful to the context and use the characters, places or actions mentioned.\n"
            else:
                sys_msg += f"4 - As context for the improv performance, use the following hints to guide your analysis: {hints}. Be faithful to the context and use the characters, places or actions mentioned.\n"
                if hints.get("who"):
                    sys_msg += "- 'who': he character that the performer is impersonating, and will be the protagonist of the story.\n"
                if hints.get("where"):
                    sys_msg += "- 'where': Location where the story takes place.\n"
                if hints.get("what"):
                    sys_msg += (
                        "- 'what': Event used as the starting point of the story.\n"
                    )

        sys_msg += f"""
5. Consider the premise of the story, it consist main scenario or conflict of the story: {premise}.
6. Consider the narrative context that has been established so far: {story}.
7. Consider the key points that have been identified in the story: 
    - "who": The characters present in the story told so far.
    - "where": The location where the story takes place.
    - "objects": The objects present in the story told so far.
    - {keypoint}.
8. Generate the final story part based on the context of the story, considering description and emotion of the improv performance. 
The ending should be: 
    - Take into account the "who", "where" and "objects" present in the story so far. Omit them only if they are not relevant to the ending.
    - Reflect any hints, decisions, or actions from the improv as part of the ending.
    - Be true to the user's intentions.
    - Don't leave any narrative points hanging.
9. Categorize the sentiment of this part using one of the following: 'happy', 'sad', 'neutral', or 'shocking'.
"""
        sys_msg += """
10. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Explanation of the output format:
{
    "text": Narration of the ending,
    "keymoment": Key moment in the ending,
    "sentiment": Sentiment of the ending,
    "who": Characters (one or more) present in the ending,
    "where": Location where the story takes place,
    "objects": Objects (one or more) present in the ending,
}

Here is an example JSON object:
{
    "text": "Johnny found his tuna in the fridge, safe and sound, and decided to share it with his girlfriend Tina.",
    "keymoment": "A can of tuna in the fridge, untouched and ready to be eaten.",
    "sentiment": "happy",
    "who": ["Johnny", "Tina"],
    "where": "kitchen",
    "objects": ["tuna", "fridge"],
}
"""
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": sys_msg,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
Analyze the following improvisational performance with reference to the audio transcription: '%s'.
"""
                        % transcript,  # TODO: try different examples
                    },
                ],
            },
            {
                "role": "user",
                "content": [
                    "These are video frames in order.",
                    *map(
                        lambda frame: {
                            "type": "image_url",
                            "image_url": {"url": f"{frame}", "detail": "low"},
                        },
                        frames,
                    ),
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_ending_exercise_improv(
        self, transcript, frames, story, hints=[], end=True
    ):
        improv = {"dialogue": transcript, "motion": frames}
        ctx = {"hints": hints, "end": end}
        if logger:
            logger.debug(
                f"Improv in generate_character_premise_improv(): {improv}, {ctx}"
            )

        sys_msg = f"""
You are a helpful assistant storyteller. Help me generate the ending of the story starting from the dialogue and motion performed by the actor.
1. The input object is a short improv performance that is to be used as an ending for the narrative of the improvisation story.
2. Analyze and the key movements in the video, focusing on how the performer's movements interact with their spoken words or sounds in the audio. 
3. Consider how these movements connect with the improvisational flow and transform or enhance the narrative in real-time.
"""
        if len(hints) > 0:
            if end:
                type_of_end = str(hints).split(":")[0].strip().replace("{", "")
                hint = str(hints).split(":")[1].strip().replace("}", "")
                sys_msg += f"4 - As context for the improv performance, the scenario can be described as {type_of_end} and this is the scenario staged by the performer: {hint}. Be faithful to the context and use the characters, places or actions mentioned.\n"
            else:
                sys_msg += f"4 - As context for the improv performance, use the following hints to guide your analysis: {hints}. Be faithful to the context and use the characters, places or actions mentioned.\n"
                if hints.get("who"):
                    sys_msg += "- 'who': he character that the performer is impersonating, and will be the protagonist of the story.\n"
                if hints.get("where"):
                    sys_msg += "- 'where': Location where the story takes place.\n"
                if hints.get("what"):
                    sys_msg += (
                        "- 'what': Event used as the starting point of the story.\n"
                    )

        sys_msg += f"""
5. Consider the narrative context that has been established so far: {story}.
6. Generate the final story part based on the context of the story, considering description and emotion of the improv performance. 
The ending should be: 
    - Take into account the "who", "where" and "objects" present in the story so far. Omit them only if they are not relevant to the ending.
    - Reflect any hints, decisions, or actions from the improv as part of the ending.
    - Be true to the user's intentions.
    - Don't leave any narrative points hanging.
9. Categorize the sentiment of this part using one of the following: 'happy', 'sad', 'neutral', or 'shocking'.
"""
        sys_msg += """
10. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Explanation of the output format:
{
    "text": Narration of the ending,
    "keymoment": Key moment in the ending,
    "sentiment": Sentiment of the ending,
    "who": Characters (one or more) present in the ending,
    "where": Location where the story takes place,
    "objects": Objects (one or more) present in the ending,
}

Here is an example JSON object:
{
    "text": "Johnny found his tuna in the fridge, safe and sound, and decided to share it with his girlfriend Tina.",
    "keymoment": "A can of tuna in the fridge, untouched and ready to be eaten.",
    "sentiment": "happy",
    "who": ["Johnny", "Tina"],
    "where": "kitchen",
    "objects": ["tuna", "fridge"],
}
"""
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": sys_msg,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
Analyze the following improvisational performance with reference to the audio transcription: '%s'.
"""
                        % transcript,  # TODO: try different examples
                    },
                ],
            },
            {
                "role": "user",
                "content": [
                    "These are video frames in order.",
                    *map(
                        lambda frame: {
                            "type": "image_url",
                            "image_url": {"url": f"{frame}", "detail": "low"},
                        },
                        frames,
                    ),
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def translate_text(self, text, source_language="en", target_language="en"):
        source = Language.get(source_language)
        target = Language.get(target_language)
        # Translate the given text to the target language using LLM
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
Translate text from %s to %s.
1. Translate the given text.
2. Return the translated text in the target language.

Example JSON object:
{
    "original": "...",
    "translation": "...",
}
"""
                        % (source, target),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Original text: '%s'." % text,
                    },
                ],
            },
        ]

        response = self.send_gpt_lq_request(messages)
        response = self.__get_json_data(response)
        data = response["translation"]
        if logger:
            logger.debug(f"Translated text: {data}")
        return data

    def translate_keypoints(self, kp, source_language="en", target_language="en"):
        if logger:
            logger.debug(f"Keypoints in translate_keypoints: {kp}")
        source = Language.get(source_language)
        target = Language.get(target_language)
        # Translate the given text to the target language using LLM
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
Translate text from %s to %s.
1. Translate the given text.
2. Return the translated text in the target language.
3. Do not translate the keys.

Example JSON object:
{
    "head": ['Story Part', 'Who', 'Where', 'Objects'],
    "body": [[1, "Johnny", "Kitchen", "A black car"], [2, ["Johnny", "Sarah"], "Kitchen", ["A black car", "A phone"]]],
}
"""
                        % (source, target),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Original text: '%s'." % str(kp),
                    },
                ],
            },
        ]

        response = self.send_gpt_lq_request(messages)
        response = self.__get_json_data(response)
        if logger:
            logger.debug(f"Translated keypoints: {response}")
        return response

    def process_motion(self, frames, story):
        if logger:
            logger.debug(f"Processing motion...")
            logger.debug(f"Story: {story}")

        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a stunt choreographer. Your task is to describe the most important motion in the video in a way that ties it to the narrative of the ongoing story. Focus on what the person is doing and how this movement continues or enhances the story's development.
                        """,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
The description should relate to the ongoing story, as the movement performed continues or enhances the narrative. This is the story told so far for context: %s.
Using JSON format, output: title, desctiption, emotion, action, keywords.
Example:
{
    "title": "Fist fighting",
    "description": "A person moves from a neutral standing position to a fighting stance, strikes the enemy several times, and then returns to a neutral standing position.",
    "emotion": "Focused",
    "action": "Punching",
    "keywords": ["punch", "fighting"]
}
"""
                        % story,
                    },
                ],
            },
            {
                "role": "user",
                "content": [
                    "These are video frames in order.",
                    *map(
                        lambda frame: {
                            "type": "image_url",
                            "image_url": {"url": f"{frame}", "detail": "low"},
                        },
                        frames,
                    ),
                ],
            },
        ]

        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def speech_to_text(self, audio_file):
        if logger:
            logger.debug(f"Audio file: {audio_file}")
        transcript = self.llm.audio.transcriptions.create(
            model=self.stt,
            file=audio_file,
            language="en",
            prompt="""
The following is a recording of an improv performance.
The language is conversational, with some abrupt changes in tone or topic.
Please prioritize capturing the essence of the dialogue, including pauses, interruptions and reactions.""",
            response_format="json",
        )
        return transcript

    def process_improv_noctx(self, end, frames, hints=[], transcript="Hello"):
        if logger:
            logger.debug(
                f"Transcript: {transcript}, Hints: {hints}. Processing motion..."
            )

        sys_msg = """
You are a performance choreographer specializing in improvisation. 
Your task is to analyze and describe the key movements in the video, focusing on how the performer's movements interact with their spoken words or sounds in the audio. 
Explain how these movements connect with the improvisational flow and transform or enhance the narrative in real-time.

1 - Provide a description that relates to the improvisational context and how the movement extends or reinterprets the ongoing narrative. 
2 - Be coherent with the audio.
"""
        if len(hints) > 0:
            if end:
                type_of_end = str(hints).split(":")[0].strip().replace("{", "")
                hint = str(hints).split(":")[1].strip().replace("}", "")
                sys_msg += f"3 - As context for the improv performance, the scenario can be described as {type_of_end} and this is the scenario staged by the performer: {hint}. Be faithful to the context and use the characters, places or actions mentioned.\n"
            else:
                sys_msg += f"3 - As context for the improv performance, use the following hints to guide your analysis: {hints}. Be faithful to the context and use the characters, places or actions mentioned.\n"
                if hints.get("who"):
                    sys_msg += "- 'who': he character that the performer is impersonating, and will be the protagonist of the story.\n"
                if hints.get("where"):
                    sys_msg += "- 'where': Location where the story takes place.\n"
                if hints.get("what"):
                    sys_msg += (
                        "- 'what': Event used as the starting point of the story.\n"
                    )

        sys_msg += """
4 - Using JSON format, output: title, description, emotion, action, keywords.
Example:
{
    "title": "Retreating Step",
    "description": "As the performer says, 'I can't face this,' they take a slow, hesitant step backward. Their body turns slightly away, shoulders hunched, as though shielding themselves from an unseen force. This retreating motion accentuates the vulnerability in their voice, embodying the reluctance and inner conflict conveyed by the dialogue.",
    "emotion": "Fearful",
    "action": "Retreating",
    "keywords": ["step back", "hesitation", "vulnerability", "inner conflict"]
}
        """

        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": sys_msg,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
Analyze the following improvisational performance with reference to the audio transcription: '%s'.
"""
                        % transcript,  # TODO: try different examples
                    },
                ],
            },
            {
                "role": "user",
                "content": [
                    "These are video frames in order.",
                    *map(
                        lambda frame: {
                            "type": "image_url",
                            "image_url": {"url": f"{frame}", "detail": "low"},
                        },
                        frames,
                    ),
                ],
            },
        ]

        if logger:
            logger.debug(f"Messages: {sys_msg}")
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def process_improv_ctx(self, end, frames, story, hints=[], transcript="Hello"):
        if logger:
            logger.debug(f"Transcript: {transcript}. Processing improv...")

        sys_msg = """
You are a performance choreographer specializing in improvisation. 
Your task is to analyze and describe the key movements in the video, focusing on how the performer's movements interact with their spoken words or sounds in the audio.
Explain how these movements connect with the improvisational flow in a way that ties it to the narrative of the ongoing story. 
Focus on what the person is doing/saying and how this performance continues or enhances the story's development.

1 - Provide a description that relates to the improvisational context and how the movement extends or reinterprets the ongoing narrative. 
2 - Be coherent with the audio.
3 - The description should relate to the ongoing story, as the performance continues or enhances the narrative.
"""
        if len(hints) > 0:
            if end:
                type_of_end = str(hints).split(":")[0].strip().replace("{", "")
                hint = str(hints).split(":")[1].strip().replace("}", "")
                sys_msg += f"4 - As context for the improv performance, the scenario can be described as {type_of_end} and this is the scenario staged by the performer: {hint}\n"
            else:
                sys_msg += f"4 - As context for the improv performance, use the following hints to guide your analysis: {hints}\n"
                if hints.get("who"):
                    sys_msg += (
                        "- 'who': Character used by the performer as the protagonist.\n"
                    )
                if hints.get("where"):
                    sys_msg += "- 'where': Location where the story takes place.\n"
                if hints.get("what"):
                    sys_msg += (
                        "- 'what': Event used as the starting point of the story.\n"
                    )

        sys_msg += """
5 - Using JSON format, output: title, desctiption, emotion, action, keywords.
Example:
{
    "title": "Retreating Step",
    "description": "As the performer says, 'I can't face this,' they take a slow, hesitant step backward. Their body turns slightly away, shoulders hunched, as though shielding themselves from an unseen force. This retreating motion accentuates the vulnerability in their voice, embodying the reluctance and inner conflict conveyed by the dialogue.",
    "emotion": "Fearful",
    "action": "Retreating",
    "keywords": ["step back", "hesitation", "vulnerability", "inner conflict"]
}
        """

        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": sys_msg,
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """
1 - Analyze the following improvisational performance with reference to the audio transcription: '%s'.
2 - For additional context, here is the story told so far: '%s'.
"""
                        % (transcript, story),  # TODO: try different examples
                    },
                ],
            },
            {
                "role": "user",
                "content": [
                    "These are video frames in order.",
                    *map(
                        lambda frame: {
                            "type": "image_url",
                            "image_url": {"url": f"{frame}", "detail": "low"},
                        },
                        frames,
                    ),
                ],
            },
        ]

        if logger:
            logger.debug(f"Messages: {sys_msg}, story: {story}")
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_part_improv(
        self, context, complexity
    ):  # TODO: change randomizer, complexity?
        # Generate a story part based on the motion labeling result
        if logger:
            logger.debug(f"Context in generate_part_improv(): {context}")
        premise = context.get("premise")
        story = context.get("story")
        keypoint = context.get("keypoint")
        who = keypoint[1]
        where = keypoint[2]
        objects = keypoint[3]
        improv = context.get("improv").get("data")
        action = improv.get("action")
        desc = improv.get("description")
        emotion = improv.get("emotion")  # TODO: should we use it?
        transcript = improv.get("transcript")

        ctx = {
            "premise": premise,
            "story": story,
            "action": action,
            "desc": desc,
            "emotion": emotion,
            "transcript": transcript,
            "who": who,
            "where": where,
            "objects": objects,
        }
        if logger:
            logger.debug(f"Ctx in generate_part_improv(): {ctx}")
            logger.debug(
                f"Keypoint in generate_part_improv(): {who}\n{where}\n{objects}"
            )

        length = random.choice([1, 1, 1, 2, 2, 3, 4])
        # settings = [
        #     "Something absurdly good happens to the main character.",
        #     "Something absurdly bad happens to the main character.",
        #     "Introduce a new friendly character.",
        #     "Introduce a new relevant item.",
        #     "Advance the story in time (time skip).",
        #     "Move the story to a new location.",
        #     "Twist something already known.",
        #     "End with a cliffhanger.",
        # ]

        # # Randomly select a setting from the list
        # setting = random.choice(settings)
        # convergence = random.choice([setting, "Direct the story towards the premise."])
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You a great storyteller.
1. Understand the input object, which includes: 
    {
        "premise": The main scenario or conflict of the story,
        "story": The narrative context that has been estabilished so far,
        "action": The primary action to be performed by the main character,
        "desc": A detailed description of a person's action which may involve gestures related to tools or objects,
        "emotion": The emotional state associated with the action,
        "transcript": What was said by the character during the action,
        "who": The characters present in the story told so far,
        "where": The location where the story takes place,
        "objects": The objects present in the story told so far,
    }
Example:
    {
        "premise": "Johnny needs to find out who stole his tuna.",
        "story": "Once upon a time there was a cat named Johnny who loved to eat tuna. One day when Johnny was playing with his toys, he heard a noise coming from the kitchen.",
        "action": "Investigate",
        "desc": "A person looking around as if searching for something."
        "emotion": "Confused",
        "transcript": "Where is it? I heard something.",
        "who": ["Johnny"],
        "where": "kitchen",
        "objects": ["tuna"],
    }
2. Understand the story so far.
3. Continue the story by ensuring that the main character directly performs the action described in "desc" with a strong influence from the "emotion". 
Consider the "transcript" of the character's speech during the action.
The same action should have varied narrative outcomes based on the emotion, e.g.:
    - If the "emotion" is "Friendly", a fist thrown could be a fist bump.
    - If the "emotion" is "Hostile", the same fist might be a punch.
Use any tools or objects implied by the gesture in "desc", integrating them into the narrative. 
Do not describe the character mimicking an action (e.g. "raising his hand to mimic drinking from a cup"). The character must perform the real action (e.g. "He picked up the cup and drank").
For example:
    - If "desc" mentions a person mimicking the action of swinging a hammer, the character should actually use a hammer in the story. 
4. The next story part should be:
    - Not more than %d sentences.
    - Take into account the "who", "where" and "objects" present in the story so far. Omit them only if they are not relevant to the new part.
5. Generate a short visual description of a key moment in the new part:
    - Describe the environment.
    - Do not name the main character.
6. Categorize the sentiment of the new part. Choose from: 'happy', 'sad', 'neutral', 'shocking'.
7. Return as a JSON object.
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.
    
Example JSON object:
{
    "part": {
        "text": "He looked around to investigate as if searching for something and found that someone had stolen his tuna!",
        "keymoment": "A can of tune filled with tuna that is overflowing to the floor in a kitchen."
        "sentiment": "sad",
        "who": ["Johnny"],
        "where": "kitchen",
        "objects": ["tuna"],
    }
}
"""
                        % (length),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(ctx),
                    },
                ],
            },
        ]

        # if logger:
        #     logger.debug(f"Chosen setting: {setting}")
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_story_to_end(self, limit=500):  # TODO: character limit ok?
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You a great storyteller.
1. Create an original story introduction with a limit of %s characters for the "text" field, including:
    - Character: Introduce a main character with a few unique traits.
    - Setting: Describe where the story takes place, incorporating vivid details.
    - Event: Describe an unusual or intriguing situation that the character encounters.
2. Develop the story so that it sets up a decision point or situation the character must respond to, without concluding the story.
3. Generate a visual description of a key moment in this part, capture the atmosphere and scene details.
4. Categorize the sentiment of the new part using one of the following: 'happy', 'sad', 'neutral', 'shocking'.
5. Return as a JSON object.
    - Ensure the "text" field is under %s characters.
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.
    
Example JSON object:
{
    "text": "The young girl, Anna Maria, stood alone in the clearing, clutching the mysterious letter she found in her grandmother's attic.",
    "keymoment": "A quiet clearing surrounded by tall, ancient trees, where faint sunlight filters through, casting shadows on the letter she holds.",
    "sentiment": "neutral",
}
"""
                        % (limit, limit),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(),
                    },
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    def generate_end_hints(self, complexity, n=2):
        # Generate hints to end an improv story
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": f"""
You are a helpful assistant fluent in English. Help me generate some possible endings for a story.
1. Generate {n} elements, each include 4 possible endings to inspire how the story might conclude, using these categories:
    - happy: A joyful or fulfilling resolution.
    - sad: A melancholy or emotional conclusion.
    - absurd: A surreal or comically unexpected turn of events.
    - catastrophic: A disastrous or intense outcome.
2. Use English.
3. Return as a JSON object. 
    - No styling and all in ascii characters.
    - Use double quotes for keys and values.

Example JSON object:
{{
    "list": [
       {{
            "happy": "He uncovers a hidden treasure that brings peace to the town.",
            "sad": "He finds an old letter revealing a tragic family secret.",
            "absurd": "The basement leads to a disco where ghosts are hosting a dance party.",
            "catastrophic": "The passage collapses, trapping him in the haunted house forever."
        }},
    ]
}}
""",
                    }
                ],
            },
        ]

        # if logger:
        #     logger.debug(f"Messsages: {messages}")
        data = self.send_gpt_hq_request(messages, temperature=1.2)
        return self.__get_json_data(data)

    def terminate_story_improv(self, story, improv):
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a skilled storyteller.
1. Review the story provided and the improv performance to understand its direction and user intention.
2. Generate the final part of the story, following the improv's implied direction or intention to reach a satisfying conclusion.
    - Use the improv details and mood to guide the conclusion naturally: %s.
    - Reflect any hints, decisions, or actions from the improv as part of the final story arc.
    - Be true to the user's intentions, don't introduce anything else.
3. Include a short visual description of a key moment in the conclusion.
    - Capture the atmosphere and environment in a vivid scene.
4. Categorize the sentiment of this part using one of the following: 'happy', 'sad', 'neutral', or 'shocking'.
5. Return the response as a JSON object with the following fields:
    - No styling, and use ASCII characters only.
    - Use double quotes for keys and values.

Example JSON object:
{
    "part": {
        "text": "The character finally reached the town, carrying the weight of their journey, ready to start anew.",
        "keymoment": "The sun rises over the quiet town, casting a hopeful light on the character's face as they arrive.",
        "sentiment": "happy",
        "who": ["character"],
        "where": "town",
        "objects": ["satchel", "map"]
    }
}
        """
                        % (improv),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(story),
                    },
                ],
            },
        ]
        data = self.send_gpt_hq_request(
            messages, temperature=0.5
        )  # TODO: change temperature?
        return self.__get_json_data(data)

    def generate_questions(self, max_q=20):
        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": """
You are a creative assistant helping to design a fun, reactivity-based game.
1. Generate %s unique and engaging questions that prompt quick, imaginative responses. Each question should:
    - Be open-ended and encourage creativity.
    - Challenge players to think of "3 things" or similar sets, such as "3 items" or "3 ways."
    - Cover a mix of themes, including daily life, absurd scenarios, emotional situations, or unexpected events.
2. Questions should be short, clear, and easy to understand.
3. Ensure a variety of themes across the questions, such as:
    - Actions: "3 ways to climb up the stairs..."
    - Items: "3 things you would bring to the moon..."
    - Phrases: "3 things to say at a funeral..."
    - Emotions: "3 ways to show someone you care..."
4. Return the questions in a JSON object.
    - Use double quotes for all keys and values.
    - No styling and all in ASCII characters.

Example JSON object:
{
    "questions": [
        {"text": "3 ways to climb up the stairs..."},
        {"text": "3 things you would bring to the moon..."},
        {"text": 3 things to say at a funeral..."},
    ]
}
"""
                        % (max_q),
                    }
                ],
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": str(),
                    },
                ],
            },
        ]
        data = self.send_gpt_hq_request(messages)
        return self.__get_json_data(data)

    # -- LLM Request Functions --

    def send_vision_request(self, request):
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.llm.api_key}",
                "OpenAI-Organization": f"{self.llm.organization}",
            }
            payload = {
                "model": self.vision,
                "messages": request,
                "max_tokens": 4096,
            }
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            if logger:
                logger.debug(
                    f"Successfuly sent 'vision' LLM request with model={self.vision}"
                )
                logger.debug(f"Response = {response.json()}")

            jresponse = response.json()
            return jresponse["choices"][0]["message"]["content"]
        except Exception as e:
            if logger:
                logger.error(str(e) + str(response))
            raise e

    def send_gpt_hq_request(
        self, request, is_json=True, temperature=1.0, presence_penalty=0.0
    ):
        try:
            response = self.llm.chat.completions.create(
                model=self.gpt4,
                messages=request,
                response_format={"type": "json_object"} if is_json else None,
                max_tokens=4096,
                temperature=temperature,
                presence_penalty=presence_penalty,
            )
            if logger:
                logger.debug(
                    f"Successfuly sent 'chat' LLM request with model={self.gpt4}"
                )

            jresponse = json.loads(response.model_dump_json())

            return jresponse["choices"][0]["message"]["content"]
        except Exception as e:
            if logger:
                logger.error(e)
            raise e
        finally:
            if logger:
                logger.debug("Using a model with a higher limit of tokens per minute.")
            try:
                response = self.llm.chat.completions.create(
                    model=self.gpt4mini,
                    messages=request,
                    response_format={"type": "json_object"} if is_json else None,
                    max_tokens=4096,
                    temperature=temperature,
                    presence_penalty=presence_penalty,
                )
                if logger:
                    logger.debug(
                        f"Successfuly sent 'chat' LLM request with model={self.gpt4}"
                    )

                jresponse = json.loads(response.model_dump_json())

                return jresponse["choices"][0]["message"]["content"]
            except Exception as e:
                if logger:
                    logger.error(e)
                raise e

    def send_gpt_lq_request(
        self, request, is_json=True, temperature=1.0, presence_penalty=0.0
    ):
        try:
            response = self.llm.chat.completions.create(
                model=self.gpt4mini,
                messages=request,
                response_format={"type": "json_object"} if is_json else None,
                max_tokens=4096,
                temperature=temperature,
                presence_penalty=presence_penalty,
            )
            if logger:
                logger.debug(
                    f"Successfuly sent 'fast chat' LLM request with model={self.gpt4mini}"
                )

            jresponse = json.loads(response.model_dump_json())

            return jresponse["choices"][0]["message"]["content"]
        except Exception as e:
            if logger:
                logger.error(e)
            raise e

    def send_image_request(self, request):
        try:
            response = self.llm.images.generate(
                model=self.image_gen,
                prompt=request,
                size=IMAGE_GEN_RESOLUTION,
                n=1,
            )
            if logger:
                logger.debug(
                    f"Successfuly sent 'image' LLM request with model={self.image_gen}"
                )

            image_url = response.data[0].url
            return image_url
        except Exception as e:
            if logger:
                logger.error(e)
            raise e

    def send_tts_request(self, text, os="undetermined"):
        # Based on this answer: https://github.com/openai/openai-python/issues/864#issuecomment-1872681672
        url = "https://api.openai.com/v1/audio/speech"
        headers = {
            "Authorization": f"Bearer {self.llm.api_key}",
            "OpenAI-Organization": f"{self.llm.organization}",
        }
        data = {
            "model": self.tts,
            "input": text,
            "voice": "echo",
            "response_format": "mp3" if os == "ios" else "opus",
        }

        with requests.post(url, headers=headers, json=data, stream=True) as response:
            if response.status_code == 200:
                if logger:
                    logger.debug(
                        f"Successfuly sent 'speech' LLM request with model={self.tts}"
                    )
                for chunk in response.iter_content(chunk_size=4096):
                    yield chunk

    def send_stt_request(self, input, translate=False):
        # TODO: Maybe move to file-in-memory approach without saving/opening the file
        with open(input, "rb") as audio_file:
            if translate:
                transcript = self.llm.audio.translations.create(
                    model=self.stt,
                    file=audio_file,
                    response_format="verbose_json",
                )
                if logger:
                    logger.debug(
                        f"Successfuly sent 'voice (translate)' LLM request with model={self.stt}"
                    )
                return transcript.model_dump_json(indent=4)
            else:
                print("Transcribing...")
                transcript = self.llm.audio.transcriptions.create(
                    model=self.stt,
                    file=audio_file,
                    language="en",
                    prompt="This voice recording is from a presentation about reinforcement learning with robots.",
                    response_format="json",
                )
                print("Transcribed")
                if logger:
                    logger.debug(
                        f"Successfuly sent 'voice (transcribe)' LLM request with model={self.stt}"
                    )
                print("Dumping JSON")
                return transcript.model_dump_json(indent=4)
