import EventEmitter from 'events';
import fs from 'fs-extra';
import path from 'path';

class AgentLogger extends EventEmitter {
    private logFilePath = path.join(process.cwd(), 'agent_interaction.log');

    constructor() {
        super();
        // Initialize log file
        try {
            fs.ensureFileSync(this.logFilePath);
            fs.appendFileSync(this.logFilePath, `\n--- New Session Started: ${new Date().toISOString()} ---\n`);
        } catch (e) {
            // ignore if can't write
        }
    }

    log(message: string, type: 'info' | 'ai' | 'error' = 'info', details?: any) {
        const timestamp = new Date();

        // Emit to UI (only message)
        this.emit('log', { message, type, timestamp });

        // Write to file (with details)
        let logLine = `[${timestamp.toISOString()}] [${type.toUpperCase()}] ${message}\n`;
        if (details) {
            logLine += `DETAILS:\n${JSON.stringify(details, null, 2)}\n`;
        }
        logLine += '-'.repeat(40) + '\n';

        try {
            fs.appendFileSync(this.logFilePath, logLine);
        } catch (err) {
            console.error("Failed to write to log file:", err);
        }
    }

    stream(token: string) {
        this.emit('stream', token);
    }
}

export const logger = new AgentLogger();
