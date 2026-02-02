from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from datetime import timedelta

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# =================================================
# HARD-CODED USERS (DEV MODE ONLY — NO DATABASE)
# =================================================
USERS = {
    "citizen@test.com": {
        "id": "1",
        "password": "password_citizen",
        "role": "citizen",
        "name": "Test Citizen"
    },
    "official@test.com": {
        "id": "2",
        "password": "password_official",
        "role": "official",
        "name": "Test Official"
    }
}

# =================================================
# LOGIN
# =================================================
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"msg": "Missing JSON body"}), 400

    email = data.get("email")
    password = data.get("password")

    user = USERS.get(email)

    if not user or user["password"] != password:
        return jsonify({"msg": "Invalid credentials"}), 401

    claims = {"role": user["role"]}

    access_token = create_access_token(
        identity=user["id"],
        additional_claims=claims,
        expires_delta=timedelta(days=1)
    )

    return jsonify(
        access_token=access_token,
        role=user["role"],
        name=user["name"]
    ), 200

# =================================================
# CURRENT USER
# =================================================
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    claims = get_jwt()

    user = next(
        (u for u in USERS.values() if u["id"] == user_id),
        None
    )

    if not user:
        return jsonify({"msg": "User not found"}), 404

    return jsonify(
        id=user_id,
        email="hardcoded",
        role=claims["role"],
        name=user["name"]
    ), 200
