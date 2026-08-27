#!/usr/bin/env python3
"""Static dev server with Cache-Control: no-store on every response.

Plain `python3 -m http.server` sends only Last-Modified; browsers
heuristically cache the files, so reloads keep serving stale CSS and
stale JS modules while iterating. This wrapper disables caching.
Used by .claude/launch.json for local preview.

Usage: python3 scripts/dev-server.py [port]
"""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 48217
http.server.ThreadingHTTPServer(('', port), NoCacheHandler).serve_forever()
