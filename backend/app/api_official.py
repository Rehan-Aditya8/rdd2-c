from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.models import DamageReport
from app import db
from app.utils import log_audit

official_bp = Blueprint('official', __name__, url_prefix='/api/official')


# =====================================================
# ROLE GUARD — OFFICIAL ONLY
# =====================================================
@official_bp.before_request
@jwt_required()
def ensure_official():
    claims = get_jwt()
    if claims.get("role") != "official":
        return jsonify({"msg": "Officials only"}), 403


# =====================================================
# REPORTS — REAL DATA (USED NOW)
# =====================================================

@official_bp.route('/reports', methods=['GET'])
def get_all_reports():
    """
    Used by:
    - work-reports.html
    - dashboard KPIs
    """
    reports = DamageReport.query.order_by(
        DamageReport.created_at.desc()
    ).all()

    return jsonify([
        {
            "id": r.id,
            "location": r.location,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "damage_type": r.detected_damage_type,
            "confidence": r.confidence_score,
            "severity": r.severity,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "image_url": f"/api/files/images/{r.image_path}"
        }
        for r in reports
    ]), 200


@official_bp.route('/reports/<report_id>', methods=['GET'])
def get_report(report_id):
    """
    Used by:
    - verification.html
    """
    report = DamageReport.query.get(report_id)
    if not report:
        return jsonify({"msg": "Report not found"}), 404

    return jsonify({
        "id": report.id,
        "location": report.location,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "damage_type": report.detected_damage_type,
        "confidence": report.confidence_score,
        "severity": report.severity,
        "status": report.status,
        "created_at": report.created_at.isoformat(),
        "image_url": f"/api/files/images/{report.image_path}",
        "reported_by": "Citizen"  # replace later with user lookup
    }), 200


# =====================================================
# VERIFICATION — REAL DATA (USED NOW)
# =====================================================

@official_bp.route('/reports/<report_id>/verify', methods=['POST'])
def verify_report(report_id):
    """
    Approve / Reject report
    """
    data = request.get_json() or {}
    decision = data.get("status")   # approved | rejected
    reason = data.get("reason", "")

    if decision not in ["approved", "rejected"]:
        return jsonify({"msg": "Invalid status"}), 400

    report = DamageReport.query.get(report_id)
    if not report:
        return jsonify({"msg": "Report not found"}), 404

    report.status = decision
    report.verified_by = get_jwt_identity()

    db.session.commit()

    log_audit(
        get_jwt_identity(),
        f"VERIFY_REPORT {decision.upper()} {report_id} | {reason}"
    )

    return jsonify({"msg": f"Report {decision}"}), 200


# =====================================================
# ASSIGNMENT — PARTIAL (STATUS REAL, CONTRACTOR LATER)
# =====================================================

@official_bp.route('/reports/<report_id>/assign', methods=['POST'])
def assign_work(report_id):
    """
    Status update is real.
    Contractor linkage will be added later.
    """
    data = request.get_json() or {}
    contractor_id = data.get("contractor_id")

    report = DamageReport.query.get(report_id)
    if not report:
        return jsonify({"msg": "Report not found"}), 404

    report.status = "assigned"
    db.session.commit()

    log_audit(
        get_jwt_identity(),
        f"ASSIGN_WORK report={report_id} contractor={contractor_id}"
    )

    return jsonify({"msg": "Work assigned"}), 200


# =====================================================
# CONTRACTORS — PLACEHOLDER (INTENTIONAL)
# =====================================================
@official_bp.route('/contractors', methods=['GET'])
def get_contractors():
    """
    Placeholder.
    Replace with Contractor model later.
    """
    return jsonify([
        {"id": "C1", "name": "ABC Road Works", "specialization": "Potholes", "rating": 4.5},
        {"id": "C2", "name": "XYZ Infra", "specialization": "Resurfacing", "rating": 4.8},
        {"id": "C3", "name": "City Builders", "specialization": "General", "rating": 4.2}
    ]), 200


# =====================================================
# SECTORS — PLACEHOLDER
# =====================================================
@official_bp.route('/sectors', methods=['GET'])
def get_sectors():
    """
    Placeholder.
    Sector table can be added later.
    """
    return jsonify([
        {"id": "S1", "name": "Sector 1 (North)"},
        {"id": "S2", "name": "Sector 2 (South)"},
        {"id": "S3", "name": "Sector 3 (East)"},
        {"id": "S4", "name": "Sector 4 (West)"}
    ]), 200


# =====================================================
# ANALYTICS — PLACEHOLDER
# =====================================================
@official_bp.route('/analytics', methods=['GET'])
def get_analytics():
    """
    Placeholder.
    Will be replaced with DB aggregation queries.
    """
    return jsonify({
        "summary": {
            "total_reports": 156,
            "completed_repairs": 142,
            "avg_repair_time": 2.8,
            "total_spent": "2.4M"
        },
        "repair_time": [
            {"sector": "S1", "days": 3.2},
            {"sector": "S2", "days": 2.1},
            {"sector": "S3", "days": 4.5},
            {"sector": "S4", "days": 1.8}
        ],
        "contractors": [
            {"name": "ABC Road Works", "score": 92},
            {"name": "XYZ Infra", "score": 88},
            {"name": "City Builders", "score": 75}
        ],
        "health_index": [
            {"sector": "S1", "index": 8.5, "status": "Good"},
            {"sector": "S2", "index": 6.0, "status": "Fair"},
            {"sector": "S3", "index": 4.5, "status": "Poor"},
            {"sector": "S4", "index": 9.0, "status": "Excellent"}
        ]
    }), 200
