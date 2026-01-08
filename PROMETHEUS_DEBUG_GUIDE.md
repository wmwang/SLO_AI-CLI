# Prometheus 連線問題調查指南

## 📊 新增的詳細日誌

現在當你使用 Quick Observability 功能時,系統會輸出詳細的 Prometheus 連線日誌,方便你調查問題。

---

## 🔍 日誌範例

### 成功連線的日誌

```
[PrometheusClient] 🔍 Querying Prometheus...
[PrometheusClient]   URL: http://localhost:9090/api/v1/series?match[]={app="my-service",namespace="production"}
[PrometheusClient]   Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ***12345678'
}
[PrometheusClient]   Response Status: 200 OK
[PrometheusClient]   Response data status: success
[PrometheusClient] ✅ Discovered 18 unique metrics
```

### 認證失敗的日誌 (401)

```
[PrometheusClient] 🔍 Querying Prometheus...
[PrometheusClient]   URL: https://prometheus.company.com/api/v1/series?match[]={app="my-service",namespace="production"}
[PrometheusClient]   Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ***invalid'
}
[PrometheusClient]   Response Status: 401 Unauthorized
[PrometheusClient] ❌ Prometheus API error:
[PrometheusClient]   Status: 401 Unauthorized
[PrometheusClient]   Response: {"status":"error","errorType":"unauthorized","error":"invalid credentials"}
[PrometheusClient] ❌ Failed to query Prometheus:
[PrometheusClient]   Error: Prometheus API error: 401 Unauthorized
[PrometheusClient] ⚠️  Falling back to mock data
```

### 網路連線失敗的日誌

```
[PrometheusClient] 🔍 Querying Prometheus...
[PrometheusClient]   URL: https://prometheus.unreachable.com/api/v1/series?match[]={app="my-service",namespace="production"}
[PrometheusClient]   Headers: {
  'Content-Type': 'application/json'
}
[PrometheusClient] ❌ Failed to query Prometheus:
[PrometheusClient]   Error: fetch failed
[PrometheusClient]   Cause: connect ECONNREFUSED 192.168.1.100:9090
[PrometheusClient]   Stack: Error: fetch failed
    at Object.fetch (node:internal/deps/undici/undici:11457:11)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[PrometheusClient] ⚠️  Falling back to mock data
```

### 權限不足的日誌 (403)

```
[PrometheusClient] 🔍 Querying Prometheus...
[PrometheusClient]   URL: https://prometheus.company.com/api/v1/series?match[]={app="my-service",namespace="production"}
[PrometheusClient]   Headers: {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ***12345678'
}
[PrometheusClient]   Response Status: 403 Forbidden
[PrometheusClient] ❌ Prometheus API error:
[PrometheusClient]   Status: 403 Forbidden
[PrometheusClient]   Response: {"status":"error","errorType":"forbidden","error":"insufficient permissions"}
[PrometheusClient] ❌ Failed to query Prometheus:
[PrometheusClient]   Error: Prometheus API error: 403 Forbidden
[PrometheusClient] ⚠️  Falling back to mock data
```

---

## 🔐 安全性特性

### Headers 隱藏敏感資訊

系統會自動隱藏敏感資訊,只顯示部分內容:

| Header 類型 | 原始值 | 日誌顯示 |
|------------|--------|---------|
| **Authorization (Bearer)** | `Bearer abc123def456ghi789` | `Bearer ***ghi789` |
| **Authorization (Basic)** | `Basic dXNlcjpwYXNz` | `Basic ***cGFzc` |
| **X-API-Key** | `secret-key-12345` | `***2345` |
| **X-Custom-Token** | `token-abcdefgh` | `***efgh` |
| **Content-Type** | `application/json` | `application/json` (不隱藏) |

---

## 🐛 故障排除步驟

### 步驟 1: 檢查日誌輸出

執行 CLI 並選擇 Quick Observability:

```bash
npm start
```

查看終端輸出中的 `[PrometheusClient]` 日誌。

---

### 步驟 2: 根據錯誤類型診斷

#### 錯誤 1: "No PROMETHEUS_URL configured"

**日誌**:
```
[PrometheusClient] No PROMETHEUS_URL configured, using mock data
```

**原因**: `.env` 檔案中未設定 `PROMETHEUS_URL`

**解決方案**:
```bash
# 編輯 .env
echo "PROMETHEUS_URL=http://localhost:9090" >> .env

# 重新啟動
npm start
```

---

#### 錯誤 2: "401 Unauthorized"

**日誌**:
```
[PrometheusClient]   Response Status: 401 Unauthorized
```

**原因**: API Key 不正確或已過期

