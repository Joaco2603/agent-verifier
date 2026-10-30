function tokens(rest) {
  const paths = [];
  let index = 0;
  while (index < rest.length) {
    while (rest[index] === " ") index += 1;
    if (index >= rest.length) break;
    if (rest[index] === '"') {
      let value = "";
      index += 1;
      while (index < rest.length && rest[index] !== '"') {
        if (rest[index] === "\\" && index + 1 < rest.length) {
          value += rest[index + 1];
          index += 2;
          continue;
        }
        value += rest[index];
        index += 1;
      }
      if (rest[index] === '"') index += 1;
      paths.push(value);
      continue;
    }
    const next = rest.indexOf(" ", index);
    const end = next === -1 ? rest.length : next;
    paths.push(rest.slice(index, end));
    index = end;
  }
  return paths;
}

function stripSide(path) {
  if (path.startsWith("a/") || path.startsWith("b/")) return path.slice(2);
  return path;
}

function underContracts(path) {
  return stripSide(path).startsWith("contracts/");
}

function pathsOn(line) {
  if (line.startsWith("diff --git ")) return tokens(line.slice("diff --git ".length));
  if (line.startsWith("rename from ")) return [line.slice("rename from ".length)];
  if (line.startsWith("rename to ")) return [line.slice("rename to ".length)];
  if (line.startsWith("--- ") || line.startsWith("+++ ")) {
    const path = line.slice(4).split("\t")[0];
    return path === "/dev/null" ? [] : [path];
  }
  return [];
}

export function contractsChanged(diffText) {
  for (const line of String(diffText ?? "").split("\n")) {
    if (pathsOn(line).some(underContracts)) return true;
  }
  return false;
}
