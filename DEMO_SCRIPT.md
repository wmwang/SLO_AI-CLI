# 🎬 Demo 演示腳本（15 分鐘）

## 準備工作 (提前完成)

```bash
# 1. 啟動 MCP Inspector（背景運行）
mcp-inspector node dist/mcp_server.js

# 2. 準備終端
cd /Users/isosoman/Documents/SLO_AI\ CLI
npm start  # 先不執行，demo 時再執行
```

---

## Part 1: 痛點展示 (2 分鐘)

### 展示傳統方式
**說明**: "讓我們先看看傳統方式有多複雜..."

```yaml
# 展示 examples/guestbook.yaml
# 強調: 30 行 YAML → 需要手動分析
```

**痛點**:
- ❌ 需要理解 Golden Signals
- ❌ 手寫 PromQL 查詢
- ❌ 配置 Prometheus、Grafana、Sloth
- ❌ 耗時 4-8 小時

---

## Part 2: AI Agent 演示 (5 分鐘)

### 2.1 啟動 CLI
```bash
npm start
```

**旁白**: "現在讓 AI 來幫我們..."

### 2.2 選擇模式
```
選擇: 1) New SLO Generation
```

### 2.3 輸入 Manifests
```
貼上 examples/guestbook.yaml 的內容
```

**旁白**: "AI 正在分析... 注意這些動態效果"

### 2.4 查看推薦
**重點展示**:
- ✨ 打字機效果的中文說明
- 🌈 彩虹漸變的 AI 狀態
- 📊 5 個智能推薦的 SLO

**旁白**: "AI 自動識別了 Latency、Errors、Traffic 等關鍵指標"

### 2.5 自然語言調整
```
輸入: "保留前 3 個就好"
```

**旁白**: "可以用自然語言調整，非常直觀"

### 2.6 查看結果
**展示**:
- ✅ Prometheus Rules
- ✅ Grafana Dashboard JSON
- ✅ Sloth Spec (已驗證)

**旁白**: "2 分鐘完成！配置已通過 Sloth 驗證，可以直接部署"

---

## Part 3: MCP 整合演示 (3 分鐘)

### 3.1 打開 MCP Inspector
**展示**: `http://localhost:6274/...`

### 3.2 列出 Tools
**重點**: "現在有 7 個 AI Tools"

```
1. recommend_slos
2. generate_artifacts
3. refine_slos
4. optimize_slos
5. discover_prometheus_metrics  ← 新
6. recommend_key_metrics        ← 新
7. generate_quick_dashboard     ← 新
```

### 3.3 測試 Quick Observability
```json
{
  "name": "discover_prometheus_metrics",
  "arguments": {
    "app_name": "guestbook",
    "namespace": "default"
  }
}
```

**旁白**: "這些 Tools 可以在 Claude Desktop 中直接使用"

---

## Part 4: 技術架構講解 (5 分鐘)

### 4.1 核心技術
**投影片**: 展示架構圖

```
用戶 → CLI/MCP → LangGraph Agent → OpenAI
                      ↓
              Sloth + Prometheus
```

**重點**:
1. **LangGraph**: 狀態管理 + 工作流編排
2. **MCP**: AI Agents 的標準協議
3. **Ink**: React for CLI
4. **Sloth**: 自動驗證和修復

### 4.2 關鍵創新
- 🧠 **自我修復**: LLM 根據錯誤自動調整
- 🔄 **流式輸出**: 實時顯示 AI 思考過程
- 🎨 **極致 UX**: CLI 也能有驚艷體驗

### 4.3 MCP 生態願景
**展示**: Agent 互聯圖

```
SLO Agent ←→ DB Agent ←→ K8s Agent
     ↓           ↓           ↓
        Claude Desktop
```

**旁白**: "未來所有 AI Agents 都能互相調用"

---

## 總結與 Q&A (2 分鐘)

### 關鍵數字
- ⏱️ **30x 效率提升**: 8 小時 → 5 分鐘
- 🎯 **<5% 錯誤率**: vs 傳統 15-20%
- 💰 **<$0.002/次**: 成本極低
- 🔧 **7 個 Tools**: 完整工作流

### 下一步
1. 內部試用
2. 收集反饋
3. 擴展更多場景

---

## 常見問題快速回答

**Q: 安全性？**
A: Sloth 自動驗證 + 人工審核

**Q: 成本？**
A: gpt-4o-mini，每次 <$0.002

**Q: 特殊需求？**
A: 支持自然語言調整 + 手動編輯

**Q: 如何開始？**
A: 只需要 OpenAI API Key

---

## 備用 Demo（如果時間充裕）

### Demo: 跑馬燈效果
**展示**: 長日誌訊息的自動滾動

### Demo: 打字機效果
**展示**: 中文說明的逐字顯示

### Demo: AI 狀態動畫
**展示**: 彩虹漸變 + 脈衝動畫

---

## 檢查清單

演示前:
- [ ] MCP Inspector 已啟動
- [ ] 終端已準備好
- [ ] examples/guestbook.yaml 已打開
- [ ] 投影片已準備
- [ ] 網路連線正常
- [ ] OpenAI API Key 已設置

演示後:
- [ ] 回答問題
- [ ] 收集反饋
- [ ] 分享文檔連結
