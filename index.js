#!/usr/bin/env node

import OpenAI from "openai";
import { exec } from "node:child_process";
import readline from "readline";
import chalk from "chalk";

import { SYSTEM_PROMPT } from "./prompt.js";

// Required API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY environment variable.\n");
  console.error("Please set it before running the tool.\n");
  console.error(
    "👉 Example (Windows):   set GEMINI_API_KEY=your-key && npx sk-ai-terminal-agent"
  );
  console.error(
    "👉 Example (Linux/macOS): GEMINI_API_KEY=your-key npx sk-ai-terminal-agent\n"
  );
  process.exit(1);
}

// Gemini Models to try on fallback
const GEMINI_MODELS = [
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

let currentModelIndex = 0;

// Initialize OpenAI Client
const openai = new OpenAI({
  apiKey: GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Readline setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Tools
const TOOL_MAP = {
  getWeatherInfo: (cityName) => `${cityName} has 30°C temperature.`,
  executeCommand: (command) =>
    new Promise((resolve, reject) => {
      exec(command, { timeout: 10000 }, (err, stdout, stderr) => {
        if (err) reject(`Error executing command: ${err.message}`);
        else
          resolve(
            stdout || stderr || "Command executed successfully with no output"
          );
      });
    }),
};

function getUserInput(prompt) {
  return new Promise((resolve) =>
    rl.question(prompt, (answer) => resolve(answer.trim()))
  );
}

async function processQuery(userQuery) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];
  messages.push({ role: "user", content: userQuery });

  let completed = false;

  while (!completed && currentModelIndex < GEMINI_MODELS.length) {
    const currentModel = GEMINI_MODELS[currentModelIndex];

    try {
      const response = await openai.chat.completions.create({
        model: currentModel,
        response_format: { type: "json_object" },
        messages,
      });

      const responseContent = response.choices[0].message.content;
      messages.push({ role: "assistant", content: responseContent });

      const parsed = JSON.parse(responseContent);
      const { step, tool, input, content } = parsed;

      if (step === "think") {
        console.log(`${chalk.bold(`🧠 Thinking:`)} ${content}\n`);
      } else if (step === "output") {
        console.log(chalk.green(`🎯 Final Answer: ${content}\n`));
        const terminalWidth = process.stdout.columns || 80;
        const modelMsg = `🤖 ${currentModel}`;
        const paddedMsg = modelMsg.padStart(terminalWidth);
        console.log(chalk.yellow(paddedMsg) + "\n");
        completed = true;
      } else if (step === "action") {
        if (!TOOL_MAP[tool]) {
          console.log(`❌ Error: Tool '${tool}' not found\n`);
          messages.push({
            role: "user",
            content: JSON.stringify({
              step: "observe",
              content: `Error: Tool '${tool}' is not available`,
            }),
          });
        } else {
          console.log(
            `${chalk.bold(`🔧 Executing:`)} ${tool} with input: ${input}\n`
          );
          try {
            const result = await TOOL_MAP[tool](input);
            console.log(chalk.green(`✅ Tool Result: ${result}\n`));
            messages.push({
              role: "user",
              content: JSON.stringify({ step: "observe", content: result }),
            });
          } catch (err) {
            console.log(`❌ Tool Error: ${err}\n`);
            messages.push({
              role: "user",
              content: JSON.stringify({
                step: "observe",
                content: `Tool execution failed: ${err}`,
              }),
            });
          }
        }
      } else if (step === "observe") {
        console.log(chalk.bold(`👁️ Observing: ${content}\n`));
      } else {
        console.log(chalk.yellow(`⚠️ Unexpected step: ${step}\n`));
      }
    } catch (apiError) {
      console.error(`❌ API Error: ${apiError.message || "Unknown error"}\n`);

      if (apiError.status === 429) {
        console.error(
          chalk.bold(
            "🚫 You have exceeded your Gemini API quota or rate limit."
          )
        );
        console.error("💡 Trying fallback model...\n");
        currentModelIndex++;
        if (currentModelIndex < GEMINI_MODELS.length) {
          console.log(
            `🔁 Switching to model: ${GEMINI_MODELS[currentModelIndex]}\n`
          );
          continue;
        }
      } else if (apiError.status === 400) {
        console.error("⚠️ Invalid request format or unsupported model.");
        console.error(
          "🛠 Last message sent to API:",
          messages[messages.length - 1]
        );
      } else if (apiError.status === 401) {
        console.error("🔑 Invalid API key. Please check your GEMINI_API_KEY.");
      } else if (apiError.status === 403) {
        console.error(
          "⛔ Access forbidden. Your API key might not have permission."
        );
        currentModelIndex++;
        if (currentModelIndex < GEMINI_MODELS.length) {
          console.log(
            `🔁 Switching to model: ${GEMINI_MODELS[currentModelIndex]}\n`
          );
          continue;
        }
      } else if (apiError.status) {
        console.error(`❓ Unhandled status code: ${apiError.status}`);
      } else {
        console.error("❓ Unknown error with no status code.");
      }

      return; // exit on non-recoverable error
    }
  }
}

async function startInteractiveSession() {
  console.log("🚀 Starting AI Assistant...");
  console.log(
    "💡 Type your queries below. Type 'exit', 'quit', or 'q' to stop.\n"
  );

  while (true) {
    const userQuery = await getUserInput(chalk.cyan("🤖 Enter your query: "));
    if (["exit", "quit", "q"].includes(userQuery.toLowerCase())) {
      console.log("👋 Thank you for using the AI Assistant. Goodbye!\n");
      break;
    }

    if (!userQuery) {
      console.log("⚠️ Please enter a valid query.\n");
      continue;
    }

    await processQuery(userQuery);
  }

  rl.close();
}

process.on("SIGINT", () => {
  console.log("\n👋 Gracefully shutting down...");
  rl.close();
  process.exit(0);
});

startInteractiveSession();
