import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Truelist from "truelist";

export function registerTools(server: McpServer, client: Truelist) {
  server.tool(
    "validate_email",
    "Validate an email address for deliverability using Truelist. Returns state (valid/invalid/risky/unknown), sub_state, and metadata like free_email, role, and disposable flags.",
    { email: z.string().email() },
    async ({ email }) => {
      const result = await client.email.validate(email);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                email,
                state: result.state,
                sub_state: result.subState,
                suggestion: result.suggestion,
                free_email: result.freeEmail,
                role: result.role,
                disposable: result.disposable,
                is_valid: result.state === "valid",
                is_deliverable:
                  result.state === "valid" || result.state === "risky",
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "validate_emails",
    "Validate multiple email addresses for deliverability in a single batch. Returns an array of results with state and sub_state for each email. Maximum 50 emails per request.",
    { emails: z.array(z.string().email()).min(1).max(50) },
    async ({ emails }) => {
      const results = await Promise.all(
        emails.map(async (email) => {
          try {
            const result = await client.email.validate(email);
            return {
              email,
              state: result.state,
              sub_state: result.subState,
              is_valid: result.state === "valid",
            };
          } catch {
            return {
              email,
              state: "unknown",
              sub_state: "unknown",
              is_valid: false,
              error: true,
            };
          }
        }),
      );
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    "check_account",
    "Check your Truelist account info including current plan and remaining email validation credits.",
    {},
    async () => {
      const account = await client.account.get();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(account, null, 2),
          },
        ],
      };
    },
  );
}
