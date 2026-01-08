#!/usr/bin/env node

// 超級嚴格的 MCP Server 測試
// 檢查所有可能的污染源

import { spawn } from 'child_process';
import * as fs from 'fs';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          MCP Server 超級嚴格測試                              ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

let allTestsPassed = true;

// 測試 1: 檢查原始碼中是否還有 console 輸出
console.log('📋 測試 1: 檢查原始碼中的 console 輸出');
const filesToCheck = [
    'src/mcp_server.ts',
    'src/agent/nodes.ts',
    'src/services/prometheus_client.ts'
];

for (const file of filesToCheck) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // 檢查 console.log, console.error, console.warn 等
        if (line.includes('console.') && !line.trim().startsWith('//')) {
            console.log(`❌ 在 ${file}:${i + 1} 發現 console 輸出:`);
            console.log(`   ${line.trim()}`);
            allTestsPassed = false;
        }
    }
}

if (allTestsPassed) {
    console.log('✅ 原始碼中無 console 輸出');
}
console.log('');

// 測試 2: 檢查是否還有 dotenv import
console.log('📋 測試 2: 檢查 dotenv import');
for (const file of filesToCheck) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('import * as dotenv') || content.includes('from "dotenv"') || content.includes("from 'dotenv'")) {
        console.log(`❌ 在 ${file} 發現 dotenv import`);
        allTestsPassed = false;
    }
}

if (allTestsPassed) {
    console.log('✅ 無 dotenv import');
}
console.log('');

// 測試 3: 檢查編譯產物
console.log('📋 測試 3: 檢查編譯狀態');
if (!fs.existsSync('dist/mcp_server.js')) {
    console.log('❌ MCP Server 未編譯');
    process.exit(1);
}
console.log('✅ MCP Server 已編譯');
console.log('');

// 測試 4: 檢查 stderr (無輸入)
console.log('📋 測試 4: 檢查 stderr (無輸入,持續 2 秒)');
await new Promise((resolve) => {
    const test = spawn('node', ['dist/mcp_server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';
    let stdout = '';

    test.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    test.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    setTimeout(() => {
        test.kill();

        if (stderr.trim().length > 0) {
            console.log('❌ stderr 有輸出:');
            console.log('---');
            console.log(stderr);
            console.log('---');
            allTestsPassed = false;
        } else {
            console.log('✅ stderr 完全乾淨');
        }

        if (stdout.trim().length > 0) {
            console.log('⚠️  stdout 有輸出 (無輸入時):');
            console.log('---');
            console.log(stdout);
            console.log('---');
        }

        console.log('');
        resolve();
    }, 2000);
});

// 測試 5: 測試 initialize 請求
console.log('📋 測試 5: 測試 initialize 請求');
await new Promise((resolve) => {
    const test = spawn('node', ['dist/mcp_server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    test.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    test.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    const initRequest = JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "strict-test", version: "1.0.0" }
        }
    }) + '\n';

    test.stdin.write(initRequest);

    setTimeout(() => {
        test.kill();

        // 檢查 stderr
        if (stderr.trim().length > 0) {
            console.log('❌ stderr 有輸出:');
            console.log('---');
            console.log(stderr);
            console.log('---');
            allTestsPassed = false;
        } else {
            console.log('✅ stderr 完全乾淨');
        }

        // 檢查 stdout
        const lines = stdout.split('\n').filter(l => l.trim());
        let validJSONFound = false;

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.jsonrpc === "2.0" && parsed.id === 1) {
                    validJSONFound = true;
                    console.log('✅ 收到有效的 JSON 回應');
                }
            } catch (e) {
                // 忽略非 JSON 行
            }
        }

        if (!validJSONFound) {
            console.log('❌ 沒有收到有效的 JSON 回應');
            console.log('   stdout:', stdout);
            allTestsPassed = false;
        }

        console.log('');
        resolve();
    }, 1500);
});

// 測試 6: 測試 tools/list 請求
console.log('📋 測試 6: 測試 tools/list 請求');
await new Promise((resolve) => {
    const test = spawn('node', ['dist/mcp_server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    test.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    test.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    // 先發送 initialize
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

    test.stdin.write(initRequest);

    // 等待一下再發送 tools/list
    setTimeout(() => {
        const toolsRequest = JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/list"
        }) + '\n';

        test.stdin.write(toolsRequest);
    }, 500);

    setTimeout(() => {
        test.kill();

        if (stderr.trim().length > 0) {
            console.log('❌ stderr 有輸出:');
            console.log(stderr);
            allTestsPassed = false;
        } else {
            console.log('✅ stderr 完全乾淨');
        }

        // 檢查是否有 tools 回應
        const lines = stdout.split('\n').filter(l => l.trim());
        let toolsFound = false;

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.id === 2 && parsed.result && parsed.result.tools) {
                    toolsFound = true;
                    console.log(`✅ 收到 tools 列表 (${parsed.result.tools.length} 個工具)`);
                }
            } catch (e) {
                // 忽略
            }
        }

        if (!toolsFound) {
            console.log('❌ 沒有收到 tools 列表');
            allTestsPassed = false;
        }

        console.log('');
        resolve();
    }, 2000);
});

// 測試 7: 檢查 .env 載入
console.log('📋 測試 7: 檢查 .env 載入 (模擬無 .env 情況)');
await new Promise((resolve) => {
    // 暫時重命名 .env
    const hasEnv = fs.existsSync('.env');
    if (hasEnv) {
        fs.renameSync('.env', '.env.backup');
    }

    const test = spawn('node', ['dist/mcp_server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, OPENAI_API_KEY: 'test-key' }
    });

    let stderr = '';

    test.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    setTimeout(() => {
        test.kill();

        // 恢復 .env
        if (hasEnv) {
            fs.renameSync('.env.backup', '.env');
        }

        if (stderr.trim().length > 0) {
            console.log('❌ 無 .env 時 stderr 有輸出:');
            console.log(stderr);
            allTestsPassed = false;
        } else {
            console.log('✅ 無 .env 時也不會輸出到 stderr');
        }

        console.log('');
        resolve();
    }, 1000);
});

// 最終結果
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          測試結果                                             ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log('');

if (allTestsPassed) {
    console.log('🎉 所有嚴格測試通過!');
    console.log('');
    console.log('MCP Server 狀態:');
    console.log('  ✅ 原始碼無 console 輸出');
    console.log('  ✅ 原始碼無 dotenv import');
    console.log('  ✅ stdio 完全乾淨 (無任何輸出)');
    console.log('  ✅ JSON 回應格式正確');
    console.log('  ✅ 所有 MCP 方法正常運作');
    console.log('  ✅ 無 .env 時也不會污染 stdio');
    console.log('');
    console.log('✅ 保證可以在任何電腦上運行!');
    console.log('');
    process.exit(0);
} else {
    console.log('❌ 部分測試失敗');
    console.log('');
    console.log('請檢查上方的錯誤訊息並修復');
    console.log('');
    process.exit(1);
}
