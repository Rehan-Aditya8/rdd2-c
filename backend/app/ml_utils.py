import os
import logging
from ultralytics import YOLO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model = None

def load_model():
    global model
    if model is None:
        try:
            backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
            root_dir = os.path.dirname(backend_dir)
            model_path = os.path.join(root_dir, 'model', 'best.pt')

            if not os.path.exists(model_path):
                logger.error(f"YOLO model not found at {model_path}")
                return

            logger.info(f"Loading YOLO model from {model_path}...")
            model = YOLO(model_path)
            logger.info("YOLO model loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading YOLO model: {e}")
            model = None

def detect_damage(image_path):
    global model
    if model is None:
        load_model()

    if model is None:
        logger.warning("Detection failed: Model is not loaded.")
        return "Model Error", 0.0

    try:
        if not os.path.exists(image_path):
            logger.error(f"Image not found: {image_path}")
            return "Image Not Found", 0.0

        results = model(image_path)

        best_class = "No Damage"
        best_conf = 0.0

        for r in results:
            if hasattr(r, 'boxes') and r.boxes:
                for box in r.boxes:
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    class_name = model.names[cls_id]

                    if conf > best_conf:
                        best_conf = conf
                        best_class = class_name

        return best_class, best_conf
    except Exception as e:
        logger.error(f"Error during damage detection: {e}")
        return "Detection Error", 0.0
