import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clock,
  CreditCard,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Lock,
  RefreshCw,
  ShieldCheck,
  Upload,
  Wand2
} from "lucide-react";
import data from "./data/converters.json";
import "./styles.css";

const MAX_SIZE_MB = 50;
const MAX_PAGES = 500;

const classNames = (...values) => values.filter(Boolean).join(" ");
let turnstileScriptPromise = null;

function estimatePages(file) {
  if (!file) return 25;
  const bySize = Math.ceil(file.size / 320000);
  return Math.min(500, Math.max(1, bySize));
}

function isPdfFile(file) {
  if (!file) return false;
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function planForPages(pages) {
  if (pages <= 25) return data.pricing.find((plan) => plan.id === "starter");
  if (pages <= 100) return data.pricing.find((plan) => plan.id === "batch");
  return data.pricing.find((plan) => plan.id === "pro");
}

function money(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  return value;
}

function camelKey(value) {
  return String(value || "").replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function formatCell(value, key) {
  if (value === null || value === undefined || value === "") return "";
  if (["money_in", "money_out", "balance", "total", "subtotal", "tax"].includes(key) && typeof value === "number") return money(value);
  return String(value);
}

function App() {
  const [selectedId, setSelectedId] = useState("bank");
  const [file, setFile] = useState(null);
  const [pageCount, setPageCount] = useState(25);
  const [email, setEmail] = useState("");
  const [converting, setConverting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [redoing, setRedoing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const fileInputRef = useRef(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

  const selected = useMemo(
    () => data.converters.find((converter) => converter.id === selectedId),
    [selectedId]
  );
  const selectedPlan = useMemo(() => planForPages(pageCount), [pageCount]);
  const fileSizeLabel = file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "";
  const needsTurnstile = Boolean(turnstileSiteKey);
  const previewColumns = result?.columns?.length ? result.columns : selected?.columns || data.converters[0].columns;
  const previewRows = result?.previewRows || data.sampleRowsByConverter?.[selectedId] || data.sampleRows;
  const previewCountLabel = result ? `${result.rowCount || 0} rows` : `${previewRows.length} sample rows`;
  const isPdfFirstConverter = selectedId === "bank";
  const canConvert =
    file &&
    !converting &&
    file.size <= MAX_SIZE_MB * 1024 * 1024 &&
    pageCount <= MAX_PAGES &&
    (!needsTurnstile || Boolean(turnstileToken));

  useEffect(() => {
    fetch("/api/config")
      .then((response) => response.json())
      .then((payload) => setTurnstileSiteKey(payload.turnstileSiteKey || ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileRef.current) return;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile || !turnstileRef.current || turnstileWidgetIdRef.current) return;
        turnstileWidgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: turnstileSiteKey,
          theme: "auto",
          size: "flexible",
          callback: (token) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken("")
        });
      })
      .catch(() => setError("Human check could not load. Refresh and try again."));

    return () => {
      cancelled = true;
    };
  }, [turnstileSiteKey]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saved = safeJson(sessionStorage.getItem("aiconverter:lastJob"));
    const urlJobId = params.get("jobId");
    const jobId = urlJobId || saved?.jobId;
    const token = saved?.jobId === jobId ? saved?.token : "";
    const paymentId = params.get("payment_id") || params.get("paymentId");
    const paymentStatus = params.get("status") || params.get("payment_status");
    const shouldCleanUrl = Boolean(urlJobId || paymentId || paymentStatus);
    if (!jobId || !token) {
      if (shouldCleanUrl) {
        setError("Payment returned, but this browser no longer has the private access token. Upload again or contact support with your job ID.");
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }

    async function restoreJob() {
      try {
        const response = await fetch("/api/job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, token, paymentId, status: paymentStatus })
        });
        const restored = await response.json();
        if (response.ok) {
          const restoredResult = {
            ...restored,
            plan: data.pricing.find((plan) => plan.id === restored.plan) || selectedPlan
          };
          setResult(restoredResult);
          if (restoredResult.paid && restoredResult.status === "preview_ready") {
            await finalizeConversion(jobId, token, paymentId);
          }
        }
      } catch {
        setError("We could not restore that conversion. Try uploading the PDF again.");
      } finally {
        if (shouldCleanUrl) window.history.replaceState({}, "", window.location.pathname);
      }
    }

    restoreJob();
  }, [selectedPlan]);

  useEffect(() => {
    if (result?.jobId && result?.token) {
      sessionStorage.setItem("aiconverter:lastJob", JSON.stringify({ jobId: result.jobId, token: result.token }));
    }
  }, [result]);

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] || null;
    setError("");
    setResult(null);
    setFile(nextFile);
    setPageCount(isPdfFile(nextFile) ? estimatePages(nextFile) : 1);
  }

  function handleConverterSelect(converter) {
    if (converter.id === "email") return;
    setSelectedId(converter.id);
    setError("");
    setResult(null);
    setFile(null);
    setPageCount(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetTurnstile() {
    setTurnstileToken("");
    if (window.turnstile && turnstileWidgetIdRef.current) {
      window.turnstile.reset(turnstileWidgetIdRef.current);
    }
  }

  async function handleConvert(event) {
    event.preventDefault();
    if (!file) {
      setError("Choose a file first.");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`This service accepts files up to ${MAX_SIZE_MB} MB.`);
      return;
    }

    if (pageCount > MAX_PAGES) {
      setError(`This service accepts up to ${MAX_PAGES} pages. Split larger PDFs into multiple files.`);
      return;
    }

    setConverting(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append("converterId", selectedId);
    form.append("email", email);
    form.append("planId", selectedPlan.id);
    form.append("estimatedPages", String(pageCount));
    if (turnstileToken) form.append("turnstileToken", turnstileToken);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: form
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "The AI converter could not process this file.");
      }

      setResult(payload);
    } catch (err) {
      setError(err.message || "The AI converter could not process this file.");
    } finally {
      setConverting(false);
      resetTurnstile();
    }
  }

  async function handleUnlock() {
    if (!result?.jobId || !result?.token) return;
    if (result.status === "complete") {
      await downloadCsv(result.jobId, result.token);
      return;
    }

    if (result.paid && result.status === "preview_ready") {
      await finalizeConversion(result.jobId, result.token);
      return;
    }

    setUnlocking(true);
    setError("");
    sessionStorage.setItem("aiconverter:lastJob", JSON.stringify({ jobId: result.jobId, token: result.token }));

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: result.jobId,
          token: result.token,
          planId: result.plan?.id || selectedPlan.id,
          email
        })
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Payment is not ready yet.");
      }

      if (payload.mode === "download") {
        await downloadCsv(result.jobId, result.token);
        return;
      }

      if (payload.mode === "finalize") {
        await finalizeConversion(result.jobId, result.token);
        return;
      }

      if (payload.mode === "checkout" && payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }

      throw new Error("Payment is not ready yet.");
    } catch (err) {
      setError(err.message || "Payment is not ready yet.");
    } finally {
      setUnlocking(false);
    }
  }

  async function downloadCsv(jobId, token) {
    setUnlocking(true);
    setError("");
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, token })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "The CSV could not be downloaded.");
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = "aiconverter-export.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(err.message || "The CSV could not be downloaded.");
    } finally {
      setUnlocking(false);
    }
  }

  async function finalizeConversion(jobId, token, paymentId = "") {
    setUnlocking(true);
    setError("");
    try {
      const response = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, token, paymentId })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The full CSV could not be prepared.");
      const planId = typeof payload.plan === "string" ? payload.plan : payload.plan?.id;
      setResult({ ...payload, plan: data.pricing.find((plan) => plan.id === planId) || payload.plan || selectedPlan });
    } catch (err) {
      setError(err.message || "The full CSV could not be prepared.");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleRedo() {
    if (!result?.jobId || !result?.token || !result.redoAvailable) return;
    setRedoing(true);
    setError("");
    try {
      const response = await fetch("/api/redo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: result.jobId,
          token: result.token,
          reason: "Customer requested stronger automatic redo."
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The stronger redo could not be prepared.");
      const planId = typeof payload.plan === "string" ? payload.plan : payload.plan?.id;
      setResult({ ...payload, plan: data.pricing.find((plan) => plan.id === planId) || payload.plan || selectedPlan });
    } catch (err) {
      setError(err.message || "The stronger redo could not be prepared.");
    } finally {
      setRedoing(false);
    }
  }

  function resultButtonLabel() {
    if (result?.status === "converting_full") return "Generating full CSV...";
    if (unlocking) return result?.status === "preview_ready" && result?.paid ? "Generating full CSV..." : "Preparing...";
    if (result?.status === "complete") return "Download full CSV";
    if (result?.paid) return "Generate full CSV";
    return `Unlock full CSV · ${result?.plan?.price || selectedPlan.price}`;
  }

  return (
    <main className="page-shell">
      <header className="site-header" aria-label="Site header">
        <a className="brand" href="#top" aria-label="AI Converter home">
          <span className="brand-mark">
            <Wand2 size={18} strokeWidth={2.4} />
          </span>
          <span>AI Converter</span>
        </a>
        <nav className="header-nav" aria-label="Primary navigation">
          <a href="#workflow">Workflow</a>
          <a href="#pricing">Pricing</a>
          <a href="/sample-csv">Sample CSV</a>
          <a href="#security">Security</a>
        </nav>
        <button className="header-action" onClick={() => fileInputRef.current?.click()}>
          Upload file
          <ArrowRight size={16} />
        </button>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <h1>PDFs, receipts, and screenshots to CSV. Preview first.</h1>
          <p>
            Bank statements are live. Receipts and screenshot tables are now in beta
            on the same private preview-first workflow. If confidence is too low,
            the job fails without charging.
          </p>
          <div className="hero-price-strip" aria-label="Pricing summary">
            <strong>Free preview</strong>
            <span>Full CSV unlocks at {data.pricing[0].price}</span>
            <a href="#pricing">See all prices</a>
          </div>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => fileInputRef.current?.click()}>
              Upload file
              <Upload size={18} />
            </button>
            <a className="secondary-button" href="/sample-csv">
              View sample CSV
              <ArrowRight size={16} />
            </a>
          </div>
          <div className="trust-strip" aria-label="Product guardrails">
            <span>
              <ShieldCheck size={16} />
              Free preview
            </span>
            <span>
              <Database size={16} />
              Full extraction only after payment
            </span>
            <span>
              <Lock size={16} />
              Fails closed when confidence is low
            </span>
          </div>
        </div>

        <section className="converter-workspace" aria-label="AI conversion workspace">
          <div className="workspace-topbar">
            <div>
              <span className="status-dot" />
              Automated preview
            </div>
            <strong>{selected.title} to {selected.output}</strong>
          </div>

          <div className="workspace-grid">
            <div className="converter-list" aria-label="Converter choices">
              {data.converters.map((converter) => (
                <button
                  className={classNames(
                    "converter-choice",
                    selectedId === converter.id && "is-selected",
                    converter.id === "email" && "is-disabled"
                  )}
                  key={converter.id}
                  onClick={() => handleConverterSelect(converter)}
                  disabled={converter.id === "email"}
                  type="button"
                >
                  <span className="choice-icon">
                    <FileText size={18} />
                  </span>
                  <span>
                    <strong>{converter.title}</strong>
                    <small>{converter.state}</small>
                  </span>
                </button>
              ))}
            </div>

            <form className="upload-panel" id="start" onSubmit={handleConvert}>
              <label className="upload-target">
                <Upload size={24} />
                <span>
                  <strong>{file?.name || `Choose ${selected.input.toLowerCase()}`}</strong>
                  <small>
                    {file
                      ? `${fileSizeLabel} selected. Max ${MAX_SIZE_MB} MB${isPdfFile(file) ? ` and ${MAX_PAGES} pages` : ""}.`
                      : `Private upload. ${selected.input} to ${selected.output}. Max ${MAX_SIZE_MB} MB${isPdfFirstConverter ? ` and ${MAX_PAGES} pages` : ""}.`}
                  </small>
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={selected.accept || "application/pdf,.pdf"}
                  onChange={handleFileChange}
                />
              </label>

              <div className="conversion-route">
                <span>{selected.input}</span>
                <ArrowRight size={16} />
                <span>{selected.output}</span>
              </div>

              <p>{selected.description}</p>

              <div className="order-summary" aria-label="Estimated order">
                <label>
                  <span>
                    <Clock size={15} />
                    {selectedId === "bank" ? "Estimated pages" : "Pages / images"}
                  </span>
                  <input
                    min="1"
                    max="500"
                    type="number"
                    value={pageCount}
                    onChange={(event) => setPageCount(Number(event.target.value || 1))}
                  />
                </label>
                <div>
                  <span>Unlock price</span>
                  <strong>
                    {selectedPlan.price} · {selectedPlan.detail}
                  </strong>
                </div>
              </div>

              <label className="email-field">
                <span>Email for payment receipt</span>
                <input
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              {turnstileSiteKey && (
                <div className="turnstile-wrap" ref={turnstileRef} aria-label="Human check" />
              )}

              <button className="primary-button full-width" disabled={!canConvert} type="submit">
                {converting ? "Checking file..." : "Generate free preview"}
                {converting ? <LoaderCircle className="spin" size={18} /> : <Wand2 size={18} />}
              </button>

              {error && (
                <div className="inline-alert" role="alert">
                  <AlertCircle size={17} />
                  <span>{error}</span>
                </div>
              )}
            </form>

            <div className="preview-panel">
              <div className="preview-header">
                <div>
                  <FileSpreadsheet size={18} />
                  <strong>Sample preview</strong>
                </div>
                <span>{previewCountLabel}</span>
              </div>

              {result?.status === "failed" ? (
                <div className="failed-state">
                  <AlertCircle size={24} />
                  <strong>No charge.</strong>
                  <p>{result.message || "The converter could not safely extract this file."}</p>
                </div>
              ) : (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {previewColumns.slice(0, 5).map((column) => (
                            <th key={column.key}>{column.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, index) => (
                          <tr key={`${row.date || row.description || row.vendor || row.column_1 || "row"}-${index}`}>
                            {previewColumns.slice(0, 5).map((column) => (
                              <td key={column.key}>{formatCell(row[column.key] ?? row[camelKey(column.key)], column.key)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="checks">
                    {(selected.checks || data.converters[0].checks).map((check) => (
                      <span key={check}>
                        <Check size={15} />
                        {check}
                      </span>
                    ))}
                  </div>

                  {["preview_ready", "complete", "converting_full"].includes(result?.status) && (
                    <div className="result-card">
                      <div>
                        <span>{result.status === "complete" ? "Full CSV" : "Preview confidence"}</span>
                        <strong>{Math.round((result.confidence || 0) * 100)}%</strong>
                      </div>
                      <div className="result-actions">
                        <button className="primary-button" onClick={handleUnlock} disabled={unlocking || result.status === "converting_full"}>
                          {resultButtonLabel()}
                          {unlocking ? (
                            <LoaderCircle className="spin" size={17} />
                          ) : result.status === "complete" ? (
                            <Download size={17} />
                          ) : (
                            <CreditCard size={17} />
                          )}
                        </button>
                        {result.status === "complete" && result.redoAvailable && (
                          <button className="secondary-button" onClick={handleRedo} disabled={redoing}>
                            {redoing ? "Redoing..." : "Stronger redo"}
                            {redoing ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {result?.refundStatus && (
                    <div className="inline-note">
                      {result.refundStatus === "credit_due"
                        ? "Credit review is queued because a full CSV was already delivered."
                        : "Refund review is queued for this failed paid export."}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </section>

      <section className="proof-row" aria-label="Trust proof">
        {data.trustProof.map((item) => (
          <article className="proof-item" key={item.title}>
            <Check size={17} />
            <div>
              <h2>{item.title}</h2>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section id="workflow" className="section-band">
        <div className="section-heading">
          <h2>Automated first. Human-free by design.</h2>
          <p>
            The first workflow is direct upload, sample extraction, validation,
            payment, full extraction, and CSV download. Email monitoring stays
            upcoming until this path is stable.
          </p>
        </div>
        <div className="queue-list">
          <article className="queue-item">
            <span className="queue-number">01</span>
            <div>
              <h3>Upload file</h3>
              <p>The file is stored privately for preview, unlock, and the 24-hour redo window.</p>
            </div>
            <strong>Private</strong>
          </article>
          <article className="queue-item">
            <span className="queue-number">02</span>
            <div>
              <h3>Parser extracts rows</h3>
              <p>Bank PDFs use our own parser first. Receipt and screenshot beta jobs use OCR when needed.</p>
            </div>
            <strong>Automated</strong>
          </article>
          <article className="queue-item">
            <span className="queue-number">03</span>
            <div>
              <h3>Pay after preview</h3>
              <p>Paid jobs get one stronger automatic redo. Failed paid exports are marked refund or credit due.</p>
            </div>
            <strong>Anti-abuse guarded</strong>
          </article>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-heading compact">
          <h2>Lower pricing for an automated workflow.</h2>
          <p>Sample preview is free. Pay once to generate and download the full CSV.</p>
        </div>
        <div className="pricing-grid">
          {data.pricing.map((plan) => (
            <article className="price-card" key={plan.name}>
              <h3>{plan.name}</h3>
              <strong>{plan.price}</strong>
              <p>{plan.detail}</p>
              <span>{plan.note}</span>
              <button
                className="secondary-button full-width"
                onClick={() => {
                  setPageCount(plan.pages);
                  fileInputRef.current?.click();
                }}
              >
                Upload file
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section id="security" className="request-section">
        <div>
          <h2>Built for sensitive files.</h2>
          <p>
            Source files are private, never emailed, and deleted after failed extraction,
            completed redo, or the 24-hour source lifecycle. Low-confidence files fail closed.
          </p>
        </div>
        <button className="primary-button" onClick={() => fileInputRef.current?.click()}>
          Upload file
          <Upload size={18} />
        </button>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <strong>AI Converter</strong>
          <span>Automated converter workflows with bank statements live first.</span>
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/refund">Refunds</a>
          <a href="/security">Security</a>
          <a href="/data-retention">Data retention</a>
          <a href="/support">Support</a>
        </nav>
      </footer>
    </main>
  );
}

function safeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve();
  if (turnstileScriptPromise) return turnstileScriptPromise;
  turnstileScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return turnstileScriptPromise;
}

createRoot(document.getElementById("root")).render(<App />);
