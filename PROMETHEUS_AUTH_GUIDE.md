# Prometheus 認證配置指南

## 🔐 支援的認證方式

SLO AI CLI 現在支援多種 Prometheus 認證方式,包括 API Key、Bearer Token 和自定義 Headers。

---

## 📋 配置方式

### 方法 1: Bearer Token (推薦)

**適用場景**: Prometheus 使用 Bearer Token 認證

#### 配置 .env
```bash
PROMETHEUS_URL=https://prometheus.your-company.com
PROMETHEUS_API_KEY=your-bearer-token-here
```

**實際發送的 Header**:
```
Authorization: Bearer your-bearer-token-here
```

---

### 方法 2: Bearer Token (完整格式)

如果你的 Token 已經包含 "Bearer " 前綴:

#### 配置 .env
```bash
PROMETHEUS_URL=https://prometheus.your-company.com
PROMETHEUS_API_KEY=Bearer your-bearer-token-here
```

**實際發送的 Header**:
```
Authorization: Bearer your-bearer-token-here
```

---

### 方法 3: Basic Authentication

**適用場景**: Prometheus 使用 HTTP Basic Auth

#### 配置 .env
```bash
PROMETHEUS_URL=https://prometheus.your-company.com
PROMETHEUS_API_KEY=Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

> 註: `dXNlcm5hbWU6cGFzc3dvcmQ=` 是 `username:password` 的 Base64 編碼

**如何生成 Basic Auth Token**:
```bash
echo -n "username:password" | base64
```

**實際發送的 Header**:
```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

---

### 方法 4: 自定義 Header (X-API-Key)

**適用場景**: Prometheus 使用自定義 Header,如 `X-API-Key`

#### 配置 .env
```bash
PROMETHEUS_URL=https://prometheus.your-company.com
PROMETHEUS_HEADERS=X-API-Key:your-api-key-here
```

**實際發送的 Header**:
```
X-API-Key: your-api-key-here
```

---

### 方法 5: 多個自定義 Headers

**適用場景**: 需要發送多個自定義 Headers

#### 配置 .env
```bash
PROMETHEUS_URL=https://prometheus.your-company.com
PROMETHEUS_HEADERS=X-API-Key:your-key,X-Tenant-ID:tenant123,X-Custom:value
```

**實際發送的 Headers**:
```
X-API-Key: your-key
X-Tenant-ID: tenant123
X-Custom: value
```

---

### 方法 6: 組合使用

**適用場景**: 同時需要 Bearer Token 和自定義 Headers

#### 配置 .env
```bash
PROMETHEUS_URL=https://prometheus.your-company.com
PROMETHEUS_API_KEY=your-bearer-token
PROMETHEUS_HEADERS=X-Tenant-ID:tenant123,X-Region:us-west
```

**實際發送的 Headers**:
```
Authorization: Bearer your-bearer-token
X-Tenant-ID: tenant123
X-Region: us-west
Content-Type: application/json
```

---

## 🧪 測試配置

### 測試 1: 驗證 Headers

創建測試腳本 `test_prometheus_auth.sh`:

```bash
#!/bin/bash

# 讀取 .env
source .env

# 構建 Headers
HEADERS=""
if [ -n "$PROMETHEUS_API_KEY" ]; then
    if [[ "$PROMETHEUS_API_KEY" == Bearer* ]] || [[ "$PROMETHEUS_API_KEY" == Basic* ]]; then
        HEADERS="-H \"Authorization: $PROMETHEUS_API_KEY\""
    else
        HEADERS="-H \"Authorization: Bearer $PROMETHEUS_API_KEY\""
    fi
fi

# 添加自定義 Headers
if [ -n "$PROMETHEUS_HEADERS" ]; then
    IFS=',' read -ra HEADER_PAIRS <<< "$PROMETHEUS_HEADERS"
    for pair in "${HEADER_PAIRS[@]}"; do
        IFS=':' read -ra KV <<< "$pair"
        HEADERS="$HEADERS -H \"${KV[0]}: ${KV[1]}\""
    done
fi

# 測試連線
echo "Testing Prometheus connection..."
echo "URL: $PROMETHEUS_URL/api/v1/series?match[]={app=\"test\"}"
echo "Headers: $HEADERS"
echo ""

eval curl -v $HEADERS "$PROMETHEUS_URL/api/v1/series?match[]={app=\"test\"}"
```

### 測試 2: 使用 CLI 測試

```bash
# 設定環境變數
export PROMETHEUS_URL=https://your-prometheus.com
export PROMETHEUS_API_KEY=your-token

# 啟動 CLI
npm start

# 選擇 Quick Observability
# 輸入 App Name 和 Namespace
# 觀察是否成功連接
```

---

## 📝 實現細節

### 程式碼位置

**檔案**: `src/services/prometheus_client.ts`

### buildHeaders() 方法

```typescript
private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add API Key if configured
    if (this.apiKey) {
        if (this.apiKey.startsWith('Bearer ')) {
            headers['Authorization'] = this.apiKey;
        } else if (this.apiKey.startsWith('Basic ')) {
            headers['Authorization'] = this.apiKey;
        } else {
            // Default to Bearer token
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
    }

    // Add custom headers
    Object.assign(headers, this.customHeaders);

    return headers;
}
```

### 環境變數解析

```typescript
constructor() {
    this.prometheusUrl = process.env.PROMETHEUS_URL;
    this.apiKey = process.env.PROMETHEUS_API_KEY;
    
    // Parse PROMETHEUS_HEADERS
    if (process.env.PROMETHEUS_HEADERS) {
        const headerPairs = process.env.PROMETHEUS_HEADERS.split(',');
        headerPairs.forEach(pair => {
            const [key, value] = pair.split(':').map(s => s.trim());
            if (key && value) {
                this.customHeaders[key] = value;
            }
        });
    }
}
```

