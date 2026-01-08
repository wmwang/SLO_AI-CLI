#!/usr/bin/env node
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ debug: false });

console.log("=== 環境變數檢查 ===");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : "未設定");
console.log("OPENAI_MODEL_NAME:", process.env.OPENAI_MODEL_NAME || "未設定 (將使用預設值 gpt-4o-mini)");
console.log("OPENAI_API_BASE:", process.env.OPENAI_API_BASE || "未設定 (將使用 OpenAI 預設 URL)");
console.log("\n✅ 環境變數已成功載入!");
console.log("✅ MCP Server 啟動時會自動使用這些配置");
console.log("✅ 使用者不需要額外設定環境變數");
