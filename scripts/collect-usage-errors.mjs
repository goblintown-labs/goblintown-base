#!/usr/bin/env node
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { cwd, env } from "node:process";

function runShell(command, options = {}) {
  try {
    const output = execSync(command, {
      cwd: options.cwd ?? cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 12_000_000,
      shell: "/bin/zsh",
    });
    return {
      command,
      cwd: options.cwd ?? cwd(),
      ok: true,
      output: (output || "").trim().slice(0, 12000),
    };
  } catch (error) {
    const out = `${String(error.stdout ?? "").trim()}${String(error.stdout?.length ? "\n" : "")} ${String(error.stderr ?? "").trim()}`.trim();
    return {
      command,
      cwd: options.cwd ?? cwd(),
      ok: false,
      output: out.slice(0, 12000) || String(error.message || error),
      code: error.status,
    };
  }
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

const reportDir = env.GOBLINTOWN_USAGE_REPORT_DIR || join(cwd(), "artifacts", "usage-collection");
const stamp = new Date().toISOString().replace(/[:.]/gu, "-");
const outputDir = join(reportDir, `run-${stamp}`);
const includeChatgptChecks = String(env.GOBLINTOWN_INCLUDE_CHATGPT_COLLECTION ?? "0") === "1";
const submitDir = env.GOBLINTOWN_USAGE_SUBMIT_DIR;
const telemetryRoot = env.GOBLINTOWN_TELEMETRY_ROOT || join(cwd(), ".goblintown", "telemetry");
const telemetryEvents = join(telemetryRoot, "events.jsonl");

mkdirSync(outputDir, { recursive: true });

const checks = [
  runShell("git branch --show-current"),
  runShell("git status --short -b"),
  runShell("git rev-parse HEAD"),
  runShell("node --version"),
  runShell("npx -y goblintown@latest mcp --doctor"),
  runShell("codex plugin list"),
  runShell("npx -y goblintown@latest mcp --config"),
  runShell("cat $HOME/.agents/plugins/marketplace.json"),
  runShell("cat $HOME/.codex/config.toml"),
  runShell("ls -1 $HOME/.goblintown 2>/dev/null | head -n 20"),
  runShell(`ls -la ${shellQuote(telemetryRoot)} 2>/dev/null || true`),
  runShell(`tail -n 80 ${shellQuote(telemetryEvents)} 2>/dev/null || true`),
  runShell("ps -axo pid=,command | rg -i 'goblintown|electron|codex'"),
  runShell("ls -1 $HOME/Library/Logs | rg -i 'goblintown|codex|electron|node'"),
  runShell("ls -1 $HOME/Library/Logs/DiagnosticReports | rg -i 'goblintown|codex|electron' || true"),
  runShell("npm run verify:plugin-install", { cwd: join(cwd(), "codex-plugin") }),
  ...(includeChatgptChecks
    ? [
        runShell(
          "npm run verify:chatgpt -- --mcp-url https://goblintown-mcp.vercel.app/mcp --connect-url https://goblintown-mcp.vercel.app/mcp",
          { cwd: join(cwd(), "chatgptapp") },
        ),
        runShell("npm run verify:smoke", { cwd: join(cwd(), "chatgptapp") }),
      ]
    : [
        {
          command: "CHATGPT verification (disabled for plugin + desktop beta profile)",
          cwd: cwd(),
          ok: true,
          output: "Set GOBLINTOWN_INCLUDE_CHATGPT_COLLECTION=1 to include hosted ChatGPT checks.",
        },
      ]),
];

const report = {
  generatedAt: new Date().toISOString(),
  host: {
    cwd: cwd(),
    node: env.NODE,
  },
  collectionProfile: {
    mode: "plugin-desktop-beta",
    includeChatgptChecks,
    outputDir,
  },
  telemetryDestination: {
    defaultReportRoot: reportDir,
    submitDir,
    localEvents: telemetryEvents,
  },
  checks,
};

const reportPath = join(outputDir, "usage-collection.json");
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (submitDir) {
  try {
    mkdirSync(submitDir, { recursive: true });
    const submittedPath = join(submitDir, `usage-collection-${stamp}.json`);
    copyFileSync(reportPath, submittedPath);
    report.telemetryDestination.submittedPath = submittedPath;
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`telemetry report mirrored to: ${submittedPath}`);
  } catch (error) {
    console.error(`WARN: failed to mirror telemetry report to ${submitDir}: ${String(error.message ?? error)}`);
  }
}

console.log(`usage collection written: ${reportPath}`);
for (const check of checks) {
  const status = check.ok ? "PASS" : "FAIL";
  console.log(`${status}: ${check.command}`);
}
