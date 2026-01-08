# 環境變數配置指南

## 📋 概述

SLO AI CLI 使用 `.env` 檔案來管理所有的配置,包括 API Key、Model Name 和 API Base URL。**使用者不需要手動設定系統環境變數**,所有配置都會自動從 `.env` 檔案載入。

---

## 🔧 配置檔案: `.env`

在專案根目錄創建或編輯 `.env` 檔案:

```bash
# OpenAI API 配置
OPENAI_API_KEY=sk-proj-your-api-key-here
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_API_BASE=
```

### 配置說明

| 環境變數 | 說明 | 預設值 | 必填 |
|---------|------|--------|------|
| `OPENAI_API_KEY` | OpenAI API Key | 無 | ✅ 是 |
| `OPENAI_MODEL_NAME` | 使用的模型名稱 | `gpt-4o-mini` | ❌ 否 |
| `OPENAI_API_BASE` | 自定義 API Base URL (用於 Azure OpenAI 或代理) | OpenAI 官方 URL | ❌ 否 |

---

## ✅ 自動載入機制

### 1. **CLI 模式**

當你執行 `npm start` 時:

```typescript
// src/agent/nodes.ts
import * as dotenv from "dotenv";
dotenv.config({ debug: false });

const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL_NAME || "gpt-4o-mini",
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_API_BASE,
        apiKey: process.env.OPENAI_API_KEY,
    }
});
```

### 2. **MCP Server 模式**

當你執行 `npm run mcp` 或透過 Claude Desktop 調用時:

```typescript
// src/mcp_server.ts
import * as dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config({ debug: false });
```

**關鍵**: MCP Server 在啟動時會**自動載入** `.env` 檔案,因此:
- ✅ 不需要在 Claude Desktop 配置中設定環境變數
- ✅ 不需要在系統環境變數中設定
- ✅ 只需要確保 `.env` 檔案存在且配置正確

---

## 🧪 驗證配置

### 方法 1: 使用檢查腳本

```bash
node check_env.mjs
```

輸出範例:
```
=== 環境變數檢查 ===
OPENAI_API_KEY: sk-proj-f30EpkJkhYG6...
OPENAI_MODEL_NAME: gpt-4o-mini
OPENAI_API_BASE: 未設定 (將使用 OpenAI 預設 URL)

✅ 環境變數已成功載入!
✅ MCP Server 啟動時會自動使用這些配置
✅ 使用者不需要額外設定環境變數
```

### 方法 2: 測試 MCP Server

```bash
# 編譯專案
npm run build

# 啟動 MCP Server (會自動載入 .env)
npm run mcp
```

如果配置正確,你會看到:
```
SLO Agent MCP Server running on stdio
```

---

## 🔒 安全性注意事項

### 1. **不要提交 `.env` 到版本控制**

`.env` 檔案已經在 `.gitignore` 中:

```gitignore
.env
```

### 2. **使用 `.env.example` 作為範本**

創建一個 `.env.example` 檔案供團隊參考:

```bash
# .env.example
OPENAI_API_KEY=sk-proj-your-api-key-here
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_API_BASE=
```

### 3. **API Key 輪換**

定期更換 API Key,並更新 `.env` 檔案。

---

## 🌐 使用 Azure OpenAI

如果你使用 Azure OpenAI,配置如下:

```bash
# .env
OPENAI_API_KEY=your-azure-api-key
OPENAI_MODEL_NAME=gpt-4o-mini  # 或你的部署名稱
OPENAI_API_BASE=https://your-resource.openai.azure.com/
```

---

## 🐛 故障排除

### 問題 1: "API Key not found"

**原因**: `.env` 檔案不存在或 `OPENAI_API_KEY` 未設定

**解決方案**:
```bash
# 檢查 .env 檔案是否存在
ls -la .env

# 如果不存在,創建它
echo "OPENAI_API_KEY=your-key-here" > .env
echo "OPENAI_MODEL_NAME=gpt-4o-mini" >> .env
```

### 問題 2: MCP Server 無法讀取環境變數

**原因**: `dotenv.config()` 未在 imports 之前執行

**解決方案**: 已修正,`mcp_server.ts` 現在會在所有 imports 之前載入環境變數:

```typescript
#!/usr/bin/env node
import * as dotenv from "dotenv";

// Load environment variables FIRST before any other imports
dotenv.config({ debug: false });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// ... 其他 imports
```

### 問題 3: Claude Desktop 無法使用 MCP Server

**檢查清單**:
1. ✅ `.env` 檔案存在且配置正確
2. ✅ 執行 `npm run build` 編譯專案
3. ✅ Claude Desktop 配置指向正確的 `dist/mcp_server.js`
4. ✅ 重啟 Claude Desktop

---

## 📝 最佳實踐

### 1. **開發環境 vs 生產環境**

使用不同的 `.env` 檔案:

```bash
# 開發環境
.env.development

# 生產環境
.env.production
```

載入時指定:
```bash
NODE_ENV=production node dist/mcp_server.js
```

### 2. **團隊協作**

1. 提交 `.env.example` 到版本控制
2. 每個開發者複製並重命名為 `.env`
3. 填入自己的 API Key

### 3. **CI/CD 環境**

在 CI/CD 環境中,使用環境變數注入:

```yaml
# GitHub Actions 範例
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  OPENAI_MODEL_NAME: gpt-4o-mini
```

---

## 🎯 總結

✅ **所有配置都在 `.env` 檔案中**  
✅ **CLI 和 MCP Server 都會自動載入**  
✅ **使用者不需要設定系統環境變數**  
✅ **安全且易於管理**  

如有任何問題,請執行 `node check_env.mjs` 檢查配置狀態。
