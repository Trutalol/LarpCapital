import { spawn, ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const COURSE_PORT = 5175;
const courseDir = fileURLToPath(new URL('../course-site', import.meta.url));

/** Starts the course-site dev server alongside this one, so both live at one localhost (/course). */
function courseSite(): Plugin {
  let child: ChildProcess | undefined;
  return {
    name: 'course-site',
    apply: 'serve',
    configureServer(server) {
      const vite = `${courseDir}/node_modules/vite/bin/vite.js`;
      if (!existsSync(vite)) {
        server.config.logger.warn('[course] course-site deps missing, run `npm install` in course-site/ to serve /course');
        return;
      }
      child = spawn(process.execPath, [vite, '--port', String(COURSE_PORT), '--strictPort', '--clearScreen', 'false'], { cwd: courseDir, stdio: 'ignore' });
      const stop = () => child?.kill();
      server.httpServer?.once('close', stop);
      process.once('exit', stop);
    },
  };
}

export default defineConfig({
  plugins: [react(), courseSite()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/course': { target: `http://127.0.0.1:${COURSE_PORT}`, ws: true },
    },
  },
});
