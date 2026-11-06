#!/usr/bin/env python3
"""
Local offline server for Basho (https://basho.fueko.net export).
Usage:
    python3 server.py [port]
Default port: 8000 (http://localhost:8000)
Also compatible with standard `python3 -m http.server 8000`.
"""
import http.server
import json
import os
import sys
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

API_ROUTES = {
    "/ghost/api/content/posts/": "assets/data/posts.json",
    "/ghost/api/content/settings/": "assets/data/settings.json",
    "/ghost/api/content/tiers/": "assets/data/tiers.json",
    "/ghost/api/content/newsletters/": "assets/data/newsletters.json",
    "/members/api/member/": "assets/data/member.json",
    "/members/api/comments/counts/": "assets/data/comment-counts.json",
}


class OfflineBashoHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def end_headers(self):
        # Force aggressive no-cache so development changes appear immediately without browser caching
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_POST(self):
        # Handle Ghost analytics / Stripe telemetry POST requests offline with 200 OK
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length > 0:
            self.rfile.read(content_length)
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        body = json.dumps({"ok": True, "offline": True}).encode("utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        # Strip cache validators so browser always gets 200 OK with fresh content
        if "If-Modified-Since" in self.headers:
            del self.headers["If-Modified-Since"]
        if "If-None-Match" in self.headers:
            del self.headers["If-None-Match"]

        parsed = urllib.parse.urlsplit(self.path)
        clean_path = parsed.path

        # Map Ghost API endpoints directly to JSON files with application/json MIME type
        if clean_path in API_ROUTES:
            json_file = os.path.join(ROOT_DIR, API_ROUTES[clean_path])
            if os.path.isfile(json_file):
                with open(json_file, "rb") as f:
                    data = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return

        super().do_GET()


if __name__ == "__main__":
    http.server.HTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), OfflineBashoHandler) as httpd:
        print(f"Serving Basho offline at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
