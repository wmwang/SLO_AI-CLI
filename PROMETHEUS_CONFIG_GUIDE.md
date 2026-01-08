OPENAI_API_KEY=none
OPENAI_MODEL_NAME=coder
OPENAI_API_BASE=

# Prometheus 配置 (用於 Quick Observability 功能)
# 如果不設定,將使用 Mock 數據
# 範例: PROMETHEUS_URL=http://localhost:9090
PROMETHEUS_URL=

# Prometheus 認證配置 (可選)
# API Key / Bearer Token
PROMETHEUS_API_KEY=

# 自定義 Headers (可選)
# 格式: Header1:Value1,Header2:Value2
# 範例: PROMETHEUS_HEADERS=X-API-Key:your-key,X-Custom-Header:value
PROMETHEUS_HEADERS=


# Quick Observability - Prometheus 配置說明

## 📋 功能說明

**Quick Observability (Discover Prometheus Metrics)** 功能會連接到你的 Prometheus 服務器,自動發現現有的指標,並根據你的觀測目標推薦關鍵指標。

---

## 🔧 Prometheus URL 配置

### 在哪裡設定?

在 `.env` 檔案中設定 `PROMETHEUS_URL`:

```bash
# .env
PROMETHEUS_URL=http://localhost:9090
```

### 配置範例

#### 1. **本地 Prometheus**
```bash
PROMETHEUS_URL=http://localhost:9090
```

#### 2. **遠端 Prometheus**
```bash
PROMETHEUS_URL=https://prometheus.your-company.com
```

#### 3. **Kubernetes 內部 Prometheus**
```bash
PROMETHEUS_URL=http://prometheus-server.monitoring.svc.cluster.local:9090
```

#### 4. **不設定 (使用 Mock 數據)**
```bash
PROMETHEUS_URL=
# 或直接不設定這個變數
```

---

## 🔍 訪問的 API 端點

當你使用 Quick Observability 功能時,系統會訪問以下 Prometheus API:

### API 端點
```
GET {PROMETHEUS_URL}/api/v1/series?match[]={app="{appName}",namespace="{namespace}"}
```

### 範例
如果你輸入:
- App Name: `my-service`
- Namespace: `production`
- PROMETHEUS_URL: `http://localhost:9090`

實際訪問的 URL 會是:
```
http://localhost:9090/api/v1/series?match[]=\{app="my-service",namespace="production"\}
```

---

## 📝 程式碼位置

### 配置讀取

**檔案**: `src/services/prometheus_client.ts`

```typescript
export class PrometheusClient {
    private prometheusUrl: string | undefined;

    constructor() {
        // 從環境變數讀取 Prometheus URL
        this.prometheusUrl = process.env.PROMETHEUS_URL;
    }

    async discoverMetrics(appName: string, namespace: string) {
        if (!this.prometheusUrl) {
            // 如果沒有設定 URL,使用 Mock 數據
            console.log(`No PROMETHEUS_URL configured, using mock data`);
            return this.getMockMetrics(appName, namespace);
        }

        // 構建 API URL
        const url = `${this.prometheusUrl}/api/v1/series?match[]={app="${appName}",namespace="${namespace}"}`;
        
        // 發送請求...
    }
}
```

---

## 🧪 測試配置

### 方法 1: 檢查環境變數

```bash
# 查看當前配置
cat .env | grep PROMETHEUS_URL
```

### 方法 2: 測試 Prometheus 連線

```bash
# 測試 Prometheus API 是否可訪問
curl http://localhost:9090/api/v1/series?match[]=\{app="test"\}
```

### 方法 3: 使用 Mock 模式測試

如果不設定 `PROMETHEUS_URL`,系統會自動使用 Mock 數據:

```bash
# 不設定 PROMETHEUS_URL
PROMETHEUS_URL=

# 執行 CLI
npm start
# 選擇 "Quick Observability"
# 系統會顯示: "No PROMETHEUS_URL configured, using mock data"
```

