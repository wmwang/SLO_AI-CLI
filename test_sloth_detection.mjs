#!/usr/bin/env node
import { SlothRunner } from "./dist/services/sloth_runner.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║          Sloth 檢測測試                                       ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log("");

const runner = SlothRunner.getInstance();

// Test the new ensureSloth logic
console.log("🔍 檢查 Sloth 是否可用...");
console.log("");

// We need to access the private method, so we'll trigger it via generate
const testInput = "./test_sloth_input.yaml";
const testOutput = "./test_sloth_output.yaml";

// Create a minimal test file
import * as fs from "fs";
fs.writeFileSync(testInput, `version: "prometheus/v1"
service: "test"
slos: []
`);

try {
    const result = await runner.generate(testInput, testOutput);
    console.log("");
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║          測試結果                                             ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log("");
    if (result.success) {
        console.log("✅ Sloth 檢測成功!");
        console.log("✅ 系統已準備好使用 Sloth");
    } else {
        console.log("⚠️  Sloth 檢測失敗");
        console.log(`   錯誤: ${result.error}`);
    }
} catch (error) {
    console.log("❌ 測試過程發生錯誤:", error.message);
} finally {
    // Cleanup
    try {
        fs.unlinkSync(testInput);
        if (fs.existsSync(testOutput)) {
            fs.unlinkSync(testOutput);
        }
    } catch { }
}
