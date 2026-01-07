# 🎯 AI SLO Agent - 快速參考卡

## 一句話介紹
**AI 驅動的 SLO 自動化工具，5 分鐘完成傳統 8 小時的工作**

---

## 核心優勢

| 指標 | 傳統 | AI Agent | 提升 |
|------|------|----------|------|
| ⏱️ 時間 | 4-8h | 5min | **30x** |
| 🎯 錯誤率 | 15-20% | <5% | **4x** |
| 💰 成本 | 人力 | $0.002 | **極低** |
| 🔧 配置 | 手動 | 自動 | **100%** |

---

## 技術亮點

### 🧠 LangGraph
- 狀態管理 + 工作流編排
- 可中斷、可恢復
- 視覺化 Agent 流程

### 🔗 MCP (Model Context Protocol)
- 7 個 AI Tools
- 標準化協議
- 跨平台整合

### 🎨 Ink (React for CLI)
- 打字機效果
- 跑馬燈滾動
- 彩虹漸變動畫

### 🔧 Sloth 整合
- 自動驗證
- 自我修復（3 次重試）
- 多窗口告警

---

## 工作流程

```
K8s YAML → AI 分析 → 推薦 SLO → 
自然語言調整 → 生成配置 → Sloth 驗證 → 部署
```

**時間**: 5-10 分鐘
**輸出**: Prometheus Rules + Grafana Dashboard + Sloth Spec

---

## 7 個 MCP Tools

### 傳統 SLO (4個)
1. `recommend_slos` - 分析推薦
2. `generate_artifacts` - 生成配置
3. `refine_slos` - 自然語言調整
4. `optimize_slos` - 優化建議

### Quick Observability (3個)
5. `discover_prometheus_metrics` - 發現指標
6. `recommend_key_metrics` - 推薦關鍵指標
7. `generate_quick_dashboard` - 快速 Dashboard

---

## 快速開始

```bash
# 1. 安裝
npm install

# 2. 配置
echo "OPENAI_API_KEY=sk-..." > .env

# 3. 運行
npm start

# 4. MCP Server
mcp-inspector node dist/mcp_server.js
```

---

## Demo 重點

### 展示 1: 效率對比
- 傳統: 展示複雜的手動配置
- AI: 2 分鐘完成全流程

### 展示 2: 智能推薦
- Golden Signals 自動識別
- 中文說明（打字機效果）
- 自然語言調整

### 展示 3: MCP 整合
- 7 個 Tools
- Claude Desktop 整合
- Agent 互聯願景

---

## 成本分析

### OpenAI API
- 模型: `gpt-4o-mini`
- 價格: ~$0.15/1M tokens
- 平均: <10K tokens/次
- **成本: <$0.002/次**

### ROI
- 節省時間: 7.9 小時/次
- 人力成本: $50-100/小時
- **節省: $395-790/次**

---

## MCP 生態願景

```
SLO Agent ←→ DB Agent ←→ K8s Agent
     ↓           ↓           ↓
        Claude Desktop
            ↓
      統一 AI 助手
```

**未來**: 所有 AI Agents 互相調用，發揮最大效果

---

## 導入建議

### ✅ 適合場景
- 新服務快速上線
- 標準化 SLO 配置
- 團隊 SRE 能力提升

### ⚠️ 注意事項
- 需要 OpenAI API Key
- 建議先在測試環境驗證
- 保留人工審核流程

### 📋 檢查清單
- [ ] API Key 配置
- [ ] Sloth 已安裝
- [ ] Prometheus/Grafana 可用
- [ ] 團隊培訓完成

---

## 資源連結

- **完整簡報**: `DEMO_PRESENTATION.md`
- **演示腳本**: `DEMO_SCRIPT.md`
- **開發文檔**: `developer_manual.md`
- **MCP 指南**: `mcp_guide.md`

---

## 聯絡方式

**專案負責人**: [您的名字]
**Email**: [您的 Email]
**內部 Slack**: #slo-ai-agent

---

**🚀 讓 AI 成為您的 SRE 助手！**
