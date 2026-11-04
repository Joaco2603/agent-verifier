#!/usr/bin/env node
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import readline from "node:readline";
import { parse } from "yaml";

const TASKS_DIR = join(dirname(fileURLToPath(import.meta.url)), "experiments", "tasks");

// Cache of loaded tasks
const taskCache = new Map();
let selectedId = null;

// Single persistent readline interface with a line queue.
// Lines that arrive before a question is asked are buffered (fixes the
// EOF-during-startup race); EOF resolves pending asks with null (graceful quit).
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const lineQueue = [];
let lineWaiter = null;
let inputClosed = false;

rl.on("line", (line) => {
  if (lineWaiter) {
    const resolve = lineWaiter;
    lineWaiter = null;
    resolve(line);
  } else {
    lineQueue.push(line);
  }
});
rl.on("close", () => {
  inputClosed = true;
  if (lineWaiter) {
    const resolve = lineWaiter;
    lineWaiter = null;
    resolve(null); // EOF while waiting -> treat as quit
  }
});

function ask(query) {
  return new Promise((resolve) => {
    // Consume buffered lines first; only touch readline if it is still open.
    if (lineQueue.length > 0) {
      process.stdout.write(query);
      resolve(lineQueue.shift());
      return;
    }
    if (inputClosed) {
      resolve(null);
      return;
    }
    rl.setPrompt(query);
    rl.prompt();
    lineWaiter = resolve;
  });
}

// Discover RF ids from the directory (no hardcoded list)
async function listTaskIds() {
  const files = await readdir(TASKS_DIR);
  return files
    .map((f) => f.match(/^RF-(\d+)\.txt$/))
    .filter(Boolean)
    .map((m) => Number(m[1]))
    .sort((a, b) => a - b);
}

// Load a task by ID (cached). Files are zero-padded: RF-01.txt .. RF-20.txt
async function loadTask(id) {
  if (taskCache.has(id)) return taskCache.get(id);

  const file = String(id).padStart(2, "0");
  try {
    const [txtContent, yamlContent] = await Promise.all([
      readFile(join(TASKS_DIR, `RF-${file}.txt`), "utf-8"),
      readFile(join(TASKS_DIR, `RF-${file}.yaml`), "utf-8"),
    ]);

    const spec = parse(yamlContent);

    const task = {
      id,
      label: `RF-${file}`,
      name: spec.name ?? `RF-${file}`,
      priority: spec.priority ?? "normal",
      gate: spec.gate ?? "report",
      sentence: txtContent.trim(),
      yaml: yamlContent,
    };

    taskCache.set(id, task);
    return task;
  } catch {
    return null;
  }
}

// Format a task for display (summary view)
function formatSummary(task) {
  return `${task.label}: ${task.name} | priority: ${task.priority} | gate: ${task.gate}`;
}

// Show detail of a task (full YAML, no truncation)
function showDetail(task) {
  return [
    `=== ${task.label}: ${task.name} ===`,
    `Priority: ${task.priority}`,
    `Gate: ${task.gate}`,
    "",
    "Sentence:",
    `  ${task.sentence}`,
    "",
    "Full YAML:",
    task.yaml,
    "",
  ].join("\n");
}

// Search tasks by sentence or name
async function searchTasks(ids, query) {
  console.clear();
  console.log(`=== Search: "${query}" ===\n`);
  const lowerQuery = query.toLowerCase();
  let found = false;

  for (const id of ids) {
    const task = await loadTask(id);
    if (!task) continue;
    const matches =
      task.sentence.toLowerCase().includes(lowerQuery) ||
      task.name.toLowerCase().includes(lowerQuery) ||
      task.label.toLowerCase().includes(lowerQuery) ||
      String(task.id) === query;

    if (matches) {
      found = true;
      console.log(`${task.label}: ${task.name}`);
      console.log(`  ${task.sentence}`);
      console.log(`  priority: ${task.priority}, gate: ${task.gate}`);
      console.log();
    }
  }

  if (!found) console.log("No matches found.");
  console.log("\nPress Enter to continue...");
  await ask("");
}

// Main function
async function main() {
  const ids = await listTaskIds();
  if (ids.length === 0) {
    console.error(`No RF tasks found in ${TASKS_DIR}`);
    process.exitCode = 1;
    return;
  }

  let running = true;

  while (running) {
    console.clear();
    console.log("=== RF Tasks Explorer ===\n");

    if (selectedId !== null) {
      const task = await loadTask(selectedId);
      if (!task) {
        selectedId = null;
        continue;
      }
      console.log(`Current: ${formatSummary(task)}\n`);
      console.log("Commands:");
      console.log("  'd' - show detail");
      console.log("  'n' - next task");
      console.log("  'p' - previous task");
      console.log("  's' - search");
      console.log("  'q' - quit");
    } else {
      console.log(`Available RF tasks (${ids.length}):\n`);
      for (const id of ids) {
        const task = await loadTask(id);
        if (task) console.log(`  ${formatSummary(task)}`);
      }
      console.log("\nCommands:");
      console.log(`  Enter number (1-${ids.length}) - select task`);
      console.log("  's' - search tasks");
      console.log("  'q' - quit");
    }

    const raw = await ask("> ");
    if (raw === null) break; // EOF (piped input exhausted / Ctrl+D)
    const choice = raw.trim();

    // Numeric selection (strict: digits only)
    if (/^\d+$/.test(choice)) {
      const num = Number(choice);
      if (ids.includes(num)) {
        selectedId = num;
      }
      continue;
    }

    const lower = choice.toLowerCase();

    if (lower === "q") {
      running = false;
    } else if (lower === "s") {
      const query = await ask("Search query: ");
      if (query === null) break;
      await searchTasks(ids, query.trim());
      selectedId = null;
    } else if (selectedId !== null && lower === "d") {
      const task = await loadTask(selectedId);
      if (task) {
        console.clear();
        console.log(showDetail(task));
        console.log("Press Enter to return...");
        await ask("");
      }
    } else if (selectedId !== null && lower === "n") {
      const idx = ids.indexOf(selectedId);
      if (idx >= 0 && idx < ids.length - 1) selectedId = ids[idx + 1];
    } else if (selectedId !== null && lower === "p") {
      const idx = ids.indexOf(selectedId);
      if (idx > 0) selectedId = ids[idx - 1];
    }
    // Anything else: loop redraws (implicit "invalid input" feedback)
  }
}

main()
  .catch((err) => {
    console.error("Error:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close(); // closes stdin -> process exits cleanly
  });
