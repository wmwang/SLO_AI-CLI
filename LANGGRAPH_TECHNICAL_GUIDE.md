# LangGraph 技術與觀念整理

## 📚 我們專案使用的 LangGraph 核心技術

### 1. **StateGraph - 狀態圖工作流** ⭐⭐⭐

#### 概念
LangGraph 的核心是 **StateGraph**，它是一個有狀態的工作流引擎。

#### 我們的使用
```typescript
import { StateGraph, START, END } from "@langchain/langgraph";

const workflow = new StateGraph(AgentState)
    .addNode("recommendSLOs", recommendSLOsNode)
    .addEdge(START, "recommendSLOs")
    .addEdge("recommendSLOs", END);

export const recommendationGraph = workflow.compile();
```

#### 關鍵特性
- ✅ **有向圖結構**: Nodes（節點）+ Edges（邊）
- ✅ **狀態管理**: 每個節點可以讀取和更新共享狀態
- ✅ **編譯執行**: `.compile()` 生成可執行的圖

#### 優勢
- 清晰的工作流視覺化
- 易於理解和維護
- 支援複雜的分支邏輯

---

### 2. **Annotation - 類型安全的狀態定義** ⭐⭐⭐

#### 概念
使用 `Annotation` 定義強類型的 Agent 狀態。

#### 我們的使用
```typescript
import { Annotation } from "@langchain/langgraph";

export const AgentState = Annotation.Root({
    // 輸入
    k8sManifests: Annotation<string>(),
    
    // 中間狀態
    recommendedSLOs: Annotation<SLO[]>(),
    selectedSLOs: Annotation<SLO[]>(),
    
    // 輸出
    generatedRules: Annotation<string>(),
    generatedDashboard: Annotation<string>(),
    generatedSlothSpec: Annotation<string>(),
    
    // Quick Observability
    appName: Annotation<string>(),
    namespace: Annotation<string>(),
    discoveredMetrics: Annotation<string[]>(),
    // ...
});
```

#### 關鍵特性
- ✅ **TypeScript 類型推斷**: 自動類型檢查
- ✅ **狀態隔離**: 每個欄位獨立管理
- ✅ **可選欄位**: 支援部分狀態更新

#### 優勢
- 編譯時錯誤檢測
- IDE 自動完成
- 重構更安全

---

### 3. **Nodes - 可組合的處理單元** ⭐⭐⭐

#### 概念
Node 是執行特定任務的函數，接收狀態並返回狀態更新。

#### 我們的使用
```typescript
// Node 簽名
export const recommendSLOsNode = async (
    state: typeof AgentState.State
) => {
    // 1. 讀取輸入狀態
    const manifests = state.k8sManifests;
    
    // 2. 執行業務邏輯（LLM 調用）
    const result = await chain.stream({ k8s_manifests: manifests });
    
    // 3. 返回狀態更新
    return {
        recommendedSLOs: parsedSLOs
    };
};
```

#### 我們實現的 Nodes
1. **recommendSLOsNode** - 分析 K8s manifests 推薦 SLOs
2. **generateArtifactsNode** - 生成 Prometheus/Grafana/Sloth 配置
3. **refineSLOsNode** - 根據反饋調整 SLOs
4. **optimizeSLOsNode** - 優化現有 SLOs
5. **discoverMetricsNode** - 發現 Prometheus 指標
6. **recommendMetricsNode** - 推薦關鍵指標
7. **generateQuickDashboardNode** - 生成快速 Dashboard

#### 關鍵特性
- ✅ **純函數**: 輸入 → 處理 → 輸出
- ✅ **可測試**: 易於單元測試
- ✅ **可重用**: 可在不同 Graph 中使用

---

### 4. **Sub-Graphs - 模組化工作流** ⭐⭐

#### 概念
將複雜工作流拆分成多個獨立的子圖。

