# MCP Server 測試指南

## 方法 1: 使用 MCP Inspector（推薦）

MCP Inspector 是官方提供的圖形化測試工具。

### 安裝
```bash
npm install -g @modelcontextprotocol/inspector
```

### 啟動測試
```bash
# 先編譯專案
npm run build

# 啟動 MCP Inspector
mcp-inspector node dist/mcp_server.js
```

這會打開一個網頁界面，您可以：
- 查看所有可用的 tools
- 測試每個 tool 的調用
- 查看請求和響應的詳細內容

---

## 方法 2: 使用測試腳本

我們提供了一個簡單的測試客戶端。

### 執行測試
```bash
# 確保已編譯
npm run build

# 執行測試腳本
node test_mcp_client.js
```

測試腳本會：
1. 連接到 MCP server
2. 列出所有可用的 tools
3. 測試 `recommend_slos` tool
4. 測試 `generate_artifacts` tool

---

## 方法 3: 在 Claude Desktop 中測試

### 配置 Claude Desktop

編輯 `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "slo-ai-agent": {
      "command": "node",
      "args": ["/Users/isosoman/Documents/SLO_AI CLI/dist/mcp_server.js"]
    }
  }
}
```

### 重啟 Claude Desktop

重啟後，在對話中可以使用：
- "請使用 recommend_slos 工具分析這個 K8s manifest..."
- "請使用 generate_artifacts 生成 Prometheus 規則..."

---

## 方法 4: 手動測試（進階）

### 直接運行 MCP Server
```bash
npm run mcp
```

Server 會透過 stdio 等待輸入。您可以手動發送 JSON-RPC 請求：

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

---

## 預期結果

### tools/list 應該返回 7 個工具：

**傳統 SLO 工作流 (4個):**
1. `recommend_slos` - 分析 K8s manifests 並推薦 SLOs
2. `generate_artifacts` - 生成 Prometheus Rules 和 Grafana Dashboard
3. `refine_slos` - 根據用戶反饋調整 SLOs
4. `optimize_slos` - 基於 Prometheus 指標優化 SLOs

**Quick Observability 工作流 (3個):**
5. `discover_prometheus_metrics` - 從 Prometheus 發現現有指標
6. `recommend_key_metrics` - 根據觀測目標推薦關鍵指標
7. `generate_quick_dashboard` - 快速生成 Grafana Dashboard

### 成功的調用應該返回：
- `recommend_slos`: 包含 5-8 個推薦的 SLO 對象
- `generate_artifacts`: 包含 Prometheus rules YAML 和 Grafana dashboard JSON
- `refine_slos`: 更新後的 SLO 列表
- `optimize_slos`: 優化建議報告

---

## 故障排除

### 問題: "Cannot find module"
**解決方案**: 執行 `npm run build` 確保 TypeScript 已編譯

### 問題: "Connection refused"
**解決方案**: 確認 MCP server 正在運行且沒有其他進程佔用

### 問題: "Tool not found"
**解決方案**: 檢查 `src/mcp_server.ts` 中的 tool 定義是否正確

---

## 快速測試命令

```bash
# 一鍵測試流程
npm run build && node test_mcp_client.js
```
