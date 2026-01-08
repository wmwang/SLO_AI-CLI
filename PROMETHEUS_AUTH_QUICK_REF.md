# Prometheus 認證快速參考

## 🔐 支援的認證方式

### 1. Bearer Token (最常用)
```bash
PROMETHEUS_URL=https://your-prometheus.com
PROMETHEUS_API_KEY=your-token-here
```
→ 發送: `Authorization: Bearer your-token-here`

---

### 2. Bearer Token (完整格式)
```bash
PROMETHEUS_URL=https://your-prometheus.com
PROMETHEUS_API_KEY=Bearer your-token-here
```
→ 發送: `Authorization: Bearer your-token-here`

---

### 3. Basic Authentication
```bash
PROMETHEUS_URL=https://your-prometheus.com
PROMETHEUS_API_KEY=Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```
→ 發送: `Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=`

生成 Basic Auth:
```bash
echo -n "username:password" | base64
```

---

### 4. 自定義 Header (單個)
```bash
PROMETHEUS_URL=https://your-prometheus.com
PROMETHEUS_HEADERS=X-API-Key:your-key
```
→ 發送: `X-API-Key: your-key`

---

### 5. 自定義 Headers (多個)
```bash
PROMETHEUS_URL=https://your-prometheus.com
PROMETHEUS_HEADERS=X-API-Key:key123,X-Tenant:prod,X-Region:us
```
→ 發送:
```
X-API-Key: key123
X-Tenant: prod
X-Region: us
```

---

### 6. 組合使用
```bash
PROMETHEUS_URL=https://your-prometheus.com
PROMETHEUS_API_KEY=your-bearer-token
PROMETHEUS_HEADERS=X-Tenant:tenant123
```
→ 發送:
```
Authorization: Bearer your-bearer-token
X-Tenant: tenant123
```

---

## 📋 常見服務商配置

### Grafana Cloud
```bash
PROMETHEUS_URL=https://prometheus-prod-XX-XXX.grafana.net/api/prom
PROMETHEUS_API_KEY=glc_your_token_here
```

### AWS Managed Prometheus
```bash
PROMETHEUS_URL=https://aps-workspaces.region.amazonaws.com/workspaces/ws-xxx/api/v1
PROMETHEUS_HEADERS=X-Amz-Security-Token:token
```

### 企業內部 (Bearer Token)
```bash
PROMETHEUS_URL=https://prometheus.company.internal
PROMETHEUS_API_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 企業內部 (X-API-Key)
```bash
PROMETHEUS_URL=https://prometheus.company.internal
PROMETHEUS_HEADERS=X-API-Key:abc123def456
```

---

## 🧪 快速測試

```bash
# 1. 設定 .env
echo "PROMETHEUS_URL=https://your-prometheus.com" >> .env
echo "PROMETHEUS_API_KEY=your-token" >> .env

# 2. 編譯
npm run build

# 3. 測試
npm start
# 選擇 Quick Observability
```

---

## ⚠️ 故障排除

| 錯誤 | 原因 | 解決方案 |
|------|------|---------|
| 401 Unauthorized | Token 錯誤 | 檢查 `PROMETHEUS_API_KEY` |
| 403 Forbidden | 權限不足 | 確認 Token 有讀取權限 |
| Using mock data | 連線失敗 | 檢查 URL 和認證配置 |

---

**詳細說明**: 請參考 `PROMETHEUS_AUTH_GUIDE.md`
