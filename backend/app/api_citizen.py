from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models import DamageReport
from app import db
from app.utils import log_audit
from app.ml_utils import detect_damage
import os

citizen_bp = Blueprint('citizen', __name__, url_prefix='/api/citizen')


# =====================================================
# ROLE GUARD — CITIZEN ONLY
# =====================================================
@citizen_bp.before_request
@jwt_required()
def ensure_citizen():
    claims = get_jwt()
    if claims.get("role") != "citizen":
        return jsonify({"msg": "Citizens only"}), 403


# =====================================================
# 🔍 DETECT ONLY (PREVIEW — NO DB SAVE)
# =====================================================
@citizen_bp.route('/detect', methods=['POST'])
def detect_only():
    if 'image' not in request.files:
        return jsonify({"msg": "No image"}), 400

    file = request.files['image']
    user_id = get_jwt_identity()

    filename = secure_filename(f"preview_{user_id}_{file.filename}")

    temp_dir = os.path.join(
        current_app.config['UPLOAD_FOLDER'],
        'temp'
    )
    os.makedirs(temp_dir, exist_ok=True)

    path = os.path.join(temp_dir, filename)
    file.save(path)

    damage, confidence = detect_damage(path)

    return jsonify({
        "damage_type": damage,
        "confidence": confidence
    }), 200


# =====================================================
# 📤 FINAL SUBMIT (SAVE IMAGE + DB RECORD)
# =====================================================
@citizen_bp.route('/submit', methods=['POST'])
def submit_report():
    if 'image' not in request.files:
        return jsonify({"msg": "No image"}), 400

    file = request.files['image']
    user_id = get_jwt_identity()

    if file.filename == '':
        return jsonify({"msg": "Empty filename"}), 400

    # -------------------------
    # SAVE IMAGE
    # -------------------------
    filename = secure_filename(f"{user_id}_{file.filename}")

    image_dir = os.path.join(
        current_app.config['UPLOAD_FOLDER'],
        'images'
    )
    os.makedirs(image_dir, exist_ok=True)

    file_path = os.path.join(image_dir, filename)
    file.save(file_path)

    # -------------------------
    # ML INFERENCE
    # -------------------------
    damage_type, confidence = detect_damage(file_path)

    # -------------------------
    # SEVERITY LOGIC
    # -------------------------
    if confidence >= 0.8:
        severity = "high"
    elif confidence >= 0.5:
        severity = "medium"
    else:
        severity = "low"

    # -------------------------
    # CREATE DB RECORD
    # IMPORTANT: store ONLY filename
    # -------------------------
    report = DamageReport(
        citizen_id=user_id,
        image_path=filename,  # 👈 critical for /api/files/images/<filename>
        location=request.form.get("location"),
        latitude=request.form.get("latitude", type=float),
        longitude=request.form.get("longitude", type=float),
        detected_damage_type=damage_type,
        confidence_score=confidence,
        severity=severity,
        status="submitted"
    )

    db.session.add(report)
    db.session.commit()

    # -------------------------
    # AUDIT LOG
    # -------------------------
    log_audit(
        user_id,
        f"SUBMIT_DAMAGE_REPORT {report.id}"
    )

    return jsonify({
        "msg": "Report submitted successfully",
        "report_id": report.id
    }), 201
