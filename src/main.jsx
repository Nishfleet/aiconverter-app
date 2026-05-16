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
  FileJson,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Lock,
  RefreshCw,
  ShieldCheck,
  Upload,
  Wand2
} from "lucide-react";
import data from "./data/converters.json";
import { convertImageInBrowser, convertRasterToSvgInBrowser } from "./local-converters.js";
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

function isLiveConverter(converter) {
  return converter.id !== "email";
}

function isLocalConverter(converter) {
  return ["local-image", "local-svg"].includes(converter?.mode);
}

function isProviderConverter(converter) {
  return converter?.mode === "provider-cloudconvert";
}

function allAcceptedTypes(converters) {
  return [...new Set(converters.filter(isLiveConverter).flatMap((converter) => String(converter.accept || "").split(",")))]
    .filter(Boolean)
    .join(",");
}

function converterAcceptsFile(converter, candidate) {
  if (!converter || !candidate || !converter.accept) return false;
  const fileName = candidate.name.toLowerCase();
  const fileType = String(candidate.type || "").toLowerCase();
  return String(converter.accept)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .some((rule) => {
      if (!rule) return false;
      if (rule.startsWith(".")) return fileName.endsWith(rule);
      if (rule.endsWith("/*")) return fileType.startsWith(rule.slice(0, -1));
      return fileType === rule;
    });
}

function defaultOutputFormat(converter) {
  return converter?.outputFormats?.[0]?.id || "csv";
}

