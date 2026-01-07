#!/usr/bin/env node
/**
 * Simple MCP Client to test the SLO AI Agent MCP Server
 * 
 * Usage:
 *   node test_mcp_client.js
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testMCPServer() {
    console.log("🚀 Starting MCP Client Test...\n");

    // Start the MCP server as a child process
    const serverProcess = spawn("node", ["dist/mcp_server.js"], {
        stdio: ["pipe", "pipe", "inherit"], // stdin, stdout, stderr
    });

    // Create MCP client with stdio transport
    const transport = new StdioClientTransport({
        command: "node",
        args: ["dist/mcp_server.js"],
    });

    const client = new Client(
        {
            name: "test-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        }
    );

    try {
        // Connect to the server
        console.log("📡 Connecting to MCP server...");
        await client.connect(transport);
        console.log("✅ Connected successfully!\n");

        // Test 1: List available tools
        console.log("📋 Test 1: Listing available tools...");
        const toolsResponse = await client.listTools();
        console.log(`Found ${toolsResponse.tools.length} tools:`);
        toolsResponse.tools.forEach((tool, index) => {
            console.log(`  ${index + 1}. ${tool.name} - ${tool.description}`);
        });
        console.log("");

        // Test 2: Call recommend_slos tool
        console.log("🤖 Test 2: Calling 'recommend_slos' tool...");
        const k8sManifest = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: app
        image: nginx:latest
        ports:
        - containerPort: 80
`;

        const recommendResponse = await client.callTool({
            name: "recommend_slos",
            arguments: {
                k8s_manifests: k8sManifest,
            },
        });

        console.log("✅ Response received:");
        console.log(JSON.stringify(recommendResponse, null, 2));
        console.log("");

        // Test 3: Call generate_artifacts tool
        console.log("🤖 Test 3: Calling 'generate_artifacts' tool...");

        // Parse the recommended SLOs from the previous response
        let slos = [];
        if (recommendResponse.content && recommendResponse.content[0]) {
            const content = recommendResponse.content[0];
            if (content.type === 'text') {
                try {
                    const parsed = JSON.parse(content.text);
                    slos = parsed.slos || parsed.recommendedSLOs || [];
                } catch (e) {
                    console.log("⚠️  Could not parse SLOs, using empty array");
                }
            }
        }

        if (slos.length > 0) {
            // Take only first 2 SLOs for testing
            const selectedSLOs = slos.slice(0, 2);

            const generateResponse = await client.callTool({
                name: "generate_artifacts",
                arguments: {
                    selected_slos: JSON.stringify(selectedSLOs),
                },
            });

            console.log("✅ Artifacts generated:");
            console.log(JSON.stringify(generateResponse, null, 2));
        } else {
            console.log("⚠️  Skipping generate_artifacts test (no SLOs available)");
        }

        console.log("\n✨ All tests completed successfully!");

    } catch (error) {
        console.error("❌ Error during testing:", error);
        if (error.message) {
            console.error("   Message:", error.message);
        }
    } finally {
        // Clean up
        console.log("\n🧹 Cleaning up...");
        await client.close();
        serverProcess.kill();
        console.log("✅ Test client closed");
    }
}

// Run the test
testMCPServer().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
