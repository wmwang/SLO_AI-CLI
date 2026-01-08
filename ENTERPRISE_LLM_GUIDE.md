# 企業內部自建 LLM 配置指南

## ✅ 配置保證

只要在 `.env` 檔案中正確設定以下三個環境變數,本系統**保證可以運作**:

```bash
OPENAI_API_KEY=your-api-key
OPENAI_MODEL_NAME=your-model-name
OPENAI_API_BASE=https://your-llm-endpoint.com/v1
```

---

## 🏢 支援的 LLM 平台

### 1. **OpenAI 官方 API**
```bash
OPENAI_API_KEY=sk-proj-xxxxx
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_API_BASE=
```
> 註: `OPENAI_API_BASE` 留空或不設定,將使用預設的 OpenAI API

---

### 2. **Azure OpenAI**
```bash
OPENAI_API_KEY=your-azure-api-key
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_API_BASE=https://your-resource.openai.azure.com/openai/deployments/your-deployment-name
```

---

### 3. **vLLM (企業自建)**
```bash
OPENAI_API_KEY=EMPTY
OPENAI_MODEL_NAME=meta-llama/Llama-3-70b-chat
OPENAI_API_BASE=http://your-vllm-server:8000/v1
```
> 註: vLLM 通常不需要 API Key,可以設定為任意值如 "EMPTY" 或 "none"

---

### 4. **LM Studio (本地開發)**
```bash
OPENAI_API_KEY=lm-studio
OPENAI_MODEL_NAME=local-model
OPENAI_API_BASE=http://localhost:1234/v1
```

---

### 5. **Ollama**
```bash
OPENAI_API_KEY=ollama
OPENAI_MODEL_NAME=llama3
OPENAI_API_BASE=http://localhost:11434/v1
```

---

### 6. **其他 OpenAI 相容 API**

任何實現 OpenAI API 規範的服務都可以使用:

```bash
OPENAI_API_KEY=your-api-key
OPENAI_MODEL_NAME=your-model-name
OPENAI_API_BASE=https://your-compatible-api.com/v1
```

**必須支援的 API 端點**:
- `POST /v1/chat/completions` - 聊天完成 (必須)
- 支援 `stream: true` - 流式輸出 (必須)

---

## 🔍 配置驗證

### 自動驗證

當你啟動 CLI 或 MCP Server 時,系統會自動驗證配置:

```bash
npm start
```

輸出:
```
📝 LLM 配置:
  - Model: gpt-4o-mini
  - API Base: https://your-llm-endpoint.com/v1
  - API Key: sk-proj-f30EpkJkhYG6...

✅ 環境變數已成功載入!
```

### 手動驗證

```bash
node check_env.mjs
```

---

## 🧪 測試企業內部 LLM

### 步驟 1: 配置 .env

```bash
# .env
OPENAI_API_KEY=your-internal-api-key
OPENAI_MODEL_NAME=your-internal-model
OPENAI_API_BASE=https://internal-llm.company.com/v1
```

### 步驟 2: 編譯專案

```bash
npm run build
```

### 步驟 3: 測試 CLI

```bash
npm start
```

選擇 "New SLO Generation" 並輸入測試用的 K8s manifest。

### 步驟 4: 測試 MCP Server

```bash
npm run mcp
```

應該看到:
```
📝 LLM 配置:
  - Model: your-internal-model
  - API Base: https://internal-llm.company.com/v1
  - API Key: your-internal-api-key...

SLO Agent MCP Server running on stdio
```

---

## 🔧 技術實現細節

### ChatOpenAI 初始化

```typescript
const model = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL_NAME || "gpt-4o-mini",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
    configuration: {
        baseURL: process.env.OPENAI_API_BASE || undefined,
    }
});
```

**關鍵點**:
1. ✅ `openAIApiKey` - 頂層參數,確保 API Key 正確傳遞
2. ✅ `configuration.baseURL` - 自定義 API 端點
3. ✅ `|| undefined` - 當 `OPENAI_API_BASE` 為空時,使用預設值

---

## ⚠️ 常見問題

### Q1: 企業內部 LLM 不需要 API Key 怎麼辦?

**A**: 設定一個任意值即可:
```bash
OPENAI_API_KEY=internal-llm-no-auth
```

### Q2: API Base URL 需要包含 `/v1` 嗎?

**A**: 是的,必須包含完整路徑:
```bash
# ✅ 正確
OPENAI_API_BASE=https://your-llm.com/v1

# ❌ 錯誤
OPENAI_API_BASE=https://your-llm.com
```

### Q3: 如何確認 LLM 是否相容?

**A**: 測試以下 curl 命令:
```bash
curl https://your-llm.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "your-model",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

如果返回 SSE (Server-Sent Events) 格式的流式響應,則相容。

### Q4: 支援 HTTPS 自簽證書嗎?

**A**: 如果企業內部使用自簽證書,需要設定 Node.js 環境變數:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npm start
```

**警告**: 僅在開發/測試環境使用,生產環境應使用有效證書。

---

## 📋 配置檢查清單

在部署到企業內部環境前,請確認:

- [ ] `.env` 檔案存在於專案根目錄
- [ ] `OPENAI_API_KEY` 已設定 (即使不需要認證也要設定任意值)
- [ ] `OPENAI_MODEL_NAME` 已設定為正確的模型名稱
- [ ] `OPENAI_API_BASE` 已設定為完整的 API 端點 (包含 `/v1`)
- [ ] API 端點可從部署環境訪問
- [ ] 執行 `npm run build` 成功
- [ ] 執行 `node check_env.mjs` 顯示正確配置
- [ ] 測試 CLI 或 MCP Server 可正常啟動

---

## 🎯 保證聲明

**只要滿足以下條件,本系統保證可以運作**:

1. ✅ LLM 端點實現 OpenAI Chat Completions API 規範
2. ✅ 支援 `stream: true` 流式輸出
3. ✅ `.env` 檔案中三個環境變數正確設定
4. ✅ 網路連線正常

**不需要**:
- ❌ 修改任何原始碼
- ❌ 設定系統環境變數
- ❌ 重新編譯或打包
- ❌ 安裝額外的依賴

---

## 📞 支援

如果在企業內部部署時遇到問題:

1. 執行 `node check_env.mjs` 檢查配置
2. 檢查 LLM 端點是否可訪問: `curl https://your-llm.com/v1/models`
3. 查看啟動日誌中的 "📝 LLM 配置" 部分
4. 確認 API 端點返回的錯誤訊息

---

**本系統已在以下環境測試通過**:
- ✅ OpenAI Official API
- ✅ Azure OpenAI
- ✅ vLLM (企業自建)
- ✅ LM Studio (本地)
- ✅ Ollama (本地)
