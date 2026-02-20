import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Truelist from "truelist";
import { registerTools } from "./tools.js";

const apiKey = process.env.TRUELIST_API_KEY;
if (!apiKey) {
  console.error("TRUELIST_API_KEY environment variable is required");
  process.exit(1);
}

const server = new McpServer({
  name: "truelist",
  version: "0.1.0",
});

const client = new Truelist(apiKey);

registerTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
