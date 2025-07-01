import OpenAI from "openai";
import dotenv from "dotenv";
import { exec } from "node:child_process";
import readline from "readline";

// Load environment variables from .env
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Create readline interface for terminal input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Your local functions that might be called by the AI
function getWeatherInfo(cityName) {
  return `${cityName} has 30°C temperature.`;
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 10000 }, function (err, stdout, stderr) {
      if (err) {
        reject(`Error executing command: ${err.message}`);
        return;
      }
      resolve(
        stdout || stderr || "Command executed successfully with no output"
      );
    });
  });
}

const TOOL_MAP = {
  getWeatherInfo: getWeatherInfo,
  executeCommand: executeCommand,
};

const SYSTEM_PROMPT = `
You are a helpful AI assistant who is designed to resolve user queries.
You work on START, THINK, ACTION, OBSERVE and OUTPUT Mode.
In the start phase user give you a query,
Then, you THINK how to resolve that query at least 2-3 times and make sure that all is clear.
if there is need to call a tool, you call ACTION event with tool and input parameters.
if there is an ACTION call, wait for the OBSERVE that is output of the tool.
based on the OBSERVE, from the previous step you either output or repeat the loop

Rules:
  - always with switch the terminal with the help of running the command cmd
  - always wait for next step 
  - always output a single step and wait for the next step
  - output must be strictly JSON
  - only call tool action from available tools only
  - strictly follow the output format in JSON
  - if need to write tons/more than limitation of characters into the file then write in the chunks 

Available tools:
  - getWeatherInfo(cityName: string): Return weather information for a city
  - executeCommand(command: string): Return String execute a given command compatible with cmd.exe on user's device and return the stdout and stderr

OUTPUT Format:
{"step": "String", "tool": "String", "input": "String", "content": "String"}

Example workflow:
User: "what is weather of patiala?"
{"step": "think", "content": "The user is asking about the weather in Patiala."}
{"step": "think", "content": "I need to use the getWeatherInfo tool with Patiala as input."}
{"step": "action", "tool": "getWeatherInfo", "input": "Patiala"}
{"step": "observe", "content": "Patiala has 30°C temperature."}
{"step": "think", "content": "I have the weather information for Patiala."}
{"step": "output", "content": "The weather in Patiala is 30°C, which is quite warm! 🌞"}
`;

// Function to get user input
function getUserInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Function to process a single query
async function processQuery(userQuery) {
  try {
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];

    console.log(`👤 User: ${userQuery}`);
    messages.push({ role: "user", content: userQuery });

    while (true) {
      try {
        const response = await openai.chat.completions.create({
          // model: "gemini-2.5-pro",
          model: "gemini-2.5-flash",
          // model: "gemini-2.0-flash-exp",
          // model: "gemini-2.0-flash",
          // model: "gemini-1.5-flash",
          response_format: { type: "json_object" },
          messages: messages,
        });

        const responseContent = response.choices[0].message.content;

        // Add AI response to messages
        messages.push({
          role: "assistant",
          content: responseContent,
        });

        const parsed_response = JSON.parse(responseContent);

        if (parsed_response.step === "think") {
          console.log(`🧠 Thinking: ${parsed_response.content}\n`);
          continue;
        }

        if (parsed_response.step === "output") {
          console.log(`🎯 Final Answer: ${parsed_response.content}\n`);
          console.log(""); // Add blank line for readability
          return; // Exit this query processing
        }

        if (parsed_response.step === "action") {
          const tool = parsed_response.tool;
          const input = parsed_response.input;

          if (!TOOL_MAP[tool]) {
            console.log(`❌ Error: Tool '${tool}' not found\n`);
            messages.push({
              role: "user",
              content: JSON.stringify({
                step: "observe",
                content: `Error: Tool '${tool}' is not available`,
              }),
            });
            continue;
          }

          console.log(`🔧 Executing: ${tool} with input: ${input}\n`);

          try {
            const result = await TOOL_MAP[tool](input);
            console.log(`✅ Tool Result: ${result}\n`);

            // Add observation as user message
            messages.push({
              role: "user",
              content: JSON.stringify({
                step: "observe",
                content: result,
              }),
            });
          } catch (toolError) {
            console.log(`❌ Tool Error: ${toolError}\n`);
            messages.push({
              role: "user",
              content: JSON.stringify({
                step: "observe",
                content: `Tool execution failed: ${toolError}`,
              }),
            });
          }
          continue;
        }

        if (parsed_response.step === "observe") {
          console.log(`👁️ Observing: ${parsed_response.content}\n`);
          continue;
        }

        // If we get here, it's an unexpected step
        console.log(`⚠️ Unexpected step: ${parsed_response.step}\n`);
      } catch (apiError) {
        console.error(`❌ API Error: ${apiError.message}\n`);
        if (apiError.status === 400) {
          console.error(
            "This might be due to invalid request format or model issues"
          );
          console.error("Last message:", messages[messages.length - 1]);
        }
        return; // Exit this query processing on error
      }
    }
  } catch (error) {
    console.error(`❌ Fatal Error: ${error.message}\n`);
    console.error("Stack:", error.stack);
  }
}

// Main interactive loop
async function startInteractiveSession() {
  console.log("🚀 Starting AI Assistant...");
  console.log(
    "💡 Type your queries below. Type 'exit', 'quit', or 'q' to stop.\n"
  );

  while (true) {
    try {
      const userQuery = await getUserInput("🤖 Enter your query: ");

      // Check for exit commands
      if (
        userQuery.toLowerCase() === "exit" ||
        userQuery.toLowerCase() === "quit" ||
        userQuery.toLowerCase() === "q"
      ) {
        console.log("👋 Thank you for using the AI Assistant. Goodbye!\n");
        break;
      }

      // Skip empty queries
      if (!userQuery) {
        console.log("⚠️ Please enter a valid query.\n");
        continue;
      }

      // Process the query
      await processQuery(userQuery);
    } catch (error) {
      console.error(`❌ Error in interactive session: ${error.message}\n`);
      console.log("Please try again.\n");
    }
  }

  // Close readline interface
  rl.close();
}

// Add graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down gracefully...");
  rl.close();
  process.exit(0);
});

// Start the interactive session
startInteractiveSession();
