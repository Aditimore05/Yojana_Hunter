#!/usr/bin/env python3
"""
Yojana Hunter Navigation MCP Server (Model Context Protocol).
Exposes tools for dynamic frontend route discovery and navigation over JSON-RPC stdio.
"""

import sys
import json
import logging
from services.navigation_service import (
    NavigationService,
    mcp_list_application_routes,
    mcp_navigate_to_page,
    ROUTES_REGISTRY,
    FRONTEND_BASE_URL
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [MCP] %(message)s", stream=sys.stderr)
logger = logging.getLogger("yojana_hunter_mcp")

TOOLS = [
    {
        "name": "list_application_routes",
        "description": "Lists all verified frontend routes, page titles, access permissions (public/citizen/admin), and exact URLs in Yojana Hunter.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "navigate_to_page",
        "description": "Resolves user queries (e.g. 'Dashboard', 'Schemes', 'Profile', 'AI Scheme Discovery', 'Admin') to the exact frontend route, full URL, prerequisite permissions, and UI steps.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "page_name_or_query": {
                    "type": "string",
                    "description": "The target page or query, such as 'Dashboard', 'Schemes', 'Profile', 'Admin', 'AI Scheme Discovery', 'Documents', etc."
                }
            },
            "required": ["page_name_or_query"]
        }
    }
]

def handle_rpc_request(request: dict) -> dict:
    req_id = request.get("id")
    method = request.get("method")
    params = request.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": {
                    "name": "yojana-hunter-navigation",
                    "version": "1.0.0"
                }
            }
        }

    if method == "notifications/initialized":
        return None

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": TOOLS
            }
        }

    if method == "tools/call":
        tool_name = params.get("name")
        args = params.get("arguments", {})

        if tool_name == "list_application_routes":
            res = mcp_list_application_routes()
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(res, indent=2)
                        }
                    ]
                }
            }

        elif tool_name == "navigate_to_page":
            query = args.get("page_name_or_query", "")
            res = mcp_navigate_to_page(query)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(res, indent=2)
                        }
                    ]
                }
            }

        else:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32601,
                    "message": f"Method or tool '{tool_name}' not found"
                }
            }

    if method == "ping":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {}
        }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {
            "code": -32601,
            "message": f"Method '{method}' not found"
        }
    }

def main():
    logger.info("Yojana Hunter Navigation MCP Server started on stdio.")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
            resp = handle_rpc_request(req)
            if resp is not None:
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()
        except Exception as e:
            logger.error(f"Error handling RPC request: {e}")
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {
                    "code": -32700,
                    "message": f"Parse error: {str(e)}"
                }
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
