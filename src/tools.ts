import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Truelist from "truelist";

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResult = Record<string, any>;

export function registerTools(server: McpServer, client: Truelist) {
  server.tool(
    "validate_email",
    "Validate an email address for deliverability using Truelist. Returns state (ok/email_invalid/risky/accept_all/unknown), sub_state, and metadata like domain, canonical, mx_record, first_name, last_name, and verified_at.",
    { email: z.string().email() },
    async ({ email }) => {
      const result: ApiResult = await client.email.validate(email);
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
                domain: result.domain,
                canonical: result.canonical,
                mx_record: result.mxRecord,
                first_name: result.firstName,
                last_name: result.lastName,
                verified_at: result.verifiedAt,
                is_valid: result.state === "ok",
                is_deliverable:
                  result.state === "ok" ||
                  result.state === "risky" ||
                  result.state === "accept_all",
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
              const result: ApiResult = await client.email.validate(email);
              return {
                email,
                state: result.state as string,
                sub_state: result.subState as string,
                is_valid: result.state === "ok",
              };
            } catch (err) {
              const message =
                err instanceof Error ? err.message : String(err);
              return {
                email,
                state: "unknown",
                sub_state: "unknown_error",
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
    "Check your Truelist account info including name, email, plan, and admin status.",
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
