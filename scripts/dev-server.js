import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const port = 8080;
const server = http.createServer((req, res) => {
  const p = req.url === '/' ? '/pages/dashboard.html' : req.url;
  const file = path.join(process.cwd(), p);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200); res.end(data);
  });
});
server.listen(port, () => console.log(`Dev server on http://localhost:${port}`));
