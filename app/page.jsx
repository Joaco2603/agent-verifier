"use client";

import { useEffect, useMemo, useState } from "react";

const PRIORITIES = ["normal", "critical"];
const GATES = ["report", "block"];
const OBSERVABLE_TYPES = ["number", "boolean", "string"];
const OPERATORS = ["gt", "gte", "lt", "lte", "eq"];
const EVIDENCE_KINDS = ["example_case", "property"];

function toContract(payload) {
  const { source, sentence, changed, ...contract } = payload;
  return contract;
}

function parseValue(raw) {
  const text = String(raw);
  if (text === "true") return true;
  if (text === "false") return false;
  if (text === "null") return null;
  const asNumber = Number(text);
  if (text !== "" && !Number.isNaN(asNumber) && text === String(asNumber)) return asNumber;
  return text;
}

function displayValue(value) {
  if (value === null) return "null";
  if (value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function options(values) {
  return values.map((value) => <option key={value} value={value}>{value}</option>);
}

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [corpus, setCorpus] = useState(null);
  const [contract, setContract] = useState(null);
  const [baseline, setBaseline] = useState("");
  const [sentence, setSentence] = useState("");
  const [baselineSentence, setBaselineSentence] = useState("");
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("success");
  const [busy, setBusy] = useState("");
  const [approver, setApprover] = useState("");

  async function fetchJson(url, options_) {
    const response = await fetch(url, options_);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function loadLibrary() {
    const data = await fetchJson("/api/tasks");
    setTasks(data.tasks);
    setCorpus(data.corpus);
    return data;
  }

  async function openTask(id) {
    const data = await fetchJson(`/api/tasks/${id}`);
    const next = toContract(data);
    setContract(next);
    setBaseline(JSON.stringify(next));
    setSentence(data.sentence);
    setBaselineSentence(data.sentence);
  }

  useEffect(() => {
    loadLibrary()
      .then((data) => (data.tasks.length ? openTask(data.tasks[0].id) : null))
      .catch((error) => {
        setTone("error");
        setMessage(error.message);
      });
  }, []);

  const visibleTasks = useMemo(() => {
    const query = filter.toLowerCase();
    return tasks.filter((task) =>
      `${task.id} ${task.name} ${task.sentence}`.toLowerCase().includes(query),
    );
  }, [tasks, filter]);

  const dirty = contract !== null && (
    JSON.stringify(contract) !== baseline || sentence !== baselineSentence
  );

  function edit(mutator) {
    setContract((current) => {
      const next = structuredClone(current);
      mutator(next);
      return next;
    });
  }

  function fail(error) {
    setTone("error");
    setMessage(error.message);
  }

  async function save() {
    if (!contract) return;
    setBusy("save");
    setMessage("");
    try {
      const data = await fetchJson(`/api/tasks/${contract.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contract, sentence }),
      });
      const next = toContract(data);
      setContract(next);
      setBaseline(JSON.stringify(next));
      setSentence(data.sentence);
      setBaselineSentence(data.sentence);
      setTone("success");
      setMessage(data.changed
        ? `Saved - revision ${data.revision}, approval reset to draft. npm test stays red until this contract is approved and the corpus is regenerated.`
        : `No changes - revision stays at ${data.revision}.`);
      await loadLibrary();
    } catch (error) {
      fail(error);
    } finally {
      setBusy("");
    }
  }

  async function approve() {
    if (!contract) return;
    setBusy("approve");
    setMessage("");
    try {
      const data = await fetchJson(`/api/tasks/${contract.id}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ by: approver }),
      });
      const next = toContract(data);
      setContract(next);
      setBaseline(JSON.stringify(next));
      setTone("success");
      setMessage(`Approved by ${data.approval.by}. The corpus is now stale - run npm run build:corpus to clear the gate.`);
      await loadLibrary();
    } catch (error) {
      fail(error);
    } finally {
      setBusy("");
    }
  }

  const gateSteps = [];
  if (contract && contract.approval.status === "draft") gateSteps.push("approve this contract (Ready)");
  if (corpus && !corpus.synced) gateSteps.push("regenerate the corpus (npm run build:corpus)");

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">EXPERIMENT WORKBENCH</div>
          <h1>RF Studio</h1>
          <p>Read and shape task contracts as a readable template - no raw YAML.</p>
        </div>
        <div className="badges">
          <div className="source-badge"><span className="dot ok" /> tasks files are source &middot; corpus generated</div>
          <div className={`source-badge ${corpus === null ? "" : corpus.synced ? "is-ok" : "is-stale"}`}>
            <span className={`dot ${corpus === null ? "idle" : corpus.synced ? "ok" : "warn"}`} />
            {corpus === null
              ? "checking corpus..."
              : corpus.synced
                ? "corpus in sync"
                : "corpus stale - run npm run build:corpus"}
          </div>
        </div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="sidebar-heading">
            <span>Task library</span><strong>{tasks.length}</strong>
          </div>
          <input
            className="search"
            placeholder="Search tasks..."
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          <nav>
            {visibleTasks.map((task) => (
              <button
                className={`task-row ${contract?.id === task.id ? "active" : ""}`}
                key={task.id}
                onClick={() => openTask(task.id).catch(fail)}
              >
                <span className="task-id">{task.id}</span>
                <span className="task-name">{task.name}</span>
                <span className={`status ${task.approval?.status}`}>rev {task.revision} · {task.approval?.status}</span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="editor">
          {contract ? (
            <>
              <div className="editor-header">
                <div>
                  <div className="eyebrow">{contract.id} / CONTRACT TEMPLATE</div>
                  <h2>{contract.name}</h2>
                </div>
                <div className="actions">
                  <button className="save" onClick={save} disabled={Boolean(busy) || !dirty}>
                    {busy === "save" ? "Saving..." : dirty ? `Save (revision ${contract.revision + 1})` : "No changes"}
                  </button>
                  {contract.approval.status === "draft" && (
                    <div className="approve-box">
                      <input
                        className="approver"
                        placeholder="Approver name"
                        value={approver}
                        onChange={(event) => setApprover(event.target.value)}
                      />
                      <button
                        className="ready"
                        onClick={approve}
                        disabled={Boolean(busy) || dirty || !approver.trim()}
                        title={dirty ? "Save your edits first" : "Approve this contract"}
                      >
                        {busy === "approve" ? "Approving..." : "Ready"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {dirty && (
                <div className="hint-bar">
                  Unsaved edits - saving bumps revision to {contract.revision + 1} and resets approval to draft.
                </div>
              )}

              {gateSteps.length > 0 && (
                <div className="gate-banner">
                  <b>Workflow gate</b> - <code>npm test</code> stays red until you {gateSteps.join(" and ")}.
                </div>
              )}

              <div className="meta">
                <span className="pill">{contract.priority} priority</span>
                <span className="pill">{contract.gate} gate</span>
                <span className="pill">revision {contract.revision}</span>
                <span className={`pill ${contract.approval.status}`}>{contract.approval.status}</span>
              </div>

              <section className="card prose-card">
                <div className="card-title">Agent prompt <span>experiments/tasks/{contract.id}.txt</span></div>
                <textarea
                  className="sentence"
                  rows={2}
                  value={sentence}
                  onChange={(event) => setSentence(event.target.value)}
                />
                <div className="hint">One plain sentence, no contract markers - this is the only text the agent sees.</div>
              </section>

              <article className="template">
                <section className="doc-section">
                  <h3>Overview</h3>
                  <p className="prose">
                    The contract named{" "}
                    <input
                      className="field wide"
                      value={contract.name}
                      onChange={(event) => edit((draft) => { draft.name = event.target.value; })}
                    />{" "}
                    runs at{" "}
                    <select
                      className="field"
                      value={contract.priority}
                      onChange={(event) => edit((draft) => {
                        draft.priority = event.target.value;
                        if (draft.priority === "critical") draft.gate = "block";
                      })}
                    >
                      {options(PRIORITIES)}
                    </select>{" "}
                    priority through the{" "}
                    <select
                      className="field"
                      value={contract.gate}
                      disabled={contract.priority === "critical"}
                      onChange={(event) => edit((draft) => { draft.gate = event.target.value; })}
                    >
                      {options(GATES)}
                    </select>{" "}
                    gate. Its revision is <b className="readonly">{contract.revision}</b> (read-only - every saved
                    edit bumps it). Approval is{" "}
                    <span className={`pill ${contract.approval.status}`}>{contract.approval.status}</span>
                    {contract.approval.status === "approved"
                      ? <> - marked by <b>{contract.approval.by}</b>.</>
                      : <> - edit freely, then use Ready to approve.</>}
                  </p>
                </section>

                <section className="doc-section">
                  <h3>Target</h3>
                  <p className="prose">
                    The contract measures the operation{" "}
                    <input
                      className="field"
                      value={contract.target.operation}
                      onChange={(event) => edit((draft) => { draft.target.operation = event.target.value; })}
                    />{" "}
                    over the inputs{" "}
                    {contract.target.inputs.map((input, index) => (
                      <span className="input-chip" key={index}>
                        <input
                          value={input}
                          onChange={(event) => edit((draft) => { draft.target.inputs[index] = event.target.value; })}
                        />
                        <button
                          className="mini"
                          title="Remove input"
                          disabled={contract.target.inputs.length === 1}
                          onClick={() => edit((draft) => { draft.target.inputs.splice(index, 1); })}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    <button
                      className="add ghost"
                      onClick={() => edit((draft) => { draft.target.inputs.push(`input${draft.target.inputs.length + 1}`); })}
                    >
                      + add input
                    </button>
                  </p>
                </section>

                <section className="doc-section">
                  <h3>Observables</h3>
                  <p className="prose">Every run must expose:</p>
                  <div className="rows">
                    {contract.observables.map((observable, index) => (
                      <div className="row" key={index}>
                        <input
                          className="field cell"
                          value={observable.name}
                          onChange={(event) => edit((draft) => { draft.observables[index].name = event.target.value; })}
                        />
                        <select
                          className="field cell"
                          value={observable.type}
                          onChange={(event) => edit((draft) => {
                            const item = draft.observables[index];
                            item.type = event.target.value;
                            if (item.type === "string" && !item.values?.length) item.values = ["value"];
                            if (item.type !== "string") delete item.values;
                          })}
                        >
                          {options(OBSERVABLE_TYPES)}
                        </select>
                        {observable.type === "string" && (
                          <input
                            className="field cell wide"
                            value={(observable.values ?? []).join(", ")}
                            placeholder="allowed values, comma separated"
                            onChange={(event) => edit((draft) => {
                              draft.observables[index].values = event.target.value
                                .split(",")
                                .map((value) => value.trim())
                                .filter((value) => value.length > 0);
                            })}
                          />
                        )}
                        <button
                          className="mini"
                          title="Remove observable"
                          disabled={contract.observables.length === 1}
                          onClick={() => edit((draft) => { draft.observables.splice(index, 1); })}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      className="add"
                      onClick={() => edit((draft) => {
                        draft.observables.push({ name: `signal${draft.observables.length + 1}`, type: "number" });
                      })}
                    >
                      + add observable
                    </button>
                  </div>
                </section>

                <section className="doc-section">
                  <h3>Preconditions</h3>
                  <p className="prose">Inputs are checked before every case:</p>
                  <datalist id="input-names">
                    {contract.target.inputs.map((input) => <option key={input} value={input} />)}
                  </datalist>
                  <div className="rows">
                    {contract.preconditions.map((item, index) => (
                      <div className="row" key={index}>
                        <input
                          className="field cell"
                          value={item.id}
                          placeholder="id"
                          onChange={(event) => edit((draft) => { draft.preconditions[index].id = event.target.value; })}
                        />
                        <input
                          className="field cell"
                          list="input-names"
                          value={item.field}
                          placeholder="input"
                          onChange={(event) => edit((draft) => { draft.preconditions[index].field = event.target.value; })}
                        />
                        <select
                          className="field cell"
                          value={item.operator}
                          onChange={(event) => edit((draft) => { draft.preconditions[index].operator = event.target.value; })}
                        >
                          {options(OPERATORS)}
                        </select>
                        <input
                          className="field cell num"
                          type="number"
                          value={item.value}
                          onChange={(event) => edit((draft) => {
                            draft.preconditions[index].value = event.target.value === "" ? "" : Number(event.target.value);
                          })}
                        />
                        <button
                          className="mini"
                          title="Remove precondition"
                          onClick={() => edit((draft) => { draft.preconditions.splice(index, 1); })}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      className="add"
                      onClick={() => edit((draft) => {
                        const field = draft.target.inputs[0] ?? "input";
                        let id = field;
                        let suffix = 2;
                        while (draft.preconditions.some((item) => item.id === id)) id = `${field}${suffix++}`;
                        draft.preconditions.push({ id, type: "input_constraint", field, operator: "gte", value: 0 });
                      })}
                    >
                      + add precondition
                    </button>
                  </div>
                </section>

                <section className="doc-section">
                  <h3>Cases</h3>
                  <p className="prose">Each example runs the implementation with given inputs and expects:</p>
                  {contract.cases.map((item, index) => (
                    <div className="case-block" key={index}>
                      <div className="case-head">
                        <span className="case-label">case</span>
                        <input
                          className="field"
                          value={item.id}
                          onChange={(event) => edit((draft) => { draft.cases[index].id = event.target.value; })}
                        />
                        <button
                          className="mini"
                          title="Remove case"
                          disabled={contract.cases.length === 1}
                          onClick={() => edit((draft) => { draft.cases.splice(index, 1); })}
                        >
                          &times;
                        </button>
                      </div>
                      <div className="kv-group">
                        <div className="kv-title">given</div>
                        {Object.entries(item.input).map(([key, value], entryIndex) => (
                          <div className="kv-row" key={`in-${entryIndex}-${key}`}>
                            <input
                              className="field kv-key"
                              list="input-names"
                              value={key}
                              onChange={(event) => edit((draft) => {
                                const entries = Object.entries(draft.cases[index].input);
                                entries[entryIndex][0] = event.target.value;
                                draft.cases[index].input = Object.fromEntries(entries);
                              })}
                            />
                            <span className="kv-arrow">=</span>
                            <input
                              className="field kv-val"
                              value={displayValue(value)}
                              onChange={(event) => edit((draft) => {
                                const entries = Object.entries(draft.cases[index].input);
                                entries[entryIndex][1] = parseValue(event.target.value);
                                draft.cases[index].input = Object.fromEntries(entries);
                              })}
                            />
                            <button
                              className="mini"
                              title="Remove input value"
                              onClick={() => edit((draft) => {
                                const entries = Object.entries(draft.cases[index].input);
                                entries.splice(entryIndex, 1);
                                draft.cases[index].input = Object.fromEntries(entries);
                              })}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <button
                          className="add ghost"
                          onClick={() => edit((draft) => {
                            const target = draft.cases[index].input;
                            const base = draft.target.inputs.find((input) => !Object.hasOwn(target, input)) ?? "input";
                            let key = base;
                            let suffix = 2;
                            while (Object.hasOwn(target, key)) key = `${base}${suffix++}`;
                            target[key] = 0;
                          })}
                        >
                          + add given value
                        </button>
                      </div>
                      <div className="kv-group">
                        <div className="kv-title">expect</div>
                        {Object.entries(item.expected).map(([key, value], entryIndex) => (
                          <div className="kv-row" key={`exp-${entryIndex}-${key}`}>
                            <input
                              className="field kv-key"
                              value={key}
                              onChange={(event) => edit((draft) => {
                                const entries = Object.entries(draft.cases[index].expected);
                                entries[entryIndex][0] = event.target.value;
                                draft.cases[index].expected = Object.fromEntries(entries);
                              })}
                            />
                            <span className="kv-arrow">=</span>
                            <input
                              className="field kv-val"
                              value={displayValue(value)}
                              onChange={(event) => edit((draft) => {
                                const entries = Object.entries(draft.cases[index].expected);
                                entries[entryIndex][1] = parseValue(event.target.value);
                                draft.cases[index].expected = Object.fromEntries(entries);
                              })}
                            />
                            <button
                              className="mini"
                              title="Remove expected value"
                              disabled={Object.keys(item.expected).length === 1}
                              onClick={() => edit((draft) => {
                                const entries = Object.entries(draft.cases[index].expected);
                                entries.splice(entryIndex, 1);
                                draft.cases[index].expected = Object.fromEntries(entries);
                              })}
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                        <button
                          className="add ghost"
                          onClick={() => edit((draft) => {
                            const target = draft.cases[index].expected;
                            const base = draft.observables.find((item_) => !Object.hasOwn(target, item_.name))?.name ?? "signal";
                            let key = base;
                            let suffix = 2;
                            while (Object.hasOwn(target, key)) key = `${base}${suffix++}`;
                            target[key] = 0;
                          })}
                        >
                          + add expected value
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="add"
                    onClick={() => edit((draft) => {
                      const first = draft.target.inputs[0] ?? "input";
                      let id = "case";
                      let suffix = 2;
                      while (draft.cases.some((item) => item.id === id)) id = `case${suffix++}`;
                      draft.cases.push({ id, input: { [first]: 0 }, expected: { [draft.observables[0]?.name ?? "signal"]: 0 } });
                    })}
                  >
                    + add case
                  </button>
                </section>

                <section className="doc-section">
                  <h3>Bounds</h3>
                  <p className="prose">
                    Bounded outputs (template <code>bounded_output</code>) keep a number observable inside its floor,
                    and its optional ceiling:
                  </p>
                  <datalist id="observable-names">
                    {contract.observables.map((item) => <option key={item.name} value={item.name} />)}
                  </datalist>
                  <div className="rows">
                    {contract.properties.map((item, index) => (
                      <div className="row" key={index}>
                        <input
                          className="field cell"
                          value={item.id}
                          placeholder="id"
                          onChange={(event) => edit((draft) => { draft.properties[index].id = event.target.value; })}
                        />
                        <input
                          className="field cell"
                          list="observable-names"
                          value={item.field}
                          placeholder="observable"
                          onChange={(event) => edit((draft) => { draft.properties[index].field = event.target.value; })}
                        />
                        <span className="row-note">min</span>
                        <input
                          className="field cell num"
                          type="number"
                          value={item.min}
                          onChange={(event) => edit((draft) => {
                            draft.properties[index].min = event.target.value === "" ? "" : Number(event.target.value);
                          })}
                        />
                        <span className="row-note">max</span>
                        <input
                          className="field cell num"
                          type="number"
                          placeholder="optional"
                          value={item.max ?? ""}
                          onChange={(event) => edit((draft) => {
                            if (event.target.value === "") delete draft.properties[index].max;
                            else draft.properties[index].max = Number(event.target.value);
                          })}
                        />
                        <button
                          className="mini"
                          title="Remove bound"
                          onClick={() => edit((draft) => { draft.properties.splice(index, 1); })}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      className="add"
                      onClick={() => edit((draft) => {
                        const field = draft.observables[0]?.name ?? "signal";
                        let id = "bound";
                        let suffix = 2;
                        while (draft.properties.some((item) => item.id === id)) id = `bound${suffix++}`;
                        draft.properties.push({ id, template: "bounded_output", field, min: 0 });
                      })}
                    >
                      + add bound
                    </button>
                  </div>
                </section>

                <section className="doc-section">
                  <h3>Evidence</h3>
                  <p className="prose">Approval requires at least one of each evidence ref:</p>
                  <div className="rows">
                    {contract.evidence.minimum.map((item, index) => (
                      <div className="row" key={index}>
                        <select
                          className="field cell"
                          value={item.kind}
                          onChange={(event) => edit((draft) => { draft.evidence.minimum[index].kind = event.target.value; })}
                        >
                          {options(EVIDENCE_KINDS)}
                        </select>
                        <input
                          className="field cell"
                          value={item.ref}
                          placeholder="ref"
                          onChange={(event) => edit((draft) => { draft.evidence.minimum[index].ref = event.target.value; })}
                        />
                        <button
                          className="mini"
                          title="Remove evidence"
                          onClick={() => edit((draft) => { draft.evidence.minimum.splice(index, 1); })}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      className="add"
                      onClick={() => edit((draft) => {
                        const needsCase = !draft.evidence.minimum.some((item) => item.kind === "example_case");
                        const kind = needsCase ? "example_case" : "property";
                        const ref = needsCase
                          ? draft.cases[0]?.id ?? "case"
                          : draft.properties[0]?.id ?? "bound";
                        draft.evidence.minimum.push({ kind, ref });
                      })}
                    >
                      + add evidence
                    </button>
                  </div>
                </section>

                <section className="doc-section">
                  <h3>Limitations</h3>
                  <p className="prose">What this contract deliberately does not cover:</p>
                  <div className="rows">
                    {contract.limitations.map((item, index) => (
                      <div className="row" key={index}>
                        <input
                          className="field limitation"
                          value={item}
                          onChange={(event) => edit((draft) => { draft.limitations[index] = event.target.value; })}
                        />
                        <button
                          className="mini"
                          title="Remove limitation"
                          disabled={contract.limitations.length === 1}
                          onClick={() => edit((draft) => { draft.limitations.splice(index, 1); })}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    <button
                      className="add"
                      onClick={() => edit((draft) => { draft.limitations.push("Describe what this contract does not cover."); })}
                    >
                      + add limitation
                    </button>
                  </div>
                </section>
              </article>

              {message && <div className={`notice ${tone}`}>{message}</div>}
            </>
          ) : <div className="empty">Loading task library...</div>}
        </section>
      </section>
    </main>
  );
}
