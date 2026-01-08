// MCP Server Configuration
// EDIT THIS FILE to set your API keys and settings
// No need for .env files or environment variables

export const MCP_CONFIG = {
    // OpenAI Configuration
    // Replace with your actual API key
    OPENAI_API_KEY: "none",

    // Model name (default: gpt-4o-mini)
    OPENAI_MODEL_NAME: "gpt-4o-mini",

    // Optional: Custom API base URL for self-hosted LLMs
    // Leave empty for official OpenAI API
    OPENAI_API_BASE: "",

    // Prometheus Configuration (optional)
    PROMETHEUS_URL: "",
    PROMETHEUS_API_KEY: "",
    PROMETHEUS_HEADERS: "",
};

// Validation
if (!MCP_CONFIG.OPENAI_API_KEY || MCP_CONFIG.OPENAI_API_KEY === "sk-your-api-key-here") {
    throw new Error(
        "\n" +
        "╔══════════════════════════════════════════════════════════════╗\n" +
        "║  請設定 API Key                                               ║\n" +
        "╚══════════════════════════════════════════════════════════════╝\n" +
        "\n" +
        "請編輯 src/config/mcp_config.ts 檔案\n" +
        "將 OPENAI_API_KEY 改為你的實際 API Key\n" +
        "\n" +
        "範例:\n" +
        "  OPENAI_API_KEY: \"sk-proj-abc123...\",\n" +
        "\n"
    );
}
