function redact(prompt, secrets) {
  let text = prompt ?? "";
  for (const secret of secrets ?? []) {
    if (secret) text = text.split(secret).join("[withheld]");
  }
  return text;
}

function allowedPath(path, allowList) {
  if (path === "contracts" || path.startsWith("contracts/")) return false;
  return allowList.some((entry) => path === entry || path.startsWith(entry.endsWith("/") ? entry : `${entry}/`));
}

function denied(action, allowList, grants) {
  if (action.network && !(grants.network ?? []).includes(action.network)) return "network denied";
  if (action.path && !allowedPath(action.path, allowList)) return "path denied";
  return null;
}

// shortcut: kill applies to the child this function started. It does not catch a process that opened a path before this check. Upgrade when a sandbox runner exists.
export function beginRun(request, spawn = () => {
  throw new Error("spawn");
}, kill = (pid) => {
  process.kill(pid);
}) {
  const promptLog = redact(request.prompt, request.secrets);
  const result = {
    promptLog,
    score: request.score ?? null,
    route: request.route ?? null,
    finding: request.security?.finding ?? null,
    block: request.security?.state === "FAIL",
  };
  if (!request.boundary || !request.allowList?.length) {
    return { ...result, started: false, killed: false, state: "FAIL", reason: "isolation not recorded" };
  }
  const action = request.action ?? {};
  const reason = denied(action, request.allowList, request.grants ?? {});
  if (reason) {
    const child = spawn(action);
    const pid = child?.pid ?? null;
    if (pid) kill(pid);
    return { ...result, started: true, killed: true, pid, state: "FAIL", reason };
  }
  if (result.block) {
    return { ...result, started: false, killed: false, state: "FAIL", reason: "critical security" };
  }
  spawn(action);
  return { ...result, started: true, killed: false, state: "PASS" };
}
