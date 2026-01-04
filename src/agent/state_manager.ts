import fs from 'fs-extra';
import path from 'path';
import { SLO } from './state.js';
import { logger } from '../utils/logger.js';

export interface ProjectState {
    lastUpdated: string;
    slos: SLO[];
    k8sSource?: string;
    generatedFiles: {
        rules: string;
        dashboard: string;
    };
}

const STATE_FILE = 'slo_state.json';

export class StateManager {
    private filePath: string;

    constructor(baseDir: string = process.cwd()) {
        this.filePath = path.join(baseDir, STATE_FILE);
    }

    async saveState(slos: SLO[], generatedFiles: { rules: string; dashboard: string }) {
        const state: ProjectState = {
            lastUpdated: new Date().toISOString(),
            slos,
            generatedFiles
        };

        try {
            await fs.writeJSON(this.filePath, state, { spaces: 2 });
            logger.log(`Project state saved to ${STATE_FILE}`, 'info');
        } catch (error) {
            logger.log(`Failed to save project state: ${error}`, 'error');
        }
    }

    async loadState(): Promise<ProjectState | null> {
        try {
            if (await fs.pathExists(this.filePath)) {
                return await fs.readJSON(this.filePath) as ProjectState;
            }
        } catch (error) {
            logger.log(`Failed to load project state: ${error}`, 'error');
        }
        return null;
    }

    async exists(): Promise<boolean> {
        return await fs.pathExists(this.filePath);
    }
}

export const stateManager = new StateManager();
