#!/bin/bash

# MCP Server 測試腳本

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          MCP Server 測試                                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 檢查 .env 檔案
if [ ! -f .env ]; then
    echo "❌ 錯誤: .env 檔案不存在"
    echo "請創建 .env 檔案並設定 OPENAI_API_KEY"
    exit 1
fi

echo "✅ .env 檔案存在"
echo ""

# 檢查編譯
if [ ! -f dist/mcp_server.js ]; then
    echo "⚠️  MCP Server 未編譯,正在編譯..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "❌ 編譯失敗"
        exit 1
    fi
    echo "✅ 編譯成功"
else
    echo "✅ MCP Server 已編譯"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          測試 1: 基本啟動測試                                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 測試 MCP Server 是否能正常啟動
echo "🔍 測試 MCP Server 基本啟動..."
echo ""

# 發送 initialize 請求
INIT_REQUEST='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'

# 使用 timeout 避免卡住
RESPONSE=$(echo "$INIT_REQUEST" | timeout 5s node dist/mcp_server.js 2>&1 | grep -v "^\[" | head -1)

if [ -z "$RESPONSE" ]; then
    echo "❌ MCP Server 無回應或啟動失敗"
    echo ""
    echo "可能的原因:"
    echo "  1. OPENAI_API_KEY 未設定"
    echo "  2. 環境變數載入失敗"
    echo "  3. stdio 被污染"
    echo ""
    echo "請執行以下命令查看詳細錯誤:"
    echo "  node dist/mcp_server.js"
    exit 1
fi

# 檢查是否是有效的 JSON
if echo "$RESPONSE" | jq . > /dev/null 2>&1; then
    echo "✅ MCP Server 正常啟動並返回有效 JSON"
    echo ""
    echo "回應:"
    echo "$RESPONSE" | jq .
else
    echo "⚠️  MCP Server 返回了非 JSON 內容"
    echo ""
    echo "回應內容:"
    echo "$RESPONSE"
    echo ""
    echo "這可能表示 stdio 被污染,請檢查:"
    echo "  1. 是否有 console.log/console.error 輸出"
    echo "  2. 是否有 dotenv debug 輸出"
    echo "  3. 是否有其他日誌輸出到 stdout/stderr"
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          測試 2: MCP Inspector 測試                           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 檢查是否安裝了 mcp-inspector
if ! command -v mcp-inspector &> /dev/null; then
    echo "⚠️  mcp-inspector 未安裝"
    echo ""
    echo "安裝方法:"
    echo "  npm install -g @modelcontextprotocol/inspector"
    echo ""
    echo "跳過 MCP Inspector 測試"
else
    echo "✅ mcp-inspector 已安裝"
    echo ""
    echo "啟動 MCP Inspector 測試..."
    echo "請在瀏覽器中測試 MCP Server 功能"
    echo ""
    echo "執行命令:"
    echo "  mcp-inspector node dist/mcp_server.js"
    echo ""
    echo "按 Ctrl+C 取消"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          測試結果總結                                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "✅ MCP Server 基本功能正常"
echo ""
echo "下一步:"
echo "  1. 使用 MCP Inspector 測試: mcp-inspector node dist/mcp_server.js"
echo "  2. 在 Claude Desktop 中配置並測試"
echo "  3. 檢查 agent_interaction.log 查看詳細日誌"
echo ""