**解決方案**:
1. 檢查 `PROMETHEUS_API_KEY` 是否正確
2. 確認 Token 格式 (Bearer/Basic)
3. 測試 Token 是否有效:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:9090/api/v1/series?match[]={app="test"}
   ```

---

#### 錯誤 3: "403 Forbidden"

**日誌**:
```
[PrometheusClient]   Response Status: 403 Forbidden
```

**原因**: API Key 沒有足夠權限

**解決方案**:
1. 確認 API Key 有讀取 Prometheus 數據的權限
2. 檢查是否需要額外的 Headers (如 Tenant ID)
3. 聯繫 Prometheus 管理員確認權限設定

---

#### 錯誤 4: "fetch failed" / "ECONNREFUSED"

**日誌**:
```
[PrometheusClient]   Error: fetch failed
[PrometheusClient]   Cause: connect ECONNREFUSED
```

**原因**: 無法連接到 Prometheus 服務器

**解決方案**:
1. 檢查 `PROMETHEUS_URL` 是否正確
2. 確認 Prometheus 服務器是否運行:
   ```bash
   curl http://localhost:9090/api/v1/status/config
   ```
3. 檢查防火牆設定
4. 確認網路連線

---

#### 錯誤 5: "Unexpected response format"

**日誌**:
```
[PrometheusClient] ⚠️  Unexpected response format: {...}
```

**原因**: Prometheus API 返回了非預期的數據格式

**解決方案**:
1. 檢查 Prometheus 版本是否支援 `/api/v1/series` 端點
2. 手動測試 API:
   ```bash
   curl "http://localhost:9090/api/v1/series?match[]={app=\"test\"}"
   ```
3. 確認返回的 JSON 格式

---

### 步驟 3: 使用 curl 測試

複製日誌中的 URL 和 Headers,使用 curl 測試:

```bash
# 從日誌複製 URL
URL="http://localhost:9090/api/v1/series?match[]={app=\"my-service\",namespace=\"production\"}"

# 從日誌複製 Authorization (完整版本,不是隱藏的)
TOKEN="your-actual-token-here"

# 測試連線
curl -v \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  "$URL"
```

---

### 步驟 4: 檢查 .env 配置

```bash
# 查看當前配置
cat .env | grep PROMETHEUS

# 應該看到:
# PROMETHEUS_URL=http://localhost:9090
# PROMETHEUS_API_KEY=your-token
# PROMETHEUS_HEADERS=...
```

---

### 步驟 5: 啟用詳細日誌 (如需要)

如果需要更詳細的日誌,可以修改 `src/services/prometheus_client.ts`:

```typescript
// 在 discoverMetrics 方法中添加
console.log('[PrometheusClient] Full response:', JSON.stringify(data, null, 2));
```

---

## 📝 日誌位置

### CLI 模式

日誌會直接輸出到終端:

```bash
npm start
# 日誌會顯示在終端中
```

### MCP Server 模式

日誌會輸出到 stderr (MCP Inspector 可以看到):

```bash
mcp-inspector node dist/mcp_server.js
# 在瀏覽器 Console 中查看日誌
```

---

## 🧪 測試連線的完整流程

### 1. 設定環境變數

```bash
# .env
PROMETHEUS_URL=http://localhost:9090
PROMETHEUS_API_KEY=your-token-if-needed
```

### 2. 編譯專案

```bash
npm run build
```

### 3. 啟動 CLI

```bash
npm start
```

### 4. 選擇 Quick Observability

- 輸入 App Name: `test`
- 輸入 Namespace: `default`

### 5. 查看日誌

觀察終端輸出中的 `[PrometheusClient]` 日誌:

- ✅ 如果看到 "✅ Discovered X unique metrics" → 連線成功
- ⚠️ 如果看到 "⚠️ Falling back to mock data" → 連線失敗,查看錯誤訊息

---

## 📊 日誌解讀速查表

| 日誌訊息 | 含義 | 下一步 |
|---------|------|--------|
| `🔍 Querying Prometheus...` | 開始查詢 | 正常 |
| `Response Status: 200 OK` | 請求成功 | 正常 |
| `✅ Discovered X metrics` | 找到指標 | 成功! |
| `Response Status: 401` | 認證失敗 | 檢查 API Key |
| `Response Status: 403` | 權限不足 | 檢查權限設定 |
| `Response Status: 404` | 端點不存在 | 檢查 URL |
| `Error: fetch failed` | 網路錯誤 | 檢查連線 |
| `ECONNREFUSED` | 連線被拒絕 | 檢查服務器 |
| `⚠️ Falling back to mock data` | 使用 Mock 數據 | 查看上方錯誤 |

---

## 🔧 進階調試

### 使用 Node.js 調試模式

```bash
# 啟用 Node.js 調試
NODE_DEBUG=http npm start
```

### 使用 Wireshark 抓包

如果需要查看實際的 HTTP 請求:

```bash
# 安裝 Wireshark
brew install wireshark

# 抓取 localhost 流量
sudo tcpdump -i lo0 -w prometheus.pcap port 9090
```

---

## 📚 相關文件

- **Prometheus 配置指南**: `PROMETHEUS_CONFIG_GUIDE.md`
- **Prometheus 認證指南**: `PROMETHEUS_AUTH_GUIDE.md`
- **快速參考**: `PROMETHEUS_AUTH_QUICK_REF.md`

---

**總結**: 現在你可以透過詳細的日誌輕鬆調查 Prometheus 連線問題,所有請求細節都會清楚顯示在終端中!
