import { spawn } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const port = Number(process.env.PORT ?? 5173);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited with ${code}`)));
    child.on('error', reject);
  });
}

await run('npm', ['run', 'build']);

const contentTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
]);

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${port}`);
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const normalized = normalize(requestedPath).replace(/^([/\\])+/, '');
  const filePath = join('dist', normalized);
  const safePath = existsSync(filePath) ? filePath : join('dist', 'index.html');
  response.setHeader('Content-Type', contentTypes.get(extname(safePath)) ?? 'application/octet-stream');
  createReadStream(safePath).pipe(response);
});

server.listen(port, () => {
  console.log(`Sigma dev server listening at http://localhost:${port}`);
  console.log('The dev command builds once before serving dist/. Re-run it after source changes.');
});
