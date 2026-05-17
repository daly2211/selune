import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

type ClientArgs = {
    serverUrl: string;
    apiKey: string;
    pollInterval: number;
};

const colors = {
    dim: "\x1b[2m",
    reset: "\x1b[0m",
    blue: "\x1b[34m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
};

const useColor = process.stdout.isTTY && process.env.NO_COLOR === undefined;

function colorize(value: string, color: keyof typeof colors) {
    return useColor ? `${colors[color]}${value}${colors.reset}` : value;
}

function timestamp() {
    return colorize(new Date().toLocaleTimeString(), "dim");
}

function logInfo(message: string) {
    console.log(`${timestamp()} ${colorize("info", "blue")}  ${message}`);
}

function logSuccess(message: string) {
    console.log(`${timestamp()} ${colorize("done", "green")}  ${message}`);
}

function logWait(message: string) {
    console.log(`${timestamp()} ${colorize("wait", "yellow")}  ${message}`);
}

function logError(message: string, error?: unknown) {
    console.error(`${timestamp()} ${colorize("error", "red")} ${message}`);
    if (error) console.error(error);
}

function printUsage() {
    console.error(
        [
            "Usage:",
            "  npx tsx scripts/agent-client.ts --server http://localhost:3000 --api-key <key>",
            "",
            "Options:",
            "  --server       Base URL for the Selune server (default: http://localhost:3000)",
            "  --api-key      Workspace API key",
            "  --interval     Poll interval in ms (default: 5000)",
        ].join("\n")
    );
}

function parseArgs(argv: string[]): ClientArgs | null {
    const args = argv.slice(2);
    const result: ClientArgs = {
        serverUrl: "http://localhost:3000",
        apiKey: "",
        pollInterval: 5000,
    };

    for (let i = 0; i < args.length; i += 1) {
        const key = args[i];
        const value = args[i + 1];
        if (!key) continue;

        switch (key) {
            case "--server":
                if (value) result.serverUrl = value;
                i += 1;
                break;
            case "--api-key":
                if (value) result.apiKey = value;
                i += 1;
                break;
            case "--interval":
                if (value) result.pollInterval = Number(value) || 5000;
                i += 1;
                break;
            default:
                console.error(`Unknown argument: ${key}`);
                return null;
        }
    }

    if (!result.apiKey) {
        return null;
    }

    return result;
}

const parsed = parseArgs(process.argv);
if (!parsed) {
    printUsage();
    process.exit(1);
}

const { serverUrl, apiKey, pollInterval } = parsed;

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("x-api-key", apiKey);
    if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
    }
    const response = await fetch(`${serverUrl}${path}`, { ...init, headers });
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed: ${response.status}`);
    }
    return response.json();
}

async function runBob(prompt: string, cwd?: string) {
    const safePrompt = prompt.replace(/[\r\n]+/g, " ").trim();
    logInfo(`Running bob in ${cwd || process.cwd()}`);
    logInfo(`Prompt: ${safePrompt}`);
    return new Promise<{ output: string; exitCode: number }>((resolve) => {
        const child = spawn("bob", [safePrompt, "--yolo"], {
            cwd: cwd || process.cwd(),
            shell: true,
        });

        let output = "";
        child.stdout.on("data", (chunk) => {
            output += chunk.toString();
        });
        child.stderr.on("data", (chunk) => {
            output += chunk.toString();
        });

        child.on("close", (code) => {
            resolve({ output, exitCode: code ?? 0 });
        });
    });
}

async function claimTask() {
    return apiFetch<{
        task: { id: string; title: string; description: string; pushToBranch?: boolean } | null;
        board: { id: string; title: string; projectPath: string } | null;
        projectPath: string;
        prompt?: string;
    }>("/api/agent/claim", {
        method: "POST",
        body: JSON.stringify({}),
    });
}

async function reportResult(cardId: string, output: string, exitCode: number) {
    await apiFetch<{ card: unknown }>("/api/agent/result", {
        method: "POST",
        body: JSON.stringify({ cardId, logs: output, exitCode, destination: "review" }),
    });
}

async function loop() {
    logInfo(`Selune agent client connected to ${serverUrl}`);
    logInfo(`Polling every ${pollInterval}ms`);

    let idlePolls = 0;

    while (true) {
        try {
            const { task, projectPath, board, prompt: claimPrompt } = await claimTask();
            if (!task) {
                idlePolls += 1;
                if (idlePolls === 1 || idlePolls % 12 === 0) {
                    logWait("No task available yet. Listening for work...");
                }
                await delay(pollInterval);
                continue;
            }

            idlePolls = 0;

            if (!claimPrompt) {
                throw new Error("Missing prompt from server");
            }

            const boardName = board?.title ? ` on "${board.title}"` : "";
            logSuccess(`Claimed "${task.title}"${boardName}`);
            const { output, exitCode } = await runBob(claimPrompt, projectPath);
            const status = exitCode === 0 ? "completed" : `finished with exit code ${exitCode}`;
            logInfo(`Bob ${status}; sending result back to Selune`);
            await reportResult(task.id, output, exitCode);
            logSuccess(`Reported "${task.title}"`);
        } catch (error) {
            logError("Agent client error", error);
            await delay(pollInterval);
        }
    }
}

void loop();
