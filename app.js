// Startup script with error logging for cPanel (Phusion Passenger) - ES Module Version
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  try {
    await import('./dist_prod/server.cjs');
  } catch (error) {
    const logPath = path.join(__dirname, 'stderr.log');
    const timestamp = new Date().toISOString();
    const errorMessage = `[Startup Error - ${timestamp}]:\n${error.stack}\n\n`;
    fs.writeFileSync(logPath, errorMessage, { flag: 'a' });
    console.error('Fatal Startup Error:', error);
    throw error;
  }
}

start();
