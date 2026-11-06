"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./review.module.css";

const CHOICES = [
  { value: "defect", title: "defect — el código está mal", text: "No hace lo que dice la oración. Esta alarma es un hallazgo real." },
  { value: "false_alarm", title: "false_alarm — el código está bien", text: "Hace lo que dice la oración, pero con otro nombre o forma. El FAIL es solo de forma." },
  { value: "unclear", title: "unclear — no se puede saber", text: "La prueba no llegó a probar la lógica (por ejemplo la función nunca recibió sus datos y se cayó)." },
];

const show = (value) => (value === undefined ? "nada" : JSON.stringify(value));
const pairs = (record) => Object.entries(record).map(([key, value]) => `${key} = ${JSON.stringify(value)}`).join(", ");

function tagFor(item) {
  if (item.review.state === "running") return ["en curso", styles.tagWarn];
  if (item.review.state === "done") return [item.review.verdict === "approve" ? "aprobado" : "rechazado", item.review.verdict === "approve" ? styles.tagOk : styles.tagBad];
  return ["pendiente", ""];
}

export default function ReviewPage() {
  const [data, setData] = useState(null);
  const [name, setName] = useState("");
  const [tab, setTab] = useState("contracts");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [judgement, setJudgement] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      setName(window.localStorage.getItem("reviewer") ?? "");
    } catch {}
    fetch("/api/review").then((response) => response.json()).then((payload) => {
      if (payload.error) setMessage(payload.error);
      else {
        setData(payload);
        setSelected(payload.items[0]?.id ?? null);
      }
    });
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  function rename(value) {
    setName(value);
    try {
      window.localStorage.setItem("reviewer", value);
    } catch {}
  }

  async function send(body) {
    setMessage("");
    const response = await fetch("/api/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, by: name }) });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error);
    setData(payload);
    setNote("");
    setJudgement("");
  }

  const items = data?.items ?? [];
  const current = items.find((item) => item.id === selected) ?? null;
  const alarms = useMemo(() => items.filter((item) => item.gate.status === "FAIL"), [items]);
  const list = tab === "contracts" ? items : alarms;
  const reviewed = items.filter((item) => item.review.state === "done").length;
  const judged = alarms.filter((item) => item.alarm).length;
  const gate = data?.report.gate;
  const needName = !name.trim();

  if (!data) return <div className={styles.shell}>{message || "Cargando…"}</div>;

  return (
    <div className={styles.shell}>
      <div className={styles.top}>
        <div>
          <h1 className={styles.title}>Revisión de contratos y alarmas</h1>
          <p className={styles.sub}>Registra el tiempo real que tardás y qué alarmas son falsas. Solo cuentan las entradas de tipo «{data.kind}».</p>
        </div>
        <div className={styles.nameRow}>
          <label htmlFor="name">Tu nombre</label>
          <input id="name" className={styles.input} value={name} onChange={(event) => rename(event.target.value)} placeholder="ana" />
        </div>
      </div>

      {data.kind !== "human" && <div className={styles.banner}>Modo ensayo («{data.kind}»): estas entradas no cuentan para la puerta.</div>}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{reviewed}/{items.length}</div>
          <div className={styles.statLabel}>contratos revisados</div>
          <div className={styles.bar}><div className={styles.barFill} style={{ width: `${(reviewed / items.length) * 100}%` }} /></div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{judged}/{alarms.length}</div>
          <div className={styles.statLabel}>alarmas leídas</div>
          <div className={styles.bar}><div className={styles.barFill} style={{ width: `${alarms.length ? (judged / alarms.length) * 100 : 0}%` }} /></div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{gate.approvalMinutes.median === null ? "—" : `${gate.approvalMinutes.median.toFixed(1)} min`}</div>
          <div className={styles.statLabel}>mediana de revisión (hace falta {items.length}/{items.length})</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{gate.falseAlarms.count === null ? "—" : gate.falseAlarms.count}</div>
          <div className={styles.statLabel}>falsas alarmas (hace falta leer las {alarms.length})</div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "contracts" ? styles.tabOn : ""}`} onClick={() => setTab("contracts")}>1. Revisar contratos</button>
        <button className={`${styles.tab} ${tab === "alarms" ? styles.tabOn : ""}`} onClick={() => setTab("alarms")}>2. Leer alarmas</button>
      </div>

      <div className={styles.layout}>
        <div className={styles.list}>
          {list.map((item) => {
            const [label, tone] = tab === "contracts" ? tagFor(item) : item.alarm ? [item.alarm.judgement, styles.tagOk] : ["sin leer", ""];
            return (
              <button key={item.id} className={`${styles.row} ${selected === item.id ? styles.rowOn : ""}`} onClick={() => setSelected(item.id)}>
                <span className={styles.rowId}>{item.id}</span>
                <span>{item.sentence.slice(0, 26)}{item.sentence.length > 26 ? "…" : ""}</span>
                <span className={`${styles.tag} ${tone}`}>{label}</span>
              </button>
            );
          })}
        </div>

        {current && (
          <div className={styles.panel}>
            <div className={styles.id}>{current.id}</div>
            <p className={styles.sentence}>{current.sentence}</p>

            {tab === "contracts" && (
              <>
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>Lo que dice el contrato</p>
                  {current.contract.cases.map((item) => (
                    <p key={item.id} className={styles.line}>Caso <b>{item.id}</b>: con <span className={styles.mono}>{pairs(item.input)}</span> debe dar <span className={styles.mono}>{pairs(item.expected)}</span></p>
                  ))}
                  {current.contract.properties.map((item) => (
                    <p key={item.id} className={styles.line}>Propiedad <b>{item.id}</b>: <span className={styles.mono}>{item.field}</span> nunca menor que {item.min}{item.max !== undefined ? ` ni mayor que ${item.max}` : ""}</p>
                  ))}
                  {current.contract.limitations.map((text) => <p key={text} className={styles.line}>Límite: {text}</p>)}
                </div>
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>Pregunta</p>
                  <p className={styles.line}>¿Un código que haga otra cosa distinta a la oración podría pasar todos estos casos y propiedades? Si sí, rechazalo.</p>
                </div>
                <div className={styles.section}>
                  {current.review.state === "todo" && <button className={`${styles.btn} ${styles.primary}`} disabled={needName} onClick={() => send({ action: "start", id: current.id })}>Empezar a revisar (arranca el reloj)</button>}
                  {current.review.state === "running" && (
                    <>
                      <div className={styles.timer}>{new Date(Math.max(0, now - current.review.startedAt)).toISOString().slice(14, 19)}</div>
                      <textarea className={styles.textarea} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota (opcional): por qué aprobás o rechazás" />
                      <div className={styles.buttons}>
                        <button className={`${styles.btn} ${styles.good}`} onClick={() => send({ action: "done", id: current.id, verdict: "approve", note })}>Aprobar</button>
                        <button className={`${styles.btn} ${styles.bad}`} onClick={() => send({ action: "done", id: current.id, verdict: "reject", note })}>Rechazar</button>
                      </div>
                    </>
                  )}
                  {current.review.state === "done" && <p className={`${styles.line} ${styles.ok}`}>Revisado: {current.review.verdict === "approve" ? "aprobado" : "rechazado"} en {current.review.minutes.toFixed(2)} min.</p>}
                </div>
              </>
            )}

            {tab === "alarms" && (
              <>
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>Qué pasó</p>
                  {current.gate.cases.map((item) => (
                    <p key={item.id} className={styles.line}>
                      Con <span className={styles.mono}>{pairs(item.input)}</span>:{" "}
                      {item.error
                        ? <>el código se cayó: <span className={styles.mono}>{item.error}</span></>
                        : item.misses.map((miss) => <span key={miss.field}>el contrato esperaba <span className={styles.mono}>{miss.field} = {show(miss.want)}</span> y el código dio <span className={styles.mono}>{show(miss.got)}</span>. </span>)}
                    </p>
                  ))}
                </div>
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>El código</p>
                  <pre className={styles.code}>{current.functionSource}</pre>
                </div>
                <div className={styles.section}>
                  <p className={styles.sectionTitle}>Tu lectura: si arreglo solo los nombres, ¿el código haría lo que pide la oración?</p>
                  {current.alarm && <p className={`${styles.line} ${styles.ok}`}>Ya la leíste: {current.alarm.judgement}. {current.alarm.note}</p>}
                  <div className={styles.choices}>
                    {CHOICES.map((choice) => (
                      <button key={choice.value} className={`${styles.choice} ${judgement === choice.value ? styles.choiceOn : ""}`} onClick={() => setJudgement(choice.value)}>
                        <div className={styles.choiceTitle}>{choice.title}</div>
                        <div className={styles.choiceText}>{choice.text}</div>
                      </button>
                    ))}
                  </div>
                  <textarea className={styles.textarea} style={{ marginTop: 10 }} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota obligatoria: por qué" />
                  <div className={styles.buttons}>
                    <button className={`${styles.btn} ${styles.primary}`} disabled={needName || !judgement || !note.trim()} onClick={() => send({ action: "alarm", id: current.id, judgement, note })}>Guardar lectura</button>
                  </div>
                </div>
              </>
            )}
            {needName && <p className={styles.message}>Escribí tu nombre arriba para poder guardar.</p>}
            {message && <p className={styles.message}>{message}</p>}
          </div>
        )}
        {!current && <div className={styles.empty}>No hay nada para mostrar.</div>}
      </div>
    </div>
  );
}
