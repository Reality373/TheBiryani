"""Dev server: static files from the repo root, never cached (python's http.server lets browsers keep stale JS/CSS)."""
import http.server, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if 'If-Modified-Since' in self.headers:  # always a full 200, never a 304 on stale files
            del self.headers['If-Modified-Since']
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        if self.path.split('?')[0] in ('/', '/index.html'):
            self.send_header('Clear-Site-Data', '"cache"')  # one reload empties a browser cache that kept old files
        super().end_headers()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
http.server.ThreadingHTTPServer(('127.0.0.1', port), NoCache).serve_forever()