---

## 🔒 安全性建議

### 1. **不要提交 .env 到版本控制**

`.env` 檔案已在 `.gitignore` 中:
```gitignore
.env
```

### 2. **使用環境變數管理工具**

生產環境建議使用:
- **Kubernetes Secrets**
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**

### 3. **定期輪換 API Key**

建議每 30-90 天更換一次 API Key。

### 4. **最小權限原則**

確保 Prometheus API Key 只有讀取權限,不要給予寫入或管理權限。

---

## 🌐 常見 Prometheus 服務商配置

### Grafana Cloud

```bash
PROMETHEUS_URL=https://prometheus-prod-XX-XXX.grafana.net/api/prom
PROMETHEUS_API_KEY=your-grafana-cloud-token
```

### AWS Managed Prometheus (AMP)

```bash
PROMETHEUS_URL=https://aps-workspaces.us-west-2.amazonaws.com/workspaces/ws-xxx/api/v1
PROMETHEUS_HEADERS=X-Amz-Security-Token:your-token,Authorization:AWS4-HMAC-SHA256...
```

### Google Cloud Monitoring

```bash
PROMETHEUS_URL=https://monitoring.googleapis.com/v1/projects/PROJECT_ID/location/global/prometheus
PROMETHEUS_HEADERS=Authorization:Bearer $(gcloud auth print-access-token)
```

### Azure Monitor

```bash
PROMETHEUS_URL=https://your-workspace.prometheus.monitor.azure.com
PROMETHEUS_API_KEY=Bearer your-azure-token
```

---

## ⚠️ 故障排除

### 問題 1: 401 Unauthorized

**原因**: API Key 不正確或已過期

**解決方案**:
1. 檢查 `PROMETHEUS_API_KEY` 是否正確
2. 確認 Token 是否已過期
3. 測試 Token 是否有效:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-prometheus.com/api/v1/series?match[]={app="test"}
   ```

### 問題 2: 403 Forbidden

**原因**: API Key 沒有足夠權限

**解決方案**:
1. 確認 API Key 有讀取 Prometheus 數據的權限
2. 檢查是否需要額外的 Headers (如 Tenant ID)

### 問題 3: Headers 格式錯誤

**原因**: `PROMETHEUS_HEADERS` 格式不正確

**正確格式**:
```bash
# ✅ 正確
PROMETHEUS_HEADERS=Key1:Value1,Key2:Value2

# ❌ 錯誤
PROMETHEUS_HEADERS=Key1=Value1,Key2=Value2  # 使用 = 而非 :
PROMETHEUS_HEADERS=Key1: Value1, Key2: Value2  # 多餘的空格
```

### 問題 4: 仍然使用 Mock 數據

**原因**: 認證失敗,系統 fallback 到 Mock 數據

**檢查步驟**:
1. 查看日誌中的錯誤訊息
2. 確認 `PROMETHEUS_URL` 已設定
3. 測試 API 連線是否成功

---

## 📊 完整配置範例

### 範例 1: 企業內部 Prometheus (Bearer Token)

```bash
# .env
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_API_BASE=

PROMETHEUS_URL=https://prometheus.company.internal
PROMETHEUS_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PROMETHEUS_HEADERS=
```

### 範例 2: Grafana Cloud

```bash
# .env
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_API_BASE=

PROMETHEUS_URL=https://prometheus-prod-01-eu-west-0.grafana.net/api/prom
PROMETHEUS_API_KEY=glc_eyJrIjoiT0tTcGxPZ...
PROMETHEUS_HEADERS=
```

### 範例 3: 自定義 Header (X-API-Key)

```bash
# .env
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_API_BASE=

PROMETHEUS_URL=https://prometheus.example.com
PROMETHEUS_API_KEY=
PROMETHEUS_HEADERS=X-API-Key:abc123def456,X-Tenant:production
```

### 範例 4: Basic Auth

```bash
# .env
OPENAI_API_KEY=sk-proj-your-key
OPENAI_MODEL_NAME=gpt-4o-mini
OPENAI_API_BASE=

PROMETHEUS_URL=https://prometheus.example.com
PROMETHEUS_API_KEY=Basic YWRtaW46cGFzc3dvcmQ=
PROMETHEUS_HEADERS=
```

---

## 🚀 快速開始

### 1. 配置 .env

```bash
# 複製範本
cp .env.example .env

# 編輯 .env
nano .env
```

### 2. 設定 Prometheus 認證

根據你的 Prometheus 服務商,選擇合適的認證方式:

```bash
# Bearer Token
PROMETHEUS_API_KEY=your-token

# 或 自定義 Header
PROMETHEUS_HEADERS=X-API-Key:your-key
```

### 3. 測試連線

```bash
# 編譯
npm run build

# 啟動
npm start

# 選擇 Quick Observability
# 輸入 App Name 和 Namespace
```

### 4. 驗證成功

如果配置正確,你會看到:
```
[PrometheusClient] Discovered XX metrics
```

如果配置錯誤,會 fallback 到 Mock 數據:
```
[PrometheusClient] No PROMETHEUS_URL configured, using mock data
```

---

## 📚 相關文件

- **配置檔案**: `.env`
- **範本檔案**: `.env.example`
- **實現檔案**: `src/services/prometheus_client.ts`
- **Prometheus 配置指南**: `PROMETHEUS_CONFIG_GUIDE.md`

---

**總結**: 透過 `PROMETHEUS_API_KEY` 和 `PROMETHEUS_HEADERS` 環境變數,你可以輕鬆配置各種 Prometheus 認證方式,無需修改程式碼!
