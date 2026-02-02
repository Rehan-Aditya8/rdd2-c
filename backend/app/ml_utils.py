import os
from ultralytics import YOLO

model = None

def load_model():
    global model
    if model is None:
        backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
        root_dir = os.path.dirname(backend_dir)
        model_path = os.path.join(root_dir, 'model', 'best.pt')

        if not os.path.exists(model_path):
            print("YOLO model not found")
            return

        print("Loading YOLO model...")
        model = YOLO(model_path)

def detect_damage(image_path):
    global model
    if model is None:
        load_model()

    if model is None:
        return "Model Error", 0.0

    results = model(image_path)

    best_class = "No Damage"
    best_conf = 0.0

    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            class_name = model.names[cls_id]

            if conf > best_conf:
                best_conf = conf
                best_class = class_name

    return best_class, best_conf
