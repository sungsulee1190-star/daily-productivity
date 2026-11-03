#!/usr/bin/env python3
"""Daily Productivity (daily-productivity-wine.vercel.app) data CLI for Hermes.

Logs in as the app user (email/password) so Supabase RLS limits every call
to that user's own rows. Stdlib only.

Usage:
  dp.py whoami
  dp.py list   <table> [--q "<postgrest query>"] [--limit N]
  dp.py get    <table> <id>
  dp.py add    <table> '<json object or array>'
  dp.py update <table> <id> '<json patch>'
  dp.py delete <table> <id>

Env (from ~/.hermes/.env): DP_EMAIL, DP_PASSWORD
Optional: DP_SUPABASE_URL, DP_SUPABASE_ANON_KEY
"""
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone

SUPABASE_URL = os.environ.get("DP_SUPABASE_URL", "https://kledywreyopwjohbptcm.supabase.co")
# Publishable (public) key — the same one shipped in the web app's JS bundle.
ANON_KEY = os.environ.get("DP_SUPABASE_ANON_KEY", "sb_publishable_E_F-8_S329mrqPsrFwekiw_Y1K4tENL")

TABLES = {
    "todos", "routines", "links", "tracker_sessions", "projects",
    "ideas", "notes", "habits", "habit_logs", "events",
}
HAS_UPDATED_AT = {"todos", "routines", "tracker_sessions", "projects", "ideas", "notes"}
NEEDS_CLIENT_ID = {"tracker_sessions"}  # no DB default for id


def load_env():
    path = os.path.join(os.environ.get("HERMES_HOME", os.path.expanduser("~/.hermes")), ".env")
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            if k.startswith("DP_") and k not in os.environ:
                os.environ[k] = v.strip().strip('"').strip("'")


def die(msg, code=1):
    print(json.dumps({"error": msg}, ensure_ascii=False), file=sys.stderr)
    sys.exit(code)


def http(method, url, headers, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        die(f"HTTP {e.code}: {e.read().decode()[:500]}")
    except urllib.error.URLError as e:
        die(f"network error: {e.reason}")


def login():
    email, password = os.environ.get("DP_EMAIL"), os.environ.get("DP_PASSWORD")
    if not email or not password:
        die("DP_EMAIL / DP_PASSWORD not set in ~/.hermes/.env")
    res = http(
        "POST",
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        {"apikey": ANON_KEY, "Content-Type": "application/json"},
        {"email": email, "password": password},
    )
    return res["access_token"], res["user"]["id"]


def rest(method, table, token, query="", body=None):
    if table not in TABLES:
        die(f"unknown table '{table}'. one of: {', '.join(sorted(TABLES))}")
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    url = f"{SUPABASE_URL}/rest/v1/{table}" + (f"?{query}" if query else "")
    return http(method, url, headers, body)


def now():
    return datetime.now(timezone.utc).isoformat()


def parse_json(s):
    try:
        return json.loads(s)
    except json.JSONDecodeError as e:
        die(f"invalid JSON: {e}")


def main(argv):
    load_env()
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return
    cmd, args = argv[0], argv[1:]
    token, user_id = login()
    out = None

    if cmd == "whoami":
        out = {"user_id": user_id, "email": os.environ.get("DP_EMAIL")}

    elif cmd == "list":
        if not args:
            die("usage: list <table> [--q QUERY] [--limit N]")
        table, q, limit = args[0], "", "200"
        i = 1
        while i < len(args):
            if args[i] == "--q":
                q, i = args[i + 1], i + 2
            elif args[i] == "--limit":
                limit, i = args[i + 1], i + 2
            else:
                die(f"unknown option {args[i]}")
        params = q + ("&" if q else "") + f"limit={limit}"
        if "order=" not in q:
            params += "&order=created_at.desc" if table != "habit_logs" else "&order=date.desc"
        out = rest("GET", table, token, params)

    elif cmd == "get":
        if len(args) != 2:
            die("usage: get <table> <id>")
        rows = rest("GET", args[0], token, f"id=eq.{urllib.parse.quote(args[1])}")
        out = rows[0] if rows else die("not found")

    elif cmd == "add":
        if len(args) != 2:
            die("usage: add <table> '<json>'")
        table, payload = args[0], parse_json(args[1])
        rows = payload if isinstance(payload, list) else [payload]
        for r in rows:
            r["user_id"] = user_id
            if table in NEEDS_CLIENT_ID and "id" not in r:
                r["id"] = str(uuid.uuid4())
            if table in HAS_UPDATED_AT:
                r.setdefault("updated_at", now())
        out = rest("POST", table, token, body=rows)

    elif cmd == "update":
        if len(args) != 3:
            die("usage: update <table> <id> '<json patch>'")
        table, rid, patch = args[0], args[1], parse_json(args[2])
        patch.pop("user_id", None)
        patch.pop("id", None)
        if table in HAS_UPDATED_AT:
            patch["updated_at"] = now()
        rows = rest("PATCH", table, token, f"id=eq.{urllib.parse.quote(rid)}", patch)
        out = rows[0] if rows else die("not found (or not yours)")

    elif cmd == "delete":
        if len(args) != 2:
            die("usage: delete <table> <id>")
        rows = rest("DELETE", args[0], token, f"id=eq.{urllib.parse.quote(args[1])}")
        out = {"deleted": len(rows or [])}

    else:
        die(f"unknown command '{cmd}'")

    print(json.dumps(out, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(sys.argv[1:])
