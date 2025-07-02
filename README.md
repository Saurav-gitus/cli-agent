# AI Terminal Agent 🤖

A terminal-based smart agent using Node.js and Google Gemini to process queries and call local functions.

## Features

- 🔍 Think/Act/Observe loop agent
- 🛠️ Tool calling support (e.g. shell commands, weather)
- 💬 Terminal input and JSON output
- 🤖 Powered by Gemini LLM

## Run Locally

````bash
git clone https://github.com/Saurav-gitus/ai-terminal-agent.git
cd ai-terminal-agent
pnpm install
### Step 1: Set the `GEMINI_API_KEY` Environment Variable

Before running the agent, you need to set your Gemini API key as an environment variable.

- **Windows PowerShell**:

  ```powershell
  $env:GEMINI_API_KEY="your-api-key"; node index.js
  ```

- **Windows CMD**:

  ```cmd
  set GEMINI_API_KEY=your-api-key && node index.js
  ```

- **Windows Terminal**:
  Use either of the above depending on the shell (CMD or PowerShell).

- **Linux / macOS**:
  ```bash
  GEMINI_API_KEY=your-api-key node index.js
  ```
   ```bash
   node index.js
````

```

```
