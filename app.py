from flask import Flask, jsonify, request
import sqlite3
import json
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis
import os
from dotenv import load_dotenv

load_dotenv()

cache = redis.Redis(host="redis", port=6379, decode_responses=True)
app = Flask(__name__)
CORS(app)
API_KEY = os.getenv("API_KEY")

limiter = Limiter(get_remote_address, app=app, default_limits=["30 per minute"], storage_uri="redis://redis:6379")

@app.route("/issue/<int:issue_id>")
def get_issue(issue_id):

    cache_key = f"issue:{issue_id}"
    cached = cache.get(cache_key)
    if cached:
        with open("app.log", "a") as log_file:
            log_file.write(f'Read {issue_id} from cache')
        return jsonify(json.loads(cached))

    conn = sqlite3.connect("issues.db")
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT issue_number, title, choice_effects FROM issues WHERE issue_number = ?", (issue_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return {"error": "Not found"}, 404

    options = json.loads(row["choice_effects"])

    res = {
        "number": row["issue_number"],
        "title": row["title"],
        "options": options
    }

    cache.setex(cache_key, 3600, json.dumps(res))
    with open("app.log", "a") as log_file:
        log_file.write(f'Read {issue_id} from db')

    return jsonify(res)

@app.route("/cache/invalidate", methods=["POST"])
def invalidate_cache():
    auth = request.headers.get("Authorization")
    if auth != f"Bearer {API_KEY}":
        return {"error": "Not authorized"}, 401
    cache.flushall()
    return {"status": "cache flushed"}, 200

if __name__ == "__main__":
    app.run()