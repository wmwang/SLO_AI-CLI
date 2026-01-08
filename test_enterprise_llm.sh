#!/bin/bash

# 企業內部 LLM 配置測試腳本

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          企業內部 LLM 配置測試                                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 檢查 .env 檔案
if [ ! -f .env ]; then
    echo "❌ 錯誤: .env 檔案不存在"
    echo "請創建 .env 檔案並設定以下變數:"
    echo "  OPENAI_API_KEY=your-api-key"
    echo "  OPENAI_MODEL_NAME=your-model-name"
    echo "  OPENAI_API_BASE=https://your-llm-endpoint.com/v1"
    exit 1
fi

echo "✅ .env 檔案存在"
echo ""

# 讀取環境變數
source .env

# 檢查必要變數
echo "📋 檢查環境變數:"
echo ""

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY 未設定"
    exit 1
else
    echo "✅ OPENAI_API_KEY: ${OPENAI_API_KEY:0:20}..."
fi

if [ -z "$OPENAI_MODEL_NAME" ]; then
    echo "⚠️  OPENAI_MODEL_NAME 未設定 (將使用預設值 gpt-4o-mini)"
    OPENAI_MODEL_NAME="gpt-4o-mini"
else
    echo "✅ OPENAI_MODEL_NAME: $OPENAI_MODEL_NAME"
fi

if [ -z "$OPENAI_API_BASE" ]; then
    echo "⚠️  OPENAI_API_BASE 未設定 (將使用 OpenAI 官方 API)"
    OPENAI_API_BASE="https://api.openai.com/v1"
else
    echo "✅ OPENAI_API_BASE: $OPENAI_API_BASE"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          測試 API 連線                                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# 測試 API 端點
echo "🔍 測試 API 端點: $OPENAI_API_BASE/chat/completions"
echo ""

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$OPENAI_API_BASE/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d "{
        \"model\": \"$OPENAI_MODEL_NAME\",
        \"messages\": [{\"role\": \"user\", \"content\": \"test\"}],
        \"max_tokens\": 5
    }" \
    --max-time 10)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API 連線成功 (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ 無法連線到 API 端點"
    echo "   請檢查:"
    echo "   1. OPENAI_API_BASE 是否正確"
    echo "   2. 網路連線是否正常"
    echo "   3. 防火牆設定"
else
    echo "⚠️  API 返回 HTTP $HTTP_CODE"
    echo "   可能的原因:"
    echo "   - API Key 不正確 (401)"
    echo "   - Model Name 不正確 (404)"
    echo "   - API 端點格式錯誤 (400)"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          編譯測試                                             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

echo "🔨 執行 npm run build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ 編譯成功"
else
    echo "❌ 編譯失敗"
    echo "   請執行 'npm run build' 查看詳細錯誤"
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          測試結果總結                                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "🎉 所有測試通過!"
    echo ""
    echo "你的配置已就緒,可以開始使用:"
    echo "  - CLI 模式: npm start"
    echo "  - MCP Server: npm run mcp"
    echo ""
else
    echo "⚠️  部分測試未通過"
    echo ""
    echo "建議:"
    echo "  1. 檢查 .env 檔案中的配置"
    echo "  2. 確認 LLM API 端點可訪問"
    echo "  3. 驗證 API Key 和 Model Name"
    echo ""
fi
