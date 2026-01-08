# ✅ Prometheus 日誌修復完成

## 問題

之前 Prometheus 連線的日誌使用 `console.log`,不會被記錄到 `agent_interaction.log` 檔案中。

## 解決方案

已將 `src/services/prometheus_client.ts` 中的所有 `console.log` 和 `console.error` 改為使用 `logger.log()`,現在所有 Prometheus 連線細節都會被記錄到 `agent_interaction.log`。

## 現在的日誌位置

### 1. agent_interaction.log 檔案

所有 Prometheus 連線日誌都會寫入:
```
/Users/isosoman/Documents/SLO_AI CLI/agent_interaction.log
```

### 2. 終端輸出

同時也會顯示在終端的 "Live Agent Logs" 區域。

## 日誌範例

### 成功連線

```
[2026-01-08T22:00:00.000Z] [INFO] 🔍 Querying Prometheus...
----------------------------------------
[2026-01-08T22:00:00.001Z] [INFO]   URL: http://localhost:9090/api/v1/series?match[]={app="my-service",namespace="production"}
----------------------------------------
[2026-01-08T22:00:00.002Z] [INFO]   Headers:
DETAILS:
{
  "Content-Type": "application/json",
  "Authorization": "Bearer ***12345678"
}
----------------------------------------
[2026-01-08T22:00:00.100Z] [INFO]   Response Status: 200 OK
----------------------------------------
[2026-01-08T22:00:00.101Z] [INFO]   Response data status: success
----------------------------------------
[2026-01-08T22:00:00.102Z] [INFO] ✅ Discovered 18 unique metrics
----------------------------------------
```

### 連線失敗

```
[2026-01-08T22:00:00.000Z] [INFO] 🔍 Querying Prometheus...
----------------------------------------
[2026-01-08T22:00:00.001Z] [INFO]   URL: https://prometheus.unreachable.com/api/v1/series?match[]={app="test",namespace="default"}
----------------------------------------
[2026-01-08T22:00:00.002Z] [INFO]   Headers:
DETAILS:
{
  "Content-Type": "application/json"
}
----------------------------------------
[2026-01-08T22:00:01.000Z] [ERROR] ❌ Failed to query Prometheus:
----------------------------------------
[2026-01-08T22:00:01.001Z] [ERROR]   Error: fetch failed
----------------------------------------
[2026-01-08T22:00:01.002Z] [ERROR]   Cause: connect ECONNREFUSED
----------------------------------------
[2026-01-08T22:00:01.003Z] [INFO] ⚠️  Falling back to mock data
----------------------------------------
```

## 如何查看日誌

### 方法 1: 實時查看

```bash
# 在另一個終端窗口
tail -f agent_interaction.log
```

### 方法 2: 搜尋特定內容

```bash
# 搜尋 Prometheus 相關日誌
grep "Prometheus" agent_interaction.log

# 搜尋錯誤
grep "ERROR" agent_interaction.log

# 搜尋特定 URL
grep "URL:" agent_interaction.log
```

### 方法 3: 查看最近的日誌

```bash
# 查看最後 50 行
tail -50 agent_interaction.log

# 查看最後 100 行
tail -100 agent_interaction.log
```

## 測試步驟

1. **設定 Prometheus URL**:
   ```bash
   echo "PROMETHEUS_URL=http://localhost:9090" >> .env
   ```

2. **編譯並啟動**:
   ```bash
   npm run build
   npm start
   ```

3. **選擇 Quick Observability**:
   - 輸入 App Name
   - 輸入 Namespace

4. **查看日誌**:
   ```bash
   tail -f agent_interaction.log
   ```

現在你應該能看到完整的 Prometheus 連線細節!

## 相關文件

- **調查指南**: `PROMETHEUS_DEBUG_GUIDE.md`
- **配置指南**: `PROMETHEUS_CONFIG_GUIDE.md`
- **認證指南**: `PROMETHEUS_AUTH_GUIDE.md`
