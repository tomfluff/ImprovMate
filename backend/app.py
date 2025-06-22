import base64
import io
import os, sys
import random
import uuid
from flask import Flask, jsonify, request, send_file, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import save_base64_image, logger_setup, get_mimetype, sample_frames
from config import *
from llm import Storyteller

load_dotenv()

# Specify the static folder path
app = Flask(__name__)
# CORS(app)
CORS(app, origins=["*"])  # All origins allowed

# Get the environment variables
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
OPENAI_ORG_ID = os.environ.get("OPENAI_ORG_ID")

PORT = os.environ.get("FLASK_PORT", 8080)
HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
DEBUG = os.environ.get("FLASK_DEBUG", "False").lower() in ("true", "1", "t")
LOGGER = os.environ.get("LOGGER", "False").lower() in ("true", "1", "t")
STORAGE_PATH = "static"

if LOGGER:
    logger = logger_setup("app", os.path.join(LOG_FOLDER, "app.log"), debug=DEBUG)
    logger.debug("Logger initialized!")
    # logger.debug(f"Environment variables: {os.environ}")
else:
    logger = None


# Initialize the storyteller
llm = Storyteller(OPENAI_API_KEY, OPENAI_ORG_ID)


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Hello, user! This is ImprovMate API!"})

@app.route("/api")
def index():
    # Return a json response representing the API, with the available endpoints
    response = dict(
        {
            "prefix": "/api",
            "endpoints": {
                "image": {
                    "methods": ["POST", "GET"],
                    "description": "Save and retrieve images",
                },
                "character": {
                    "methods": ["POST", "GET"],
                    "description": "Generate and retrieve characters",
                },
                "session": {
                    "methods": ["GET"],
                    "description": "Initialize and retrieve sessions",
                },
                "story/premise": {
                    "methods": ["POST"],
                    "description": "Generate a story premise",
                },
                "story/part": {
                    "methods": ["POST"],
                    "description": "Generate a story part",
                },
                "story": {
                    "methods": ["GET"],
                    "description": "Initialize a story",
                },
                "story/actions": {
                    "methods": ["POST"],
                    "description": "Generate story actions",
                },
                "read": {
                    "methods": ["POST"],
                    "description": "Read text using the API",
                },
            },
        }
    )
    # Sort the endpoints by name
    response["endpoints"] = dict(sorted(response["endpoints"].items()))
    return jsonify(type="success", message="API available", status=200, data=response)


@app.route("/api/image", methods=["POST"])
def image_save():
    os.makedirs(STORAGE_PATH, exist_ok=True)
    # Save the base64 image
    if logger:
            logger.debug("Request in image_save:", request)
    data = request.get_json()

    base64_url = data["image"]
    img_data = base64_url.split(",", 1)[1]
    img_type = data["type"]

    if not base64_url:
        if logger:
            logger.error("No image found in the request!")
            logger.debug(data)
        return jsonify(type="error", message="No image found!", status=400)

    if img_type not in APP_IMAGE_EXT:
        if logger:
            logger.error("Invalid image type!")
            logger.debug(data)
        return jsonify(type="error", message="Invalid image type!", status=400)

    img_fname = f"img_{uuid.uuid4().hex}.{img_type}"
    img_path = os.path.join(STORAGE_PATH, img_fname)
    save_base64_image(img_data, img_path)

    if logger:
        logger.info(f"Image saved: {img_path}")
    return jsonify(type="success", message="Image saved!", status=200, name=img_fname)


@app.route("/api/image/<img_name>", methods=["GET"])
def image_get(img_name):
    # Get the base64 image
    img_path = os.path.join(STORAGE_PATH, img_name)
    img_type = img_name.split(".")[-1]

    if not os.path.exists(img_path):
        if logger:
            logger.error(f"Image not found: {img_path}")
        return jsonify(type="error", message="Image not found!", status=404)

    if logger:
        logger.info(f"Image sent: {img_path}")
    return send_file(img_path, mimetype=f"image/{img_type}")