#### 我們的使用
```typescript
// 傳統 SLO 工作流
export const recommendationGraph = workflow.compile();
export const generationGraph = generationWorkflow.compile();
export const refinementGraph = refinementWorkflow.compile();
export const optimizationGraph = optimizationWorkflow.compile();

// Quick Observability 工作流
export const discoveryGraph = discoveryWorkflow.compile();
export const metricRecommendationGraph = metricRecommendationWorkflow.compile();
export const quickDashboardGraph = quickDashboardWorkflow.compile();
```

#### 我們的 7 個 Sub-Graphs

| Graph | 用途 | Nodes |
|-------|------|-------|
| `recommendationGraph` | SLO 推薦 | recommendSLOs |
| `generationGraph` | 配置生成 | generateArtifacts |
| `refinementGraph` | 對話式調整 | refineSLOs |
| `optimizationGraph` | 優化建議 | optimizeSLOs |
| `discoveryGraph` | 指標發現 | discoverMetrics |
| `metricRecommendationGraph` | 指標推薦 | recommendMetrics |
| `quickDashboardGraph` | Dashboard 生成 | generateQuickDashboard |

#### 優勢
- 關注點分離
- 易於維護和擴展
- 可獨立測試和部署

---

### 5. **Edges - 工作流控制** ⭐⭐

#### 概念
定義 Nodes 之間的執行順序。

#### 我們的使用
```typescript
// 簡單的線性流程
.addEdge(START, "recommendSLOs")
.addEdge("recommendSLOs", END)
```

#### Edge 類型
1. **Normal Edge**: 無條件執行
   ```typescript
   .addEdge("nodeA", "nodeB")
   ```

2. **START/END**: 特殊節點
   ```typescript
   .addEdge(START, "firstNode")
   .addEdge("lastNode", END)
   ```

#### 我們的設計模式
- **單節點圖**: 每個 Sub-Graph 只有一個主要 Node
- **線性流程**: START → Node → END
- **外部協調**: 複雜邏輯在 CLI 層處理

---

### 6. **Human-in-the-Loop - 人機協作** ⭐⭐⭐

#### 概念
在 Agent 執行過程中暫停，等待人類輸入。

#### 我們的實現
```typescript
// Stage 1: AI 推薦
const result1 = await recommendationGraph.invoke({
    k8sManifests: manifests
});

// 人類選擇（在 CLI 中）
const selected = await userSelectSLOs(result1.recommendedSLOs);

// Stage 2: 生成配置
const result2 = await generationGraph.invoke({
    selectedSLOs: selected
});
```

#### 關鍵特性
- ✅ **分階段執行**: 每個 Graph 獨立運行
- ✅ **狀態傳遞**: 前一階段的輸出 → 下一階段的輸入
- ✅ **用戶控制**: 在關鍵決策點介入

#### 優勢
- AI 提供建議，人類做決策
- 避免完全自動化的風險
- 提升用戶信任度

---

### 7. **Streaming - 實時反饋** ⭐⭐

#### 概念
流式處理 LLM 輸出，提供實時反饋。

#### 我們的使用
```typescript
const stream = await chain.stream({
    k8s_manifests: state.k8sManifests,
});

let fullContent = "";
for await (const chunk of stream) {
    fullContent += chunk.content;
    // 可以在這裡實時顯示進度
}
```

#### 關鍵特性
- ✅ **逐塊接收**: 不用等待完整響應
- ✅ **進度可視化**: 可以顯示 AI 思考過程
- ✅ **早期錯誤檢測**: 及時發現問題

#### 優勢
- 更好的用戶體驗
- 降低感知延遲
- 支援長時間運行的任務

---

## 🎯 LangGraph 設計模式總結

### 我們使用的模式

#### 1. **Multi-Graph Pattern（多圖模式）**
```
recommendationGraph → [用戶選擇] → generationGraph
```
- 將複雜工作流拆分成多個簡單的 Sub-Graphs
- 在 Graphs 之間插入人類決策點

#### 2. **State Accumulation Pattern（狀態累積模式）**
```typescript
// 狀態逐步累積
{} → {k8sManifests} → {recommendedSLOs} → {selectedSLOs} → {generatedRules, ...}
```
- 每個階段添加新的狀態欄位
- 保留之前的狀態供後續使用

