// Unified environment variable loader for MCP Server
// Ensures .env file can be found from any directory

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

interface EnvLoadResult {
    loaded: boolean;
    envPath: string | null;
    attemptedPaths: string[];
    source: 'environment' | 'file' | 'none';
}

/**
 * Find .env file using multiple strategies
 * Tries in order:
 * 1. From compiled file location (dist/xxx.js -> project root)
 * 2. PROJECT_ROOT environment variable
 * 3. process.cwd()
 * 4. Parent directories of process.argv[1]
 */
export function findEnvFile(currentFilePath: string): string | null {
    const possiblePaths: string[] = [];

    // Strategy 1: From compiled file location
    // dist/mcp_server.js -> go up 1 level
    // dist/agent/nodes.js -> go up 2 levels
    try {
        const dirname = path.dirname(currentFilePath);
        possiblePaths.push(path.join(dirname, '..', '.env'));
        possiblePaths.push(path.join(dirname, '..', '..', '.env'));
    } catch (e) {
        // Ignore
    }

    // Strategy 2: PROJECT_ROOT environment variable
    if (process.env.PROJECT_ROOT) {
        possiblePaths.push(path.join(process.env.PROJECT_ROOT, '.env'));
    }

    // Strategy 3: process.cwd()
    try {
        possiblePaths.push(path.join(process.cwd(), '.env'));
    } catch (e) {
        // Ignore
    }

    // Strategy 4: Parent directories of executable
    if (process.argv[1]) {
        try {
            const execDir = path.dirname(process.argv[1]);
            possiblePaths.push(path.join(execDir, '.env'));
            possiblePaths.push(path.join(execDir, '..', '.env'));
        } catch (e) {
            // Ignore
        }
    }

    // Remove duplicates and check each path
    const uniquePaths = [...new Set(possiblePaths.map(p => path.resolve(p)))];

    for (const envPath of uniquePaths) {
        try {
            if (fs.existsSync(envPath)) {
                return envPath;
            }
        } catch (e) {
            // Ignore and continue
        }
    }

    return null;
}

/**
 * Load environment variables from .env file
 * Only sets variables that don't already exist in process.env
 */
export function loadEnvFile(envPath: string): void {
    try {
        const content = fs.readFileSync(envPath, 'utf-8');

        content.split('\n').forEach(line => {
            const trimmed = line.trim();

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) {
                return;
            }

            const equalIndex = trimmed.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmed.substring(0, equalIndex).trim();
                const value = trimmed.substring(equalIndex + 1).trim();

                // Only set if not already in environment
                // This allows MCP Client env vars to take priority
                if (key && !process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    } catch (error) {
        // Silently fail - will be caught by validation
    }
}

/**
 * Find and load .env file
 * Returns information about what was loaded
 */
export function findAndLoadEnv(currentFilePath: string): EnvLoadResult {
    const attemptedPaths: string[] = [];

    // Try to find .env file
    const envPath = findEnvFile(currentFilePath);

    if (envPath) {
        attemptedPaths.push(envPath);
        loadEnvFile(envPath);
        return {
            loaded: true,
            envPath,
            attemptedPaths,
            source: 'file'
        };
    }

    return {
        loaded: false,
        envPath: null,
        attemptedPaths,
        source: 'none'
    };
}

/**
 * Validate required environment variables
 * Throws detailed error if missing
 */
export function validateRequiredEnv(requiredVars: string[], loadResult: EnvLoadResult): void {
    const missing: string[] = [];

    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        const errorLines = [
            `Error: Required environment variables not found: ${missing.join(', ')}`,
            '',
            'Attempted to load from:',
        ];

        if (loadResult.envPath) {
            errorLines.push(`  ✓ Found .env at: ${loadResult.envPath}`);
        } else {
            errorLines.push('  ✗ No .env file found');
        }

        errorLines.push('');
        errorLines.push('Solutions:');
        errorLines.push('1. Create .env file in project root with:');
        for (const varName of missing) {
            errorLines.push(`   ${varName}=your-value-here`);
        }
        errorLines.push('');
        errorLines.push('2. Or set in MCP Client config:');
        errorLines.push('   {');
        errorLines.push('     "env": {');
        for (const varName of missing) {
            errorLines.push(`       "${varName}": "your-value-here",`);
        }
        errorLines.push('     }');
        errorLines.push('   }');

        throw new Error(errorLines.join('\n'));
    }
}

/**
 * Initialize environment variables
 * Call this at the start of your application
 */
export function initializeEnv(currentFilePath: string, requiredVars: string[] = []): EnvLoadResult {
    const result = findAndLoadEnv(currentFilePath);

    if (requiredVars.length > 0) {
        validateRequiredEnv(requiredVars, result);
    }

    return result;
}
