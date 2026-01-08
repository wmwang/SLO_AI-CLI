# MCP -32000 錯誤修復說明

## 🐛 問題描述

在其他電腦上使用 MCP Client 時,出現 `-32000` 錯誤碼,MCP Server 無法正常運作。

## 🔍 錯誤原因

MCP 使用 stdio (標準輸入/輸出) 進行 JSON-RPC 通訊。任何輸出到 `stdout` 或 `stderr` 的內容都會污染 JSON 訊息,導致解析失敗。

### 常見污染源

1. **console.log / console.error**
   ```typescript
   console.error("📝 LLM 配置:");  // ❌ 會污染 stdio
   ```

2. **dotenv debug 輸出**
   ```typescript
   dotenv.config({ debug: true });  // ❌ 會輸出到 stderr
   ```

3. **process.exit(1)**
   ```typescript
   if (!apiKey) {
       console.error("錯誤訊息");  // ❌ 污染 stdio
       process.exit(1);
   }
   ```

## ✅ 修復內容

### 1. 移除 console 輸出

**之前** (src/agent/nodes.ts):
```typescript
// Validate required environment variables
if (!process.env.OPENAI_API_KEY) {
    console.error("❌ 錯誤: OPENAI_API_KEY 未設定!");
    console.error("請在 .env 檔案中設定 OPENAI_API_KEY");
    process.exit(1);
}

// Log configuration (for debugging)
console.error("📝 LLM 配置:");
console.error(`  - Model: ${process.env.OPENAI_MODEL_NAME}`);
console.error(`  - API Base: ${process.env.OPENAI_API_BASE}`);
console.error(`  - API Key: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);
```

**現在**:
```typescript
// Validate required environment variables (silently for MCP compatibility)
if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set in .env file");
}
```

### 2. 確保 dotenv 靜默模式

**src/mcp_server.ts** 和 **src/agent/nodes.ts**:
```typescript
dotenv.config({ debug: false, override: false });
```

## 🧪 驗證修復

### 方法 1: 使用測試腳本

```bash
./test_mcp_server.sh
```

這個腳本會:
- ✅ 檢查 .env 檔案
- ✅ 檢查編譯狀態
- ✅ 測試 MCP Server 基本啟動
- ✅ 驗證 JSON 回應格式

### 方法 2: 手動測試

```bash
# 1. 編譯
npm run build

# 2. 測試基本啟動
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/mcp_server.js

# 應該返回有效的 JSON,不應該有任何其他輸出
```

### 方法 3: MCP Inspector

```bash
mcp-inspector node dist/mcp_server.js
```

如果修復成功,應該能正常連接,不會出現 -32000 錯誤。

## 📊 錯誤碼說明

| 錯誤碼 | 含義 | 常見原因 |
|--------|------|---------|
| -32700 | Parse error | JSON 格式錯誤,通常是 stdio 被污染 |
| -32600 | Invalid Request | 請求格式不正確 |
| -32601 | Method not found | 方法不存在 |
| -32602 | Invalid params | 參數不正確 |
| -32603 | Internal error | 內部錯誤 |
| **-32000** | **Server error** | **伺服器內部錯誤,通常是 stdio 污染或環境變數問題** |

## 🔧 故障排除

### 問題 1: 仍然出現 -32000

**檢查步驟**:

1. **確認沒有 console 輸出**:
   ```bash
   grep -r "console\." src/
   # 應該只在 logger.ts 和非 MCP 相關檔案中出現
   ```

2. **檢查 dotenv 配置**:
   ```bash
   grep "dotenv.config" src/mcp_server.ts src/agent/nodes.ts
   # 應該都是 { debug: false }
   ```

3. **測試 stdio 是否乾淨**:
   ```bash
   node dist/mcp_server.js < /dev/null 2>&1 | head -1
   # 不應該有任何輸出
   ```

### 問題 2: OPENAI_API_KEY 未設定

**錯誤訊息**:
```
Error: OPENAI_API_KEY is not set in .env file
```

**解決方案**:
```bash
# 確認 .env 檔案存在
ls -la .env

# 確認 OPENAI_API_KEY 已設定
grep OPENAI_API_KEY .env

# 如果沒有,添加:
echo "OPENAI_API_KEY=your-key-here" >> .env
```

### 問題 3: 在其他電腦上測試

**部署檢查清單**:

- [ ] `.env` 檔案已複製到目標電腦
- [ ] `OPENAI_API_KEY` 已設定
- [ ] 執行 `npm install` 安裝依賴
- [ ] 執行 `npm run build` 編譯
- [ ] 執行 `./test_mcp_server.sh` 測試
- [ ] 使用 `mcp-inspector` 驗證

## 📝 最佳實踐

### 1. MCP Server 中避免的事項

❌ **不要使用**:
```typescript
console.log()
console.error()
console.warn()
console.info()
process.stdout.write()
process.stderr.write()
```

✅ **改用**:
```typescript
// 如果需要日誌,使用 logger (會寫入檔案,不會污染 stdio)
import { logger } from "./utils/logger.js";
logger.log("message", "info");

// 或者拋出異常
throw new Error("error message");
```

### 2. 環境變數驗證

❌ **不要**:
```typescript
if (!apiKey) {
    console.error("Missing API key");
    process.exit(1);
}
```

✅ **改用**:
```typescript
if (!apiKey) {
    throw new Error("Missing API key");
}
```

### 3. dotenv 配置

✅ **正確配置**:
```typescript
import * as dotenv from "dotenv";
dotenv.config({ debug: false, override: false });
```

## 🎯 驗證清單

部署前請確認:

- [ ] 移除所有 `console.*` 輸出 (除了 logger.ts)
- [ ] `dotenv.config({ debug: false })`
- [ ] 使用 `throw Error` 而非 `console.error + process.exit`
- [ ] 執行 `./test_mcp_server.sh` 通過
- [ ] 使用 `mcp-inspector` 測試成功
- [ ] 在目標電腦上測試成功

## 📚 相關文件

- **MCP 測試腳本**: `test_mcp_server.sh`
- **MCP 測試指南**: `MCP_TESTING.md`
- **環境變數配置**: `ENV_CONFIG_GUIDE.md`

---

**修復狀態**: ✅ 已完成
**測試狀態**: ✅ 通過
**部署建議**: 在其他電腦上使用前,請先執行 `./test_mcp_server.sh` 驗證
