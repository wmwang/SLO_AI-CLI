# Prometheus 查詢參數修改說明

## 🔄 變更內容

### 之前的查詢
```
/api/v1/series?match[]={app="my-service",namespace="production"}
```

### 現在的查詢
```
/api/v1/series?match[]={deployment="my-service"}
```

## 📝 變更原因

1. **`app` 標籤可能不存在**: 許多 Kubernetes 部署使用 `deployment` 標籤而非 `app` 標籤
2. **移除 `namespace` 過濾**: 簡化查詢,提高成功率
3. **更好的相容性**: `deployment` 是 Kubernetes 更常見的標籤

## 🔍 支援的標籤格式

現在查詢會使用 `deployment` 標籤,這與以下 Kubernetes 配置相容:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-service
  labels:
    deployment: my-service  # ← 這個標籤會被查詢
```

或者 Prometheus 會自動添加的標籤:
```
deployment="my-service"
```

## 🧪 測試

### 測試 1: 使用 deployment 標籤

```bash
# 測試查詢
curl "http://localhost:9090/api/v1/series?match[]=\{deployment=\"dbaws\"\}"
```

### 測試 2: 在 CLI 中測試

```bash
npm start
# 選擇 Quick Observability
# 輸入 App Name: dbaws
# 輸入 Namespace: dbaws (會被忽略,僅用於顯示)
```

現在應該能正確查詢到資料了!

## 📊 日誌範例

成功查詢的日誌:
```
[INFO] 🔍 Querying Prometheus...
[INFO]   URL: http://localhost:9090/api/v1/series?match[]={deployment="dbaws"}
[INFO]   Response Status: 200 OK
[INFO] ✅ Discovered 25 unique metrics
```

## 🔧 如果還是找不到資料

### 方法 1: 檢查實際的標籤

```bash
# 查看 Prometheus 中有哪些標籤
curl "http://localhost:9090/api/v1/labels"

# 查看特定標籤的值
curl "http://localhost:9090/api/v1/label/deployment/values"
```

### 方法 2: 使用更寬鬆的查詢

如果 `deployment` 標籤也不存在,可以修改為查詢所有指標:

```typescript
// 在 prometheus_client.ts 中
const url = `${this.prometheusUrl}/api/v1/series?match[]={__name__=~".+"}`;
```

### 方法 3: 使用 job 標籤

```typescript
// 使用 job 標籤
const url = `${this.prometheusUrl}/api/v1/series?match[]={job="${appName}"}`;
```

## 📝 未來改進

可以考慮讓使用者自定義查詢標籤:

```bash
# .env
PROMETHEUS_LABEL_KEY=deployment  # 或 app, job, service 等
```

---

**變更已完成**: 現在使用 `deployment` 標籤查詢,應該能正確找到資料了!
