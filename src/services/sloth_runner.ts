import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import { logger } from "../utils/logger.js";

const execAsync = promisify(exec);

export class SlothRunner {
    private static instance: SlothRunner;
    private binPath: string;
    private projectRoot: string;

    private constructor() {
        this.projectRoot = process.cwd();
        // We will look for the binary in ./bin/sloth
        this.binPath = path.join(this.projectRoot, "bin", "sloth");
    }

    public static getInstance(): SlothRunner {
        if (!SlothRunner.instance) {
            SlothRunner.instance = new SlothRunner();
        }
        return SlothRunner.instance;
    }

    /**
     * Checks if the Sloth binary exists at ./bin/sloth
     */
    public async checkBinaryExists(): Promise<boolean> {
        try {
            await fs.promises.access(this.binPath, fs.constants.X_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Finds Sloth binary in system PATH or GOPATH
     * Returns the path if found, null otherwise
     */
    private async findSystemSloth(): Promise<string | null> {
        try {
            // Try 'which sloth' (works on macOS/Linux)
            const { stdout } = await execAsync("which sloth 2>/dev/null || echo ''");
            const slothPath = stdout.trim();
            if (slothPath && fs.existsSync(slothPath)) {
                logger.log(`✅ Found system Sloth at: ${slothPath}`, "info");
                return slothPath;
            }
        } catch {
            // Ignore error, try next method
        }

        try {
            // Try $GOPATH/bin/sloth
            const { stdout: gopathOut } = await execAsync("go env GOPATH 2>/dev/null || echo ''");
            const gopath = gopathOut.trim();
            if (gopath) {
                const gopathSloth = path.join(gopath, "bin", "sloth");
                if (fs.existsSync(gopathSloth)) {
                    logger.log(`✅ Found Sloth in GOPATH: ${gopathSloth}`, "info");
                    return gopathSloth;
                }
            }
        } catch {
            // Ignore error
        }

        return null;
    }

    /**
     * Ensures Sloth is available, either by finding existing installation or installing it.
     * Priority:
     * 1. Check ./bin/sloth (local copy)
     * 2. Check system PATH (which sloth)
     * 3. Check $GOPATH/bin/sloth
     * 4. Install if not found
     */
    private async ensureSloth(): Promise<string | null> {
        // 1. Check local ./bin/sloth first
        if (await this.checkBinaryExists()) {
            logger.log(`✅ Using local Sloth: ${this.binPath}`, "info");
            return this.binPath;
        }

        // 2. Check if Sloth exists in system
        const systemSloth = await this.findSystemSloth();
        if (systemSloth) {
            logger.log(`✅ Using system Sloth (skipping installation)`, "info");
            // Update binPath to use system sloth
            this.binPath = systemSloth;
            return systemSloth;
        }

        // 3. Not found anywhere, attempt installation
        logger.log("⚠️  Sloth not found in system. Attempting installation...", "info");
        const installed = await this.installSloth();
        if (installed) {
            return this.binPath;
        }

        return null;
    }

    /**
     * Attempts to install Sloth using 'go install' via the system's go command.
     * This relies on the user having 'go' installed and configured (with proxy if needed).
     */
    public async installSloth(): Promise<boolean> {
        logger.log("Attempting to install Sloth via 'go install'...", "info");

        try {
            // 1. Check if 'go' is available
            await execAsync("go version");
        } catch (error) {
            logger.log("❌ Go is not installed or not in PATH. Cannot auto-install Sloth.", "error");
            return false;
        }

        try {
            // 2. Run go install
            // Installs to $GOPATH/bin/sloth
            logger.log("Running: go install github.com/slok/sloth/cmd/sloth@v0.15.0", "info");
            await execAsync("go install github.com/slok/sloth/cmd/sloth@v0.15.0");

            // 3. Find where it was installed
            const { stdout: gopathOut } = await execAsync("go env GOPATH");
            const gopath = gopathOut.trim();
            const installedBin = path.join(gopath, "bin", "sloth");

            // 4. Copy to local ./bin/sloth for consistency
            const localBinDir = path.join(this.projectRoot, "bin");
            if (!fs.existsSync(localBinDir)) {
                fs.mkdirSync(localBinDir, { recursive: true });
            }

            logger.log(`Copying binary from ${installedBin} to ${this.binPath}`, "info");
            await fs.promises.copyFile(installedBin, this.binPath);
            await fs.promises.chmod(this.binPath, 0o755); // Make executable

            logger.log("✅ Sloth installed successfully.", "info");
            return true;
        } catch (error: any) {
            logger.log(`❌ Failed to install Sloth: ${error.message}`, "error");
            return false;
        }
    }

    /**
     * Generates Prometheus rules from a Sloth spec file.
     * @param inputPath Path to the input sloth.yaml
     * @param outputPath Path to the output prometheus_rules.yaml
     */
    public async generate(inputPath: string, outputPath: string): Promise<{ success: boolean; error?: string }> {
        // Ensure Sloth is available (checks system first, installs only if needed)
        const slothPath = await this.ensureSloth();
        if (!slothPath) {
            const msg = "Could not find or install Sloth. Skipping artifact generation.";
            logger.log(msg, "error");
            return { success: false, error: msg };
        }

        logger.log(`Running Sloth on ${inputPath}...`, "info");

        try {
            // Command: ./bin/sloth generate -i input.yaml -o output.yaml
            const cmd = `"${this.binPath}" generate -i "${inputPath}" -o "${outputPath}"`;
            const { stdout, stderr } = await execAsync(cmd);

            // Sloth often logs info to stderr, even on success.
            // We need to differentiate actual errors. Usually if execAsync doesn't throw, exit code was 0.
            if (stderr) {
                logger.log(`Sloth stderr: ${stderr}`, "info");
            }

            logger.log(`Sloth generation complete: ${outputPath}`, "info");
            return { success: true };
        } catch (error: any) {
            // execAsync throws on non-zero exit code
            // The stderr usually contains the validation error details
            const errorMessage = error.stderr || error.message;
            logger.log(`Error running Sloth: ${errorMessage}`, "error");
            return { success: false, error: errorMessage };
        }
    }
}