#### 3. **Single-Node Graph Pattern（單節點圖模式）**
```typescript
START → singleNode → END
```
- 每個 Graph 專注於一個核心任務
- 簡化錯誤處理和測試

---

## 🚀 進階技術（我們未使用但值得了解）

### 1. **Conditional Edges（條件邊）**
```typescript
// 根據狀態決定下一步
.addConditionalEdges(
    "nodeA",
    (state) => state.needsRetry ? "retry" : "success"
)
```

### 2. **Checkpointing（檢查點）**
```typescript
// 持久化狀態，支援恢復
const graph = workflow.compile({
    checkpointer: new MemorySaver()
});
```

### 3. **Parallel Execution（並行執行）**
```typescript
// 同時執行多個 Nodes
.addNode("nodeA", funcA)
.addNode("nodeB", funcB)
.addEdge(START, "nodeA")
.addEdge(START, "nodeB")
```

---

## 💡 關鍵學習要點

### 1. **狀態是核心**
- 所有 Nodes 共享同一個狀態對象
- 使用 `Annotation` 確保類型安全
- 狀態應該是可序列化的

### 2. **Nodes 應該是純函數**
- 輸入：當前狀態
- 輸出：狀態更新（部分或全部）
- 避免副作用（除了必要的 I/O）

### 3. **Graph 是聲明式的**
- 先定義結構（Nodes + Edges）
- 再編譯執行（`.compile()`）
- 易於視覺化和理解

### 4. **分階段執行是強大的模式**
- 不需要一個巨大的 Graph
- 在關鍵點暫停，等待人類輸入
- 更容易調試和測試

---

## 📊 我們的架構優勢

### ✅ 清晰的關注點分離
```
State (state.ts) → Nodes (nodes.ts) → Graphs (graph.ts) → CLI (ui.tsx)
```

### ✅ 高度模組化
- 7 個獨立的 Sub-Graphs
- 7 個可重用的 Nodes
- 易於添加新功能

### ✅ 類型安全
- TypeScript + Annotation
- 編譯時錯誤檢測
- IDE 支援完善

### ✅ 可測試性
- 每個 Node 可獨立測試
- 每個 Graph 可獨立測試
- Mock 狀態容易

---

## 🎓 對團隊的啟發

### 1. **標準化 AI Agent 架構**
- LangGraph 提供了一套成熟的模式
- 不需要從零開始設計狀態管理
- 團隊成員容易理解和協作

### 2. **可視化工作流**
- Graph 結構天然支援視覺化
- 非技術人員也能理解流程
- 便於需求討論和設計

### 3. **漸進式複雜度**
- 從簡單的單節點圖開始
- 逐步添加更多 Nodes 和 Edges
- 支援快速原型和迭代

### 4. **Human-in-the-Loop 最佳實踐**
- 不是完全自動化
- 在關鍵決策點讓人類介入
- 平衡效率和控制

---

## 📚 推薦學習資源

1. **LangGraph 官方文檔**: https://langchain-ai.github.io/langgraph/
2. **概念指南**: StateGraph, Nodes, Edges, Checkpointing
3. **範例**: Multi-agent systems, Human-in-the-loop
4. **最佳實踐**: Error handling, Testing, Deployment

---

## 🔮 未來可以探索的方向

### 1. **Conditional Routing（條件路由）**
根據 LLM 輸出動態決定下一步

### 2. **Checkpointing（檢查點）**
支援長時間運行的工作流恢復

### 3. **Multi-Agent Collaboration（多 Agent 協作）**
多個專業 Agents 互相調用

### 4. **Streaming UI Updates（流式 UI 更新）**
實時顯示 Agent 的思考過程

---

**總結**: LangGraph 為我們提供了一個強大、靈活、類型安全的 AI Agent 框架，讓複雜的 SLO 自動化工作流變得清晰易懂。