@app.route("/api/character", methods=["POST"])
def character_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)

        complexity = data.get("complexity", None)
        context = data.get("context", None)
        image = context["image"]
        if not image:
            if logger:
                logger.error("No image found in the request!")
                logger.debug(data)
            return jsonify(type="error", message="No image found!", status=400)

        result = llm.generate_character(image, complexity)
        return jsonify(
            type="success",
            message="Character generated!",
            status=200,
            data={
                "id": uuid.uuid4(),
                "image": {"src": image, **result["image"]},
                "character": {**result["character"]},
            },
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/character/<char_id>", methods=["GET"])
def character_get(char_id):
    pass


@app.route("/api/session", methods=["GET"])
def session_init():
    try:
        session_id = uuid.uuid4()
        if logger:
            logger.info(f"Session initialized: {session_id}")
        return jsonify(
            type="success",
            message="Session initialized!",
            status=200,
            data={"id": session_id},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/session/<session_id>", methods=["GET"])
def session_get(session_id):
    pass


@app.route("/api/story/premise", methods=["POST"])
def premise_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)

        complexity = data.get("complexity", None)
        context = data.get("context", None)

        context = {
            "name": context["fullname"],
            "about": context["backstory"],
        }

        result = llm.generate_premise(
            context,
            complexity,
            PREMISE_GEN_COUNT,
        )
        if logger:
            logger.debug(f"Story premise generated: {result}")
        return jsonify(
            type="success",
            message="Story premise generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/hints", methods=["POST"])
def init_hints_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)

        if logger:
            logger.debug(f"Data in end_hints_gen: {data}")
        complexity = data.get("context").get("complexity", None)
        language = data.get("language", None)
        if logger:
            logger.debug(f"Complexity: {complexity}, Language: {language}")

        result = llm.generate_init_hints(
            complexity,
            language,
            HINTS_GEN_COUNT,
        )
        
        if logger:
            logger.debug(f"Initial hints generated: {result}")
        return jsonify(
            type="success",
            message="Initial hints generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/part", methods=["POST"])
