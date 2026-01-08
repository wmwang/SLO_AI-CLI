# MCP Server 配置說明 (Hard Code 版本)

## 🎯 超級簡單的配置方式

**不需要 .env 檔案,不需要環境變數,只需要編輯一個檔案!**

## 📝 配置步驟

### 1. 編輯配置檔案

打開 `src/config/mcp_config.ts`:

```typescript
export const MCP_CONFIG = {
    // 把這裡改成你的 API Key
    OPENAI_API_KEY: "sk-your-api-key-here",
    
    // 其他設定 (可選)
    OPENAI_MODEL_NAME: "gpt-4o-mini",
    OPENAI_API_BASE: "",
};
```

### 2. 編譯

```bash
npm run build
```

### 3. 完成!

就這樣!不需要任何其他設定。

## 🚀 使用方式

### 本地測試

```bash
node dist/mcp_server.js
```

### MCP Inspector

```bash
mcp-inspector node dist/mcp_server.js
```

### Claude Desktop

```json
{
  "mcpServers": {
    "slo-ai-agent": {
      "command": "node",
      "args": ["/absolute/path/to/SLO_AI CLI/dist/mcp_server.js"]
    }
  }
}
```

**注意**: 不需要設定 `env`,因為 API Key 已經 hard code 在配置檔案中!

## 🔧 修改設定

只需要:
1. 編輯 `src/config/mcp_config.ts`
2. 執行 `npm run build`
3. 重新啟動 MCP Server

## ✅ 優點

- ✅ **超級簡單** - 只需要編輯一個檔案
- ✅ **不會出錯** - 不依賴環境變數或 .env 檔案
- ✅ **容易調試** - 所有設定都在一個地方
- ✅ **穩定可靠** - 不會因為路徑問題找不到配置

## ⚠️ 安全提醒

- 不要將 `src/config/mcp_config.ts` 提交到公開的 Git repository
- 建議將此檔案加入 `.gitignore`

## 📋 完整範例

### 使用 OpenAI 官方 API

```typescript
export const MCP_CONFIG = {
    OPENAI_API_KEY: "sk-proj-abc123...",
    OPENAI_MODEL_NAME: "gpt-4o-mini",
    OPENAI_API_BASE: "",
};
```

### 使用企業內部 LLM

```typescript
export const MCP_CONFIG = {
    OPENAI_API_KEY: "your-internal-key",
    OPENAI_MODEL_NAME: "your-model",
    OPENAI_API_BASE: "https://llm.company.internal/v1",
};
```

### 使用 Prometheus

```typescript
export const MCP_CONFIG = {
    OPENAI_API_KEY: "sk-proj-abc123...",
    OPENAI_MODEL_NAME: "gpt-4o-mini",
    OPENAI_API_BASE: "",
    
    PROMETHEUS_URL: "http://localhost:9090",
    PROMETHEUS_API_KEY: "",
    PROMETHEUS_HEADERS: "",
};
```

---

**就是這麼簡單!不會再出現找不到 API Key 的問題了!**
