# truelist-mcp

MCP (Model Context Protocol) server for [Truelist](https://truelist.io) email validation. Lets AI assistants like Claude, Cursor, and VS Code Copilot validate email addresses for deliverability.

## What is this?

This package exposes Truelist's email validation API as MCP tools. Once configured, your AI assistant can:

- Check if an email address is valid and deliverable
- Validate batches of emails at once
- Check your Truelist account credits and plan

## Installation

```bash
npm install -g truelist-mcp
```

Or run directly with `npx`:

```bash
npx truelist-mcp
```

## Configuration

You need a Truelist API key. Get one at [truelist.io](https://truelist.io).

### Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "truelist": {
      "command": "npx",
      "args": ["truelist-mcp"],
      "env": {
        "TRUELIST_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Claude Code

Add to your `.claude/settings.json` or run:

```bash
claude mcp add truelist -- npx truelist-mcp
```

Then set the environment variable:

```bash
export TRUELIST_API_KEY=your-api-key
```

### Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json` in your project or global settings):

```json
{
  "mcpServers": {
    "truelist": {
      "command": "npx",
      "args": ["truelist-mcp"],
      "env": {
        "TRUELIST_API_KEY": "your-api-key"
      }
    }
  }
}
```

### VS Code (GitHub Copilot)

Add to your VS Code settings (`.vscode/mcp.json` in your project):

```json
{
  "servers": {
    "truelist": {
      "command": "npx",
      "args": ["truelist-mcp"],
      "env": {
        "TRUELIST_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Tools

### validate_email

Validate a single email address for deliverability.

**Input:**
```json
{
  "email": "user@example.com"
}
```

**Output:**
```json
{
  "email": "user@example.com",
  "state": "valid",
  "sub_state": "ok",
  "suggestion": null,
  "free_email": true,
  "role": false,
  "disposable": false,
  "is_valid": true,
  "is_deliverable": true
}
```

**States:**
| State | Meaning |
|-------|---------|
| `valid` | Email is deliverable |
| `invalid` | Email is not deliverable |
| `risky` | Email may be deliverable but has risk factors |
| `unknown` | Could not determine deliverability |

**Sub-states:**
| Sub-state | Meaning |
|-----------|---------|
| `ok` | No issues found |
| `accept_all` | Domain accepts all addresses |
| `disposable_address` | Temporary/disposable email |
| `role_address` | Role-based address (info@, support@, etc.) |
| `failed_mx_check` | Domain has no mail server |
| `failed_spam_trap` | Known spam trap address |
| `failed_no_mailbox` | Mailbox does not exist |
| `failed_greylisted` | Server temporarily rejected |
| `failed_syntax_check` | Invalid email syntax |
| `unknown` | Could not determine sub-state |

### validate_emails

Validate multiple email addresses in a single batch (max 50).

**Input:**
```json
{
  "emails": [
    "user@example.com",
    "test@invalid.example",
    "hello@gmail.com"
  ]
}
```

**Output:**
```json
[
  {
    "email": "user@example.com",
    "state": "valid",
    "sub_state": "ok",
    "is_valid": true
  },
  {
    "email": "test@invalid.example",
    "state": "invalid",
    "sub_state": "failed_mx_check",
    "is_valid": false
  },
  {
    "email": "hello@gmail.com",
    "state": "valid",
    "sub_state": "ok",
    "is_valid": true
  }
]
```

### check_account

Check your Truelist account info including plan and remaining credits.

**Input:** none

**Output:**
```json
{
  "email": "you@company.com",
  "plan": "pro",
  "credits": 4850
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TRUELIST_API_KEY` | Yes | Your Truelist API key from [truelist.io](https://truelist.io) |

## Troubleshooting

### "TRUELIST_API_KEY environment variable is required"

The server requires a `TRUELIST_API_KEY` environment variable. Make sure it's set in your MCP configuration's `env` block or exported in your shell.

### Tool not showing up in Claude/Cursor

1. Restart your AI assistant after changing the MCP configuration
2. Check that `npx truelist-mcp` runs without errors when `TRUELIST_API_KEY` is set
3. Verify the config file path is correct for your platform

### Authentication errors

Verify your API key is correct and active at [truelist.io](https://truelist.io). The key should be your server-side API key, not a form validation key.

### Rate limiting

Truelist enforces rate limits on the API. If you hit rate limits, the SDK will automatically retry with exponential backoff. For batch validation, emails are validated concurrently so large batches may trigger rate limits.

## License

MIT