def storypart_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)

        complexity = data.get("complexity", None)
        context = data.get("context", None)

        result = llm.generate_story_part(context, complexity)
        part_id = uuid.uuid4()
        if logger:
            logger.debug(f"Story part generated: {result}")
        part = result["part"]
        return jsonify(
            type="success",
            message="Story part generated!",
            status=200,
            data={"id": part_id, **part},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/init", methods=["POST"])
def story_init():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)

        complexity = data.get("complexity", None)
        context = data.get("context", None)

        context = {
            "setting": context["desc"],
            "protagonist": {
                "name": context["fullname"],
                "about": context["backstory"],
            },
        }

        result = llm.initialize_story(context, complexity)
        story_id = uuid.uuid4()
        part_id = uuid.uuid4()
        if logger:
            logger.info(f"Story initialized!")

        return jsonify(
            type="success",
            message="Story initialized!",
            status=200,
            data={"id": story_id, "parts": [{"id": part_id, **result}]},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/end", methods=["POST"])
def story_end():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)

        print(data)
        complexity = data.get("complexity", None)
        context = data.get("context", None)

        result = llm.terminate_story(context, complexity)
        if logger:
            logger.info(f"Story ended!")
        part = result["part"]
        part_id = uuid.uuid4()
        return jsonify(
            type="success",
            message="Story ended!",
            status=200,
            data={"id": part_id, **part},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/actions", methods=["POST"])
def actions_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)

        complexity = data.get("complexity", None)
        context = data.get("context", None)

        result = llm.generate_actions(context, complexity, ACTION_GEN_COUNT)
        actions = result["list"]
        actions = random.sample(actions, ACTION_GEN_COUNT)
        actions.append(
            {
                "title": "Improvise",
                "desc": "Use your improvisation to progress the story!",
            }
        )
        actions.append(
            {
                "title": "Ending",
                "desc": "Bring the story to an end and see what happens!",
            }
        )
        actions = [{"id": uuid.uuid4(), **a, "active": True, "isImprov": a["title"] == "Improvise"} for a in actions]
        if logger:
            logger.debug(f"Story actions generated: {actions}")
        return jsonify(
            type="success",
            message="Story actions generated!",
            status=200,
            data={"list": actions},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500
    
    
@app.route("/api/story/motion", methods=["POST"])
def process_motion(): 
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        
        frames = data.get("frames", None)
        if not frames:
            if logger:
                logger.error("No frames found in the request!")
            return jsonify(type="error", message="No frames found!", status=400)
        
        story = data.get("story", None)
        if not story:
            if logger:
                logger.error("No story found in the request!")
            return jsonify(type="error", message="No story found!", status=400)

        result = llm.process_motion(frames, story)
        if logger:
            logger.debug(f"Motion processed: {result}")
        return jsonify(
            type="success",
            message="Motion processed!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/speech-to-text", methods=["POST"])
def speech_to_text():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            logger.debug(f"Data received by speech-to-text().")

        audio = data.get("audio")
        language = data.get("language")
        if not language:
            if logger:
                logger.error("No language found in the request!")
            return jsonify(type="error", message="No language found!", status=400)
        
        audio_data = base64.b64decode(audio.split(",")[1])
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "audio.webm"
        
        result = llm.speech_to_text(audio_file, language)
        
        result_dict = result.to_dict() if hasattr(result, 'to_dict') else result.__dict__

        if logger:
            logger.debug(f"Speech to text: {result}")
        return jsonify(
            type="success",
            message="Speech to text!",
            status=200,
            data=result_dict,
        )
    except Exception as e:
        if logger:
            logger.error(f"Error in stt: {str(e)} {result}")
        return jsonify({"error": str(e)}), 500

    
@app.route("/api/story/startingimprov", methods=["POST"])
def starting_improv(): # TODO: SIMILAR TO PROCESS MOTION
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            logger.debug(f"Data received by starting_improv(): {data}")
            # logger.debug(f"Data received by starting_improv().")
            
        frames = data.get("frames")
        if not frames:
            if logger:
                logger.error("No frames found in the request!")
            return jsonify(type="error", message="No frames found!", status=400)
       
        transcript = data.get("audioResult").get("data").get("text")
        # if not transcript:
        #     if logger:
        #         logger.error(f"No transcript found in the request! {data}")
        #     return jsonify(type="error", message="No transcript found!", status=400)
        if logger:
            logger.debug(f"Transcript received by starting_improv(): {transcript}")

        hints = data.get("hints")
        language = data.get("language", None)
        end = data.get("end", False)

        result = llm.process_improv_noctx(end, frames, hints, transcript, language)
        result["transcript"] = transcript
        if logger:
            logger.debug(f"Starting improv result: {result}")
        return jsonify(
            type="success",
            message="Starting improv!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(f"Error in starting_improv: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/process_improv", methods=["POST"])
def process_improv(): # TODO: SIMILAR TO starting_improv(frames, transcript) + motionpart_gen(context)
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            # logger.debug(f"Data received by starting_improv(): {data}")
            logger.debug(f"Data received by starting_improv().")
            
        frames = data.get("frames")
        if not frames:
            if logger:
                logger.error("No frames found in the request!")
            return jsonify(type="error", message="No frames found!", status=400)
       
        transcript = data.get("audioResult").get("data").get("text")
        # if not transcript:
        #     if logger:
        #         logger.error(f"No transcript found in the request! {data}")
        #     return jsonify(type="error", message="No transcript found!", status=400)
        if logger:
            logger.debug(f"Transcript received by starting_improv(): {transcript}")
            
        story = data.get("story")
        if not story:
            if logger:
                logger.error("No story found in the request!")
            return jsonify(type="error", message="No story found!", status=400)

        hints = data.get("hints")
        language = data.get("language", None)
        end = data.get("end", False)

        result = llm.process_improv_ctx(end, frames, story, hints, transcript, language)
        result["transcript"] = transcript
        if logger:
            logger.debug(f"Process improv result: {result}")
        return jsonify(
            type="success",
            message="Starting improv!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(f"Error in starting_improv: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
    
@app.route("/api/story/improvpart", methods=["POST"])
def storypart_from_improv():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            logger.debug(f"Data received by motionpart_gen(): {data}")
            
        complexity = data.get("complexity", None)
        context = data.get("context", None)
        
        result = None
        retry_count = 0
        while result is None and retry_count < 3:
            result = llm.generate_part_improv(context, complexity)
            retry_count += 1
            if result is None and logger:
                logger.warning(f"Retrying generate_part_improv, attempt {retry_count}")
        part_id = uuid.uuid4()
        if logger:
            logger.debug(f"Story part generated: {result}")
        part = result["part"]
        return jsonify(
            type="success",
            message="Story part generated!",
            status=200,
            data={"id": part_id, **part},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500
        
    
@app.route("/api/story/improvpremise", methods=["POST"])
def premise_from_improv():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            logger.debug(f"Data received by premise_from_improv(): {data}")
        
        improv = data.get("improv")
        transcript = improv.get("data").get("transcript")
        # if not transcript:
        #     if logger:
        #         logger.error("No transcript found in the request!")
        #     return jsonify(type="error", message="No data found!", status=400)
        
        desc = improv.get("data").get("description")
        if not desc:
            if logger:
                logger.error("No description found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        
        emot = improv.get("data").get("emotion")
        if not emot:
            if logger:
                logger.error("No emotion found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        
        keyw = improv.get("data").get("keywords")
        if not keyw:
            if logger:
                logger.error("No keywords found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        
        motion = {"description": desc, "emotion": emot, "keywords": keyw}               
        if logger:
            logger.debug(f"Transcript and motion received by premise_from_improv(): {transcript} {motion}")  
    
        hints = data.get("hints")
        language = data.get("language", None)
        end = data.get("end", False)

        character = llm.generate_character_improv(transcript, motion, hints, language, end)    
        result = llm.generate_premise_improv(transcript, motion, character)
        result["character"] = character
        # image = llm.generate_character_image_improv(character)
        # result["image"] = image
        result["id"] = uuid.uuid4()
        
        if logger:
            logger.debug(f"Premise and character generated: {result}")
        return jsonify(
            type="success",
            message="Story part generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/improv_all", methods=["POST"])
def character_premise_from_improv():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            logger.debug(f"Data received by premise_from_improv(): {data}")

        audio = data.get("audio").get("audio")
        if logger:
            logger.debug(f"Audio received by premise_from_improv(): {audio}")
        language = data.get("audio").get("language")
        if not language:
            if logger:
                logger.error("No language found in the request!")
            return jsonify(type="error", message="No language found!", status=400)
        
        audio_data = base64.b64decode(audio.split(",")[1])
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "audio.webm"
        
        result = llm.speech_to_text(audio_file, language)
        
        result_dict = result.to_dict() if hasattr(result, 'to_dict') else result.__dict__
        if logger:
            logger.debug(f"Transcript: {result}")

        frames = data.get("frames")
        hints = data.get("hints")
        language = data.get("language", None)
        end = data.get("end", False)

        result = llm.generate_character_premise_improv(result_dict, frames, hints, language, end)
        result["id"] = uuid.uuid4()
        
        if logger:
            logger.debug(f"Premise and character generated: {result}")
        return jsonify(
            type="success",
            message="Story part generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/story_improv_all", methods=["POST"])
def story_from_improv():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            logger.debug(f"Data received by premise_from_improv(): {data}")

        audio = data.get("audio").get("audio")
        if logger:
            logger.debug(f"Audio received by premise_from_improv(): {audio}")
        language = data.get("audio").get("language")
        if not language:
            if logger:
                logger.error("No language found in the request!")
            return jsonify(type="error", message="No language found!", status=400)
        
        audio_data = base64.b64decode(audio.split(",")[1])
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "audio.webm"
        
        result = llm.speech_to_text(audio_file, language)
        
        result_dict = result.to_dict() if hasattr(result, 'to_dict') else result.__dict__
        if logger:
            logger.debug(f"Transcript: {result}")

        frames = data.get("frames")
        hints = data.get("hints")
        language = data.get("language", None)
        end = data.get("end", False)
        story = data.get("story")
        premise = data.get("premise")
        keypoint = data.get("keypoint")

        result = llm.generate_story_improv(result_dict, frames, story, premise, keypoint, hints, language, end)
        result["id"] = uuid.uuid4()
        
        if logger:
            logger.debug(f"Story part generated: {result}")
        return jsonify(
            type="success",
            message="Story part generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500
    

@app.route("/api/story/end_improv_all", methods=["POST"])
def end_from_improv():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            logger.debug(f"Data received by premise_from_improv(): {data}")

        audio = data.get("audio").get("audio")
        if logger:
            logger.debug(f"Audio received by premise_from_improv(): {audio}")
        language = data.get("audio").get("language")
        if not language:
            if logger:
                logger.error("No language found in the request!")
            return jsonify(type="error", message="No language found!", status=400)
        
        audio_data = base64.b64decode(audio.split(",")[1])
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "audio.webm"
        
        result = llm.speech_to_text(audio_file, language)
        
        result_dict = result.to_dict() if hasattr(result, 'to_dict') else result.__dict__
        if logger:
            logger.debug(f"Transcript: {result}")

        frames = data.get("frames")
        hints = data.get("hints")
        language = data.get("language", None)
        end = data.get("end", True)
        story = data.get("story")
        premise = data.get("premise")
        keypoint = data.get("keypoint")
        exercise = data.get("exercise")

        if exercise:
            result = llm.generate_ending_improv(result_dict, frames, story, premise, keypoint, hints, language, end)
        else: 
            result = llm.generate_ending_exercise_improv(result_dict, frames, story, hints, language, end)
        result["id"] = uuid.uuid4()
        
        if logger:
            logger.debug(f"Ending generated: {result}")
        return jsonify(
            type="success",
            message="Ending generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/character_image", methods=["POST"])
def gen_character_img():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        
        character = data.get("character")
        if not character:
            if logger:
                logger.error("No character found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        
        result = llm.generate_character_image_improv(character)
        if logger:
            logger.debug(f"Character image generated: {result}")
        return jsonify(
            type="success",
            message="Story image generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500
    

@app.route("/api/story/image", methods=["POST"])
def storyimage_gen(): #TODO: retry if error?
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)

        result = llm.generate_story_image(data)
        if logger:
            logger.debug(f"Story image generated: {result}")
        return jsonify(
            type="success",
            message="Story image generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        try:
            result = llm.generate_story_image(data)
            if logger:
                logger.debug(f"Story image generated on retry: {result}")
            return jsonify(
                type="success",
                message="Story image generated on retry!",
                status=200,
                data={**result},
            )
        except Exception as e:
            if logger:
                logger.error(str(e))
            return jsonify({"error": str(e)}), 500


@app.route("/api/practice/generate_storytoend", methods=["POST"])
def generate_story_to_end():
    try:
        if logger:
            logger.debug(f"Generating story to end...")
        result = llm.generate_story_to_end()
        story_id = uuid.uuid4()
        part_id = uuid.uuid4()
        if logger:
            logger.info(f"Ending generated!")

        return jsonify(
            type="success",
            message="Ending generated!",
            status=200,
            data={"id": story_id, "parts": [{"id": part_id, **result}]},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/end_hints", methods=["POST"])
def end_hints_gen():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)

        if logger:
            logger.debug(f"Data in end_hints_gen: {data}")
        complexity = data.get("context").get("complexity", None)
        language = data.get("language", None)
        if logger:
            logger.debug(f"Complexity: {complexity}, Language: {language}")

        result = llm.generate_end_hints(
            complexity,
            language,
            HINTS_GEN_COUNT,
        )
        
        if logger:
            logger.debug(f"Ending hints generated: {result}")
        return jsonify(
            type="success",
            message="Initial hints generated!",
            status=200,
            data={**result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/story/end_story_improv", methods=["POST"])
def end_story_improv():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            logger.debug(f"Generating ending...")
        
        improv = data.get("improv")
        if not improv:
            if logger:
                logger.error("No improv found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        
        story = data.get("story")
        if not story:
            if logger:
                logger.error("No previous story part found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        
        result = llm.terminate_story_improv(story, improv)
        if logger:
            logger.info(f"Ending generated!")
            
        part_id = uuid.uuid4()
        part = result["part"]
        return jsonify(
            type="success",
            message="Story part generated!",
            status=200,
            data={"id": part_id, **part},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/practice/generate_questions", methods=["POST"])
def generate_questions():
    try:
        data = request.get_json()
        if not data:
            if logger:
                logger.error("No data found in the request!")
            return jsonify(type="error", message="No data found!", status=400)
        if logger:
            logger.debug(f"Generating questions...")
            
        max_q = data.get("maxQ", 20)

        result = llm.generate_questions(max_q)
        if logger:
            logger.info(f"Questions generated: {result}")
        story_id = uuid.uuid4()
        parts = [{"id": uuid.uuid4(), **result["questions"][i]} for i in range(0, max_q)]
        if logger:
            logger.info(f"Parts: {parts}")

        return jsonify(
            type="success",
            message="Questions generated!",
            status=200,
            data={"id": story_id, "parts": parts},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/translate", methods=["GET"])
def translate_text():
    try:
        text = request.args.get("text")
        src_lang = request.args.get("src_lang")
        tgt_lang = request.args.get("tgt_lang")

        if src_lang == tgt_lang:
            if logger:
                logger.debug("No translation needed!")
            return jsonify(
                type="success",
                message="No translation needed!",
                status=200,
                data={"text": text},
            )

        if logger:
            logger.debug(f"Translating text from {src_lang} to {tgt_lang}")
        result = llm.translate_text(text, src_lang, tgt_lang)
        return jsonify(
            type="success",
            message="Text translated!",
            status=200,
            data={"text": result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/translate_keypoints", methods=["GET"])
def translate_keypoints():
    try:
        keypoints = request.args.get("keypoints")
        src_lang = request.args.get("src_lang")
        tgt_lang = request.args.get("tgt_lang")

        if src_lang == tgt_lang:
            if logger:
                logger.debug("No translation needed!")
            return jsonify(
                type="success",
                message="No translation needed!",
                status=200,
                data={"text": text},
            )

        if logger:
            logger.debug(f"Translating keypoints from {src_lang} to {tgt_lang}: {keypoints}")
        result = llm.translate_keypoints(keypoints, src_lang, tgt_lang)
        return jsonify(
            type="success",
            message="Keypoints translated!",
            status=200,
            data={"text": result},
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/api/read", methods=["GET"])
def read_text():
    try:
        text = request.args.get("text")
        os = request.args.get("os", "undetermined")
        if logger:
            logger.debug(f"Generating speech for: {text}")

        mimetype = get_mimetype(os)
        return Response(
            stream_with_context(llm.send_tts_request(text, os)),
            mimetype=mimetype,
        )
    except Exception as e:
        if logger:
            logger.error(str(e))
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def not_found(e):
    return jsonify(type="error", message="Not found!", status=404)


if __name__ == "__main__":
    app.run(host=HOST, port=int(PORT), debug=DEBUG)
