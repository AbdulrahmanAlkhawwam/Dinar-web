// Starts the mock API and a dashboard wired to it, on port 3001 so it can
// run beside `npm run dev` against the real API.
import { spawn } from 'node:child_process';

const children = [
  spawn(process.execPath, ['scripts/mock-api.mjs'], { stdio: 'inherit' }),
  spawn('npx', ['next', 'dev', '--port', '3001'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, DINAR_API_URL: 'http://localhost:4010/api/v1' },
  }),
];

const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) => child.on('exit', stop));
