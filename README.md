# 🧠 AI Terminal Agent — Gemini-Powered CLI Assistant

A smart and interactive terminal-based AI assistant built with Node.js and powered by Google Gemini. It processes user queries using a structured reasoning loop (Think → Act → Observe → Output), executes system commands, and responds intelligently in real-time.

## ✨ Features

* 🔄 Structured Think/Act/Observe/Output reasoning cycle
* ⚙️ Tool calling support (e.g., `shell commands`, `weather info`, etc.)
* 🧠 Powered by **Google Gemini API** with fallback model support
* 💬 Interactive CLI interface using `readline` and JSON-based responses
* 🚫 Graceful handling of errors, API rate limits, and command failures
* 📦 Available as an `npx` CLI tool – no install required

---

## 🚀 Quick Start

### Option 1: Run Instantly with `npx` (Recommended)

> 💡 Perfect for trying it out without cloning or installing anything.

```bash
# PowerShell
$env:GEMINI_API_KEY="your-api-key"; npx sk-cli-agent

# CMD
set GEMINI_API_KEY=your-api-key && npx sk-cli-agent

# Linux / macOS
GEMINI_API_KEY=your-api-key npx sk-cli-agent
```

---

### Option 2: Clone & Run Locally

```bash
git clone https://github.com/Saurav-gitus/ai-terminal-agent.git
cd ai-terminal-agent
pnpm install
```

#### Set the `GEMINI_API_KEY` Environment Variable

Before running the agent, set your [Gemini API key](https://aistudio.google.com/app/apikey) as an environment variable:

* **Windows PowerShell:**

  ```powershell
  $env:GEMINI_API_KEY="your-api-key"; node index.js
  ```

* **Windows CMD:**

  ```cmd
  set GEMINI_API_KEY=your-api-key && node index.js
  ```

* **Linux / macOS:**

  ```bash
  GEMINI_API_KEY=your-api-key node index.js
  ```

---

## 💡 Example Tools Available

* `getWeatherInfo(cityName)` → Returns dummy weather info for testing
* `executeCommand(command)` → Executes system shell commands safely

Example:

```
🧠 Enter your query: show all files
🔧 Executing: executeCommand with input: dir
✅ Tool Result: file1.txt file2.js ...
```

---

## 🤩 Tech Stack

* **Node.js** (ES Modules)
* **Gemini API** via REST
* **CLI**: `readline`, `child_process`, `chalk`
* **Package Manager**: `pnpm`
* **Structured Output**: JSON-based AI responses

---

## 🧪 Development Tips

To run in development mode with file watching:

```bash
node --watch index.js
```

---

## 🧠 AI Reasoning Design

Each AI response follows a structured reasoning pattern:

1. **THINK**: Understand the user's query
2. **ACTION**: Call relevant tools or functions
3. **OBSERVE**: Analyze tool output
4. **OUTPUT**: Give final answer
5. **VERIFY**: Double-check the result
6. **CORRECT**: (Optional) Retry if needed

---

## 📦 Published Package

This project is available on npm as:

```
npx sk-cli-agent
```

→ [View on npm](https://www.npmjs.com/package/sk-cli-agent)

---

## 📄 License

MIT © [Saurav Kumar](https://github.com/Saurav-gitus/cli-agent/edit/main/LICENSE)
