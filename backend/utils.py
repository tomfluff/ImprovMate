import base64
import os
from PIL import Image
from io import BytesIO
import logging
import cv2


def base64_encode_file(image_path):
    # Encode image to base64
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def base64_image_url(image_path):
    # Encode image to base64 and create a base64 url
    base64_drawing = base64_encode_file(image_path)
    base64_url = f"data:image/jpeg;base64,{base64_drawing}"
    return base64_url


def save_base64_image(base64_string, save_path):
    # Decode the base64 string and save the image file locally
    image_data = base64.b64decode(base64_string)
    image = Image.open(BytesIO(image_data))
    image.save(save_path)

def logger_setup(name, location, debug=False):
    os.makedirs(os.path.dirname(location), exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG if debug else logging.INFO)
    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s]: %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler = logging.StreamHandler(stream=open(location, "w"))
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger


def get_mimetype(os):
    # Get the mime type of a file
    mime_type = "audio/ogg"
    if os == "ios":
        mime_type = "audio/mpeg"
    return mime_type

def sample_frames(video_blob, n_frames=10):
    # Initialize video capture from the video blob
    video = cv2.VideoCapture(video_blob)
    
    # Get the total number of frames in the video
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Calculate the interval between frames to sample
    interval = max(total_frames // n_frames, 1)
    
    sampled_frames = []
    
    for i in range(0, total_frames, interval):
        # Set the video position to the i-th frame
        video.set(cv2.CAP_PROP_POS_FRAMES, i)
        
        # Read the frame
        ret, frame = video.read()
        
        if not ret:
            break
        
        # Encode the frame to base64
        _, buffer = cv2.imencode('.jpg', frame)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        sampled_frames.append(frame_base64)
        
        # Stop if we have sampled enough frames
        if len(sampled_frames) >= n_frames:
            break
    
    # Release the video capture object
    video.release()
    
    return sampled_frames