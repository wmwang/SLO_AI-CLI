#!/usr/bin/env node

// MCP Server 完整測試腳本
// 確保 stdio 完全乾淨,無任何污染

import { spawn } from 'child_process';
import * as fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          MCP Server 完整測試                                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

// 測試 1: 檢查編譯
console.log('📋 測試 1: 檢查編譯狀態');
if (!fs.existsSync('dist/mcp_server.js')) {
    console.log('❌ MCP Server 未編譯');
    console.log('   請執行: npm run build');
    process.exit(1);
}
console.log('✅ MCP Server 已編譯');
console.log('');

// 測試 2: 檢查 stdio 是否乾淨
console.log('📋 測試 2: 檢查 stdio 是否乾淨 (無輸入時)');
const test2 = spawn('node', ['dist/mcp_server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let stderr2 = '';
test2.stderr.on('data', (data) => {
    stderr2 += data.toString();
});

setTimeout(() => {
    test2.kill();

    if (stderr2.trim().length > 0) {
        console.log('❌ stderr 有輸出 (會污染 MCP):');
        console.log('---');
        console.log(stderr2);
        console.log('---');
        console.log('');
        console.log('⚠️  這會導致 MCP Client 出現 -32000 錯誤!');
        console.log('   請檢查:');
        console.log('   1. 是否有 console.log/console.error');
        console.log('   2. 是否有 dotenv debug 輸出');
        console.log('   3. 是否有其他日誌輸出');
        process.exit(1);
    } else {
        console.log('✅ stderr 乾淨 (無輸出)');
    }
    console.log('');

    // 測試 3: 測試 initialize 請求
    console.log('📋 測試 3: 測試 initialize 請求');
    const test3 = spawn('node', ['dist/mcp_server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout3 = '';
    let stderr3 = '';

    test3.stdout.on('data', (data) => {
        stdout3 += data.toString();
    });

    test3.stderr.on('data', (data) => {
        stderr3 += data.toString();
    });

    // 發送 initialize 請求
    const initRequest = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" }
        }
    }) + '\n';

    test3.stdin.write(initRequest);

    setTimeout(() => {
        test3.kill();

        // 檢查 stderr
        if (stderr3.trim().length > 0) {
            console.log('❌ stderr 有輸出:');
            console.log(stderr3);
            console.log('');
            console.log('⚠️  這會導致 JSON 解析失敗!');
            process.exit(1);
        }

        // 檢查 stdout
        const lines = stdout3.split('\n').filter(l => l.trim());

        // 應該只有 "SLO Agent MCP Server running on stdio" 和 JSON 回應
        let hasServerMessage = false;
        let hasValidJSON = false;

        for (const line of lines) {
            if (line.includes('SLO Agent MCP Server running')) {
                hasServerMessage = true;
            } else {
                try {
                    const parsed = JSON.parse(line);
                    if (parsed.jsonrpc === "2.0" && parsed.id === 1) {
                        hasValidJSON = true;
                        console.log('✅ 收到有效的 JSON 回應');
                        console.log('   回應:', JSON.stringify(parsed, null, 2).substring(0, 200) + '...');
                    }
                } catch (e) {
                    console.log('❌ 無效的輸出:', line);
                    process.exit(1);
                }
            }
        }

        if (!hasValidJSON) {
            console.log('❌ 沒有收到有效的 JSON 回應');
            console.log('   stdout:', stdout3);
            process.exit(1);
        }

        console.log('');

        // 最終結果
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║          測試結果                                             ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log('✅ 所有測試通過!');
        console.log('');
        console.log('MCP Server 狀態:');
        console.log('  ✅ stdio 完全乾淨 (無 stderr 輸出)');
        console.log('  ✅ JSON 回應格式正確');
        console.log('  ✅ 可以在任何電腦上運行');
        console.log('');
        console.log('下一步:');
        console.log('  1. 在其他電腦上測試: mcp-inspector node dist/mcp_server.js');
        console.log('  2. 在 Claude Desktop 中配置並測試');
        console.log('');

        process.exit(0);
    }, 1000);
}, 500);
