// Minimal static server for dist/, to preview all versions together: npm run serve
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const root = 'dist';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
	'.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.xml': 'application/xml' };

createServer(async (req, res) => {
	let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
	if (path.startsWith('/latest/') || path === '/latest') {
		const { latest } = JSON.parse(await readFile(join(root, 'versions.json'), 'utf-8'));
		res.writeHead(302, { Location: path.replace(/^\/latest/, `/${latest}`) }).end();
		return;
	}
	let file = join(root, path);
	try {
		if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
		const body = await readFile(file);
		res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
		res.end(req.method === 'HEAD' ? undefined : body);
	} catch {
		res.writeHead(404, { 'Content-Type': 'text/html' });
		res.end(req.method === 'HEAD' ? undefined : await readFile(join(root, '404.html')));
	}
}).listen(4321, () => console.log('Serving dist/ on http://localhost:4321'));
