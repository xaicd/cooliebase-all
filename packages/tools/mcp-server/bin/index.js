#!/usr/bin/env node

/**
 * @cooliebase/mcp-server entrypoint
 */

const path = require("node:path")

// 找到真实的 cooliebase-mcp-server.cjs 脚本位置
const serverScript = path.resolve(__dirname, "../../../scripts/mcp/cooliebase-mcp-server.cjs")

require(serverScript)
