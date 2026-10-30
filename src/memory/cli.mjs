import { openMemory } from "./open.mjs";

const [command, ...rest] = process.argv.slice(2);

function flag(name) {
  const index = rest.indexOf(name);
  if (index === -1 || rest[index + 1] === undefined) return undefined;
  return rest[index + 1];
}

const memory = openMemory();

if (command === "save") {
  const saved = memory.save({
    title: flag("--title"),
    body: flag("--body"),
    type: flag("--type") ?? "decision",
  });
  process.stdout.write(`${saved.id}\n`);
} else if (command === "search") {
  const query = rest.find((arg) => !arg.startsWith("--"));
  const hits = memory.search(query ?? "", { limit: Number(flag("--limit") ?? 5) });
  process.stdout.write(`${JSON.stringify(hits)}\n`);
} else {
  process.stderr.write("usage: memory save --title T --body B [--type decision] | memory search QUERY\n");
  process.exit(1);
}
