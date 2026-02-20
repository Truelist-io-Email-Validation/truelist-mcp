import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Truelist from "truelist";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
      const results: Array<{
        email: string;
        state: string;
        sub_state: string;
        is_valid: boolean;
        error?: string;
      }> = [];

      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        if (i > 0) {
          await sleep(BATCH_DELAY_MS);
        }

        const batch = emails.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (email) => {
            try {
              const result = await client.email.validate(email);
              return {
                email,
                state: result.state,
                sub_state: result.subState,
                is_valid: result.state === "valid",
              };
            } catch (err) {
              const message =
                err instanceof Error ? err.message : String(err);
              return {
                email,
                state: "unknown",
                sub_state: "unknown",
                is_valid: false,
                error: message,
              };
            }
          }),
        );
        results.push(...batchResults);
      }

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
