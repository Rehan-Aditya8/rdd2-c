from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.ml_utils import detect_damage_with_frame

import base64
import cv2
import numpy as np


dashcam_bp = Blueprint(
    "dashcam",
    __name__,
    url_prefix="/api/dashcam"
)


@dashcam_bp.route("/detect-frame", methods=["POST"])
@jwt_required()
def detect_frame():
    """
    Realtime dashcam detection endpoint.
    Receives base64 frame → runs ML detection → returns result.
    No disk I/O for speed.
    """

    data = request.get_json()

    if not data or "frame" not in data:
        return jsonify({"msg": "No frame provided"}), 400

    try:
        frame_data = data["frame"]

        # Remove base64 header if present
        if "," in frame_data:
            frame_data = frame_data.split(",")[1]

        # Decode base64 → numpy image
        frame_bytes = base64.b64decode(frame_data)
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"msg": "Failed to decode frame"}), 400

        # Resize for faster inference
        frame = cv2.resize(frame, (416, 416))

        # Run detection
        damage, confidence, annotated_b64 = detect_damage_with_frame(frame)

        detected = damage not in (
            "No Damage",
            "Model Error",
            "Detection Error",
            "Image Not Found",
        )

        return jsonify({
            "damage_type": damage,
            "confidence": round(confidence, 3),
            "detected": detected,
            "annotated_image": annotated_b64
        }), 200

    except Exception as e:
        return jsonify({"msg": str(e)}), 500