function outputLabel(converter, outputFormat) {
  return converter?.outputFormats?.find((format) => format.id === outputFormat)?.label || "CSV";
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

function resultFormatLabel(format) {
  const labels = {
    csv: "full CSV",
    json: "JSON",
    txt: "TXT transcript",
    md: "Markdown",
    html: "HTML",
    pdf: "PDF",
    docx: "DOCX",
    xlsx: "XLSX",
    pptx: "PPTX",
    png: "PNG",
    jpg: "JPG",
    jpeg: "JPG",
    webp: "WEBP",
    gif: "GIF",
    svg: "SVG",
    mp3: "MP3",
    wav: "WAV",
    m4a: "M4A",
    ogg: "OGG",
    flac: "FLAC",
    mp4: "MP4",
    webm: "WEBM",
    mov: "MOV",
    zip: "ZIP",
    "7z": "7Z",
    tar: "TAR"
  };
  return labels[format] || "converted file";
}

function downloadNameForResult(result) {
  const extension = result?.outputFormat || "csv";
  const names = {
    json: "aiconverter-export.json",
    txt: "aiconverter-transcript.txt",
    md: "aiconverter-document.md",
    html: "aiconverter-screen.html",
    csv: "aiconverter-export.csv"
  };
  return names[extension] || `aiconverter-export.${extension}`;
}

function previewMetricLabel(converterId, result) {
  if (converterId === "audio-transcript") return `${result.rowCount || 0} words`;
  if (["document-markdown", "screenshot-code", "universal-file"].includes(converterId)) return "1 generated file";
  return `${result.rowCount || 0} rows`;
}

function App() {
  const [selectedId, setSelectedId] = useState("bank");
  const [outputFormat, setOutputFormat] = useState("csv");
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
  const [capabilities, setCapabilities] = useState({});
  const fileInputRef = useRef(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

  const selected = useMemo(
    () => data.converters.find((converter) => converter.id === selectedId),
    [selectedId]
  );
  const cloudConvertReady = Boolean(capabilities.cloudConvert);
  const converterIsEnabled = (converter) => !isProviderConverter(converter) || cloudConvertReady;
  const liveConverters = useMemo(() => data.converters.filter(isLiveConverter), []);
  const selectableConverters = useMemo(
    () => liveConverters.filter(converterIsEnabled),
    [liveConverters, cloudConvertReady]
  );
  const compatibleConverters = useMemo(
    () => (file ? selectableConverters.filter((converter) => converterAcceptsFile(converter, file)) : []),
    [file, selectableConverters]
  );
  const selectedPlan = useMemo(() => planForPages(pageCount), [pageCount]);
  const isLocalImageConverter = isLocalConverter(selected);
  const selectedEnabled = converterIsEnabled(selected);
  const selectedMaxSizeMb = selectedId === "audio-transcript" ? 25 : selectedId === "screenshot-code" ? 8 : MAX_SIZE_MB;
  const fileSizeLabel = file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : "";
  const needsTurnstile = Boolean(turnstileSiteKey);
  const previewColumns = result?.columns?.length ? result.columns : selected?.columns || data.converters[0].columns;
  const previewRows = result?.previewRows || data.sampleRowsByConverter?.[selectedId] || data.sampleRows;
  const previewCountLabel = result?.localDownloadUrl
    ? "1 converted file"
    : result
      ? previewMetricLabel(selectedId, result)
      : `${previewRows.length} sample rows`;
  const isPdfFirstConverter = selectedId === "bank";
  const selectedOutputLabel = outputLabel(selected, outputFormat);
  const canConvert =
    file &&
    !converting &&
    file.size <= selectedMaxSizeMb * 1024 * 1024 &&
    pageCount <= MAX_PAGES &&
    selectedEnabled &&
    (isLocalImageConverter || !needsTurnstile || Boolean(turnstileToken));

  useEffect(() => {
    fetch("/api/config")
      .then((response) => response.json())
      .then((payload) => {
        setTurnstileSiteKey(payload.turnstileSiteKey || "");
        setCapabilities(payload.capabilities || {});
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setOutputFormat(defaultOutputFormat(selected));
  }, [selected]);

  useEffect(() => {
    return () => {
      if (result?.localDownloadUrl) URL.revokeObjectURL(result.localDownloadUrl);
    };
  }, [result?.localDownloadUrl]);

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
    const urlJobId = params.get("jobId");
    const jobId = urlJobId || "";
    const paymentId = params.get("payment_id") || params.get("paymentId");
    const paymentStatus = params.get("status") || params.get("payment_status");
    const shouldCleanUrl = Boolean(urlJobId || paymentId || paymentStatus);
    if (!jobId) {
      if (shouldCleanUrl) {
        setError("Payment returned without a conversion ID. Contact support if you were charged.");
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }

    async function restoreJob() {
      try {
        const response = await fetch("/api/job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, paymentId, status: paymentStatus })
        });
        const restored = await response.json();
        if (response.ok) {
          const restoredResult = {
            ...restored,
            plan: data.pricing.find((plan) => plan.id === restored.plan) || selectedPlan
          };
          setResult(restoredResult);
          if (restoredResult.converterId) setSelectedId(restoredResult.converterId);
          if (restoredResult.outputFormat) setOutputFormat(restoredResult.outputFormat);
          if (restoredResult.paid && restoredResult.status === "preview_ready") {
            await finalizeConversion(jobId, restoredResult.token || "", paymentId);
          }
        }
      } catch {
        setError("We could not restore that conversion. Upload again or contact support with your job ID.");
      } finally {
        if (shouldCleanUrl) window.history.replaceState({}, "", window.location.pathname);
      }
    }

    restoreJob();
  }, [selectedPlan]);

  function handleFileChange(event) {
    const nextFile = event.target.files?.[0] || null;
    setError("");
    setResult(null);
    setFile(nextFile);
    if (nextFile) {
      const matches = selectableConverters.filter((converter) => converterAcceptsFile(converter, nextFile));
      const nextSelected = matches.find((converter) => converter.id === selectedId) || matches[0];
      if (nextSelected) {
        setSelectedId(nextSelected.id);
        setOutputFormat(defaultOutputFormat(nextSelected));
      }
    }
    setPageCount(isPdfFile(nextFile) ? estimatePages(nextFile) : 1);
  }

  function handleConverterSelect(converter) {
    if (converter.id === "email") return;
    if (!converterIsEnabled(converter)) {
      setError("Universal provider conversion is not connected yet.");
      return;
    }
    setSelectedId(converter.id);
    setOutputFormat(defaultOutputFormat(converter));
    setError("");
    setResult(null);
    setPageCount(1);
    if (file && !converterAcceptsFile(converter, file)) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

    if (file.size > selectedMaxSizeMb * 1024 * 1024) {
      setError(`This converter accepts files up to ${selectedMaxSizeMb} MB.`);
      return;
    }

    if (pageCount > MAX_PAGES) {
      setError(`This service accepts up to ${MAX_PAGES} pages. Split larger PDFs into multiple files.`);
      return;
    }

    if (isLocalImageConverter) {
      await handleLocalConversion();
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
    form.append("outputFormat", outputFormat);
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

  async function handleLocalConversion() {
    setConverting(true);
    setError("");
    setResult(null);

    try {
      const converted =
        selected?.mode === "local-svg"
          ? await convertRasterToSvgInBrowser(file)
          : await convertImageInBrowser(file, outputFormat);
      setResult({
        status: "complete",
        localDownloadUrl: converted.url,
        localFileName: converted.fileName,
        localPreviewUrl: converted.url,
        outputFormat,
        converterId: selectedId,
        rowCount: 1,
        confidence: 1,
        paid: true,
        columns: [],
        previewRows: []
      });
    } catch (err) {
      setError(err.message || "This image could not be converted in the browser.");
    } finally {
      setConverting(false);
    }
  }

  async function handleUnlock() {
    if (result?.localDownloadUrl) {
      downloadLocalFile(result);
      return;
    }
    if (!result?.jobId) return;
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

  async function downloadCsv(jobId, token = "") {
    setUnlocking(true);
    setError("");
    try {
      const response = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, ...(token ? { token } : {}) })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "The converted file could not be downloaded.");
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = downloadNameForResult(result);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(err.message || "The converted file could not be downloaded.");
    } finally {
      setUnlocking(false);
    }
  }

  function downloadLocalFile(localResult) {
    const link = document.createElement("a");
    link.href = localResult.localDownloadUrl;
    link.download = localResult.localFileName || `aiconverter-image.${outputFormat}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function finalizeConversion(jobId, token = "", paymentId = "") {
    setUnlocking(true);
    setError("");
    try {
      const response = await fetch("/api/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, ...(token ? { token } : {}), ...(paymentId ? { paymentId } : {}) })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The full file could not be prepared.");
      const planId = typeof payload.plan === "string" ? payload.plan : payload.plan?.id;
      setResult({ ...payload, plan: data.pricing.find((plan) => plan.id === planId) || payload.plan || selectedPlan });
    } catch (err) {
      setError(err.message || "The full file could not be prepared.");
    } finally {
      setUnlocking(false);
    }
  }

  useEffect(() => {
    if (result?.status !== "converting_full" || !result.jobId) return;
    let cancelled = false;
    let inFlight = false;

    async function pollJob() {
      if (inFlight) return;
      inFlight = true;
      try {
        const response = await fetch("/api/job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: result.jobId, ...(result.token ? { token: result.token } : {}) })
        });
        const payload = await response.json();
        if (!cancelled && response.ok) {
          const planId = typeof payload.plan === "string" ? payload.plan : payload.plan?.id;
          setResult({ ...payload, plan: data.pricing.find((plan) => plan.id === planId) || payload.plan || selectedPlan });
        }
      } catch {
        if (!cancelled) setError("The conversion is still running. Refresh this page if it does not update.");
      } finally {
        inFlight = false;
      }
    }

    pollJob();
    const timer = window.setInterval(pollJob, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [result?.status, result?.jobId, result?.token, selectedPlan]);

  async function handleRedo() {
    if (!result?.jobId || !result.redoAvailable) return;
    setRedoing(true);
    setError("");
    try {
      const response = await fetch("/api/redo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: result.jobId,
          ...(result.token ? { token: result.token } : {}),
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
    if (result?.localDownloadUrl) return `Download ${selectedOutputLabel}`;
    if (result?.status === "converting_full") return "Generating full file...";
    if (unlocking) return result?.status === "preview_ready" && result?.paid ? "Generating full file..." : "Preparing...";
    if (result?.status === "complete") return `Download ${resultFormatLabel(result?.outputFormat)}`;
    if (result?.paid) return `Generate ${resultFormatLabel(outputFormat)}`;
    return `Unlock ${resultFormatLabel(outputFormat)} · ${result?.plan?.price || selectedPlan.price}`;
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
          <a href="#security">Security</a>
          <a href="/sample-csv">Samples</a>
        </nav>
        <button className="header-action" onClick={() => fileInputRef.current?.click()}>
          Upload file
          <ArrowRight size={16} />
        </button>
      </header>

      <section id="top" className="hero-section">
        <div className="hero-copy">
          <h1>AI Converter for useful files. Preview first.</h1>
          <p>
            Convert bank statements, receipts, invoices, screenshots, documents,
            audio, provider-backed file routes, and common images into useful
            outputs. AI routes handle messy files; provider routes activate when
            connected; simple image swaps stay local in your browser.
          </p>
          <div className="hero-price-strip" aria-label="Pricing summary">
            <strong>Free preview</strong>
            <span>AI extraction unlocks at {data.pricing[0].price}</span>
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
                    AI conversion only after preview
            </span>
            <span>
              <Lock size={16} />
              Local image swaps upload nothing
            </span>
          </div>
        </div>

        <section className="converter-workspace" aria-label="AI conversion workspace">
          <div className="workspace-topbar">
            <div>
              <span className="status-dot" />
              Hybrid conversion engine
            </div>
            <strong>{selected.title} to {selectedOutputLabel || selected.output}</strong>
          </div>

          <div className="workspace-grid">
            <div className="converter-list" aria-label="Converter choices">
              {liveConverters.map((converter) => (
                <button
                  className={classNames(
                    "converter-choice",
                    selectedId === converter.id && "is-selected",
                    file && !converterAcceptsFile(converter, file) && "is-muted",
                    !converterIsEnabled(converter) && "is-disabled"
                  )}
                  key={converter.id}
                  onClick={() => handleConverterSelect(converter)}
                  disabled={!converterIsEnabled(converter)}
                  type="button"
                >
                  <span className="choice-icon">
                    {converter.mode === "local-image" ? (
                      <ImageIcon size={18} />
                    ) : converter.id === "invoice" ? (
                      <FileJson size={18} />
                    ) : (
                      <FileText size={18} />
                    )}
                  </span>
                  <span>
                    <strong>{converter.title}</strong>
                    <small>{!converterIsEnabled(converter) ? "Provider key needed" : converter.state}</small>
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
                      ? `${fileSizeLabel} selected. Max ${selectedMaxSizeMb} MB${isPdfFile(file) ? ` and ${MAX_PAGES} pages` : ""}.`
                      : isLocalImageConverter
                        ? `Local file. ${selected.input} to ${selected.output}. No upload.`
                        : `Private upload. ${selected.input} to ${selected.output}. Max ${selectedMaxSizeMb} MB${isPdfFirstConverter ? ` and ${MAX_PAGES} pages` : ""}.`}
                  </small>
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={allAcceptedTypes(selectableConverters)}
                  onChange={handleFileChange}
                />
              </label>

              {file && (
                <div className="route-options" aria-label="Available conversions">
                  <span>Available for this file</span>
                  <div>
                    {compatibleConverters.map((converter) => (
                      <button
                        type="button"
                        key={converter.id}
                        className={classNames("route-option", selectedId === converter.id && "is-selected")}
                        onClick={() => handleConverterSelect(converter)}
                      >
                        {converter.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="conversion-route">
                <span>{selected.input}</span>
                <ArrowRight size={16} />
                <span>{selectedOutputLabel || selected.output}</span>
              </div>

              <p>{selected.description}</p>

              {selected.outputFormats?.length > 1 && (
                <div className="format-picker" aria-label="Output format">
                  <span>Output</span>
                  <div>
                    {selected.outputFormats.map((format) => (
                      <button
                        type="button"
                        key={format.id}
                        className={classNames("format-option", outputFormat === format.id && "is-selected")}
                        onClick={() => setOutputFormat(format.id)}
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="order-summary" aria-label="Estimated order">
                <label>
                  <span>
                    <Clock size={15} />
                    {isLocalImageConverter ? "Files" : selectedId === "bank" ? "Estimated pages" : "Pages / images"}
                  </span>
                  <input
                    min="1"
                    max="500"
                    type="number"
                    value={pageCount}
                    onChange={(event) => setPageCount(Number(event.target.value || 1))}
                    disabled={isLocalImageConverter}
                  />
                </label>
                <div>
                  <span>{isLocalImageConverter ? "Cost" : "Unlock price"}</span>
                  <strong>
                    {isLocalImageConverter ? "Free · browser local" : `${selectedPlan.price} · ${selectedPlan.detail}`}
                  </strong>
                </div>
              </div>

              {!isLocalImageConverter && (
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
              )}

              {turnstileSiteKey && !isLocalImageConverter && (
                <div className="turnstile-wrap" ref={turnstileRef} aria-label="Human check" />
              )}

              <button className="primary-button full-width" disabled={!canConvert} type="submit">
                {converting ? "Checking file..." : isLocalImageConverter ? `Convert to ${selectedOutputLabel}` : "Generate free preview"}
                {converting ? <LoaderCircle className="spin" size={18} /> : <Wand2 size={18} />}
              </button>

              {!selectedEnabled && (
                <div className="inline-note">
                  Provider conversion is built but waiting on the production CloudConvert key.
                </div>
              )}

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

              {result?.localDownloadUrl ? (
                <div className="local-result">
                  <img src={result.localPreviewUrl} alt="Converted image preview" />
                  <div>
                    <strong>{result.localFileName}</strong>
                    <p>This conversion happened in your browser. The image was not uploaded to AI Converter.</p>
                    <button className="primary-button" onClick={handleUnlock} type="button">
                      {resultButtonLabel()}
                      <Download size={17} />
                    </button>
                  </div>
                </div>
              ) : result?.status === "failed" ? (
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
                          <tr key={`${row.date || row.invoice_number || row.description || row.vendor || row.column_1 || "row"}-${index}`}>
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
                        <span>{result.status === "complete" ? resultFormatLabel(result.outputFormat) : "Preview confidence"}</span>
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
            payment, full extraction, and file download. Email monitoring stays
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
              <p>Sample preview is free. Pay once to generate and download the full AI export. Image and SVG swaps are free and local.</p>
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
          <span>Automated conversion with browser-local image and SVG swaps.</span>
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