---

## 📊 Mock 數據

當 `PROMETHEUS_URL` 未設定時,系統會返回以下 Mock 指標:

```typescript
const MOCK_METRICS = [
    { name: "http_requests_total", type: "counter" },
    { name: "http_request_duration_seconds", type: "histogram" },
    { name: "http_request_size_bytes", type: "histogram" },
    { name: "http_response_size_bytes", type: "histogram" },
    { name: "process_cpu_seconds_total", type: "counter" },
    { name: "process_resident_memory_bytes", type: "gauge" },
    { name: "process_open_fds", type: "gauge" },
    { name: "go_goroutines", type: "gauge" },
    { name: "go_memstats_alloc_bytes", type: "gauge" },
    { name: "grpc_server_handled_total", type: "counter" },
    { name: "grpc_server_handling_seconds", type: "histogram" },
    { name: "database_queries_total", type: "counter" },
    { name: "database_query_duration_seconds", type: "histogram" },
    { name: "cache_hits_total", type: "counter" },
    { name: "cache_misses_total", type: "counter" },
    { name: "queue_depth", type: "gauge" },
    { name: "active_connections", type: "gauge" },
    { name: "error_total", type: "counter" },
];
```

這些 Mock 數據可以讓你在沒有 Prometheus 的情況下測試功能。

---

## 🔐 認證配置

如果你的 Prometheus 需要認證,可以在 URL 中包含認證資訊:

### Basic Auth
```bash
PROMETHEUS_URL=http://username:password@prometheus.example.com:9090
```

### Bearer Token (需要修改程式碼)

目前版本不支援 Bearer Token,如果需要,可以修改 `prometheus_client.ts`:

```typescript
const response = await fetch(url, {
    headers: {
        'Authorization': `Bearer ${process.env.PROMETHEUS_TOKEN}`
    }
});
```

---

## ⚠️ 常見問題

### Q1: 為什麼顯示 "using mock data"?

**A**: 因為 `PROMETHEUS_URL` 未設定或為空。請在 `.env` 檔案中設定正確的 Prometheus URL。

### Q2: 如何確認 Prometheus URL 是否正確?

**A**: 在瀏覽器中訪問 `{PROMETHEUS_URL}/api/v1/series`,應該會返回 JSON 數據。

### Q3: 支援 HTTPS 嗎?

**A**: 是的,只需設定 `PROMETHEUS_URL=https://your-prometheus.com`。

### Q4: 可以使用 Prometheus 的其他 API 嗎?

**A**: 目前只使用 `/api/v1/series` 端點。如果需要其他端點,需要修改 `prometheus_client.ts`。

---

## 🚀 完整配置範例

### .env 檔案
```bash
# OpenAI API 配置
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_API_BASE=

# Prometheus 配置
PROMETHEUS_URL=http://localhost:9090
```

### 使用流程

1. **設定 Prometheus URL**
   ```bash
   echo "PROMETHEUS_URL=http://localhost:9090" >> .env
   ```

2. **啟動 CLI**
   ```bash
   npm start
   ```

3. **選擇 Quick Observability**
   - 輸入 App Name (例如: `my-service`)
   - 輸入 Namespace (例如: `production`)

4. **系統會自動**:
   - 連接到 `http://localhost:9090/api/v1/series?match[]={app="my-service",namespace="production"}`
   - 發現所有相關指標
   - 根據你的觀測目標推薦關鍵指標
   - 生成 Grafana Dashboard

---

## 📚 相關檔案

- **配置檔案**: `.env`
- **範本檔案**: `.env.example`
- **實現檔案**: `src/services/prometheus_client.ts`
- **使用位置**: `src/agent/nodes.ts` (discoverMetricsNode)

---

**總結**: 在 `.env` 檔案中設定 `PROMETHEUS_URL` 即可連接到你的 Prometheus 服務器,如果不設定則使用 Mock 數據進行測試。
