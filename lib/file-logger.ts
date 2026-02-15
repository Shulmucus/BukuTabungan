import fs from 'fs';
import path from 'path';

export function logToFile(message: string) {
    try {
        const logPath = 'd:/school sht/Bu dian/bukutabungan/debug.log';
        const timestamp = new Date().toISOString();
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (err) {
        // Ignore errors during logging
    }
}
