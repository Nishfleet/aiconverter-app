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
  RefreshCw,
  Search,
  ShieldCheck,
  Upload,
  Wand2
} from "lucide-react";
import data from "./data/converters.json";
import {
  TOP_CONVERSION_REQUESTS,
  availableConversionCount,
  availableConversionCountLabel,
  buildConversionCatalog,
  capableOutputFormats,
  confidenceDetailsForConverter,
  isLiveConverter,
  isLocalConverter,
  isProviderConverter
} from "./conversion-catalog.js";
import { convertImageInBrowser, convertRasterToSvgInBrowser } from "./local-converters.js";
import "./styles.css";

const MAX_SIZE_MB = 50;
const MAX_PAGES = 500;

const classNames = (...values) => values.filter(Boolean).join(" ");
let turnstileScriptPromise = null;
const TICKER_MIN_COPY_COUNT = 8;
const BRAND_NAME = "AI Converter";

function BrandName({ className = "" }) {
  return <strong className={classNames("brand-name", className)}>{BRAND_NAME}</strong>;
}

function renderBrandText(value) {
  const text = String(value || "");
  if (!text.includes(BRAND_NAME)) return text;
  return text.split(BRAND_NAME).map((part, index) => (
    <React.Fragment key={`${part}-${index}`}>
      {index > 0 && <BrandName />}
      {part}
    </React.Fragment>
  ));
}

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

function planById(planId) {
  return data.pricing.find((plan) => plan.id === planId) || null;
}

function converterById(converterId) {
  return data.converters.find((converter) => converter.id === converterId) || null;
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

function fileKindLabel(candidate) {
  if (!candidate) return "No file selected";
  const extension = fileExtension(candidate);
  return `${extension} · ${(candidate.size / 1024 / 1024).toFixed(1)} MB`;
}

function fileExtension(candidate) {
  if (!candidate) return "FILE";
  return candidate.name.split(".").pop()?.toUpperCase() || "FILE";
}

function fileEntryId(candidate) {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${candidate.name}-${candidate.size}-${candidate.lastModified}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function preferredConverterForFile(matches, currentSelectedId) {
  if (!matches.length) return null;
  const current = matches.find((converter) => converter.id === currentSelectedId && currentSelectedId !== "bank");
  return current || matches.find((converter) => converter.id === "universal-file") || matches[0];
}

function selectedRouteTitle(converter, candidate) {
  if (converter?.id === "universal-file" && candidate) return `Convert uploaded ${fileExtension(candidate)} file`;
  return converter?.title || "Convert uploaded file";
}

function selectedRouteDescription(converter, candidate) {
  if (converter?.id === "universal-file" && candidate) {
    return `Choose the output format for ${candidate.name}. The conversion runs in the background and keeps the result private.`;
  }
  return converter?.description || "";
}

function displayPriceForPlan(plan, pricingPreview) {
  const planId = typeof plan === "string" ? plan : plan?.id;
  return pricingPreview?.prices?.[planId]?.display || planById(planId)?.price || plan?.price || "₹299";
}

function priceInfoForPlan(plan, pricingPreview) {
  const resolvedPlan = typeof plan === "string" ? planById(plan) : plan;
  const preview = pricingPreview?.prices?.[resolvedPlan?.id];
  return {
    display: displayPriceForPlan(resolvedPlan, pricingPreview),
    amount: Number(preview?.amount ?? resolvedPlan?.amount ?? 0),
    currency: String(preview?.currency || resolvedPlan?.currency || "INR").toUpperCase()
  };
}

function formatMinorCurrency(amount, currency = "INR") {
  if (!Number.isFinite(amount)) return "";
  const normalizedCurrency = String(currency || "INR").toUpperCase();
  try {
    const decimals = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: normalizedCurrency
    }).resolvedOptions().maximumFractionDigits;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount / 10 ** decimals);
  } catch {
    return `${normalizedCurrency} ${Math.round(amount / 100)}`;
  }
}

function entryPriceInfo(entry, pricingPreview) {
  if (!entry) return { display: "", amount: 0, currency: "INR", free: false };
  const converter = converterById(entry.selectedId);
  if (isLocalConverter(converter)) return { display: "Free", amount: 0, currency: "INR", free: true };
  return priceInfoForPlan(planForPages(entry.pageCount), pricingPreview);
}

function queuePriceSummary(entries, pricingPreview) {
  const pricedEntries = entries.map((entry) => entryPriceInfo(entry, pricingPreview));
  const paidEntries = pricedEntries.filter((entry) => !entry.free);
  if (!entries.length) return "";
  if (!paidEntries.length) return "All selected files are free";
  const currency = paidEntries[0]?.currency || "INR";
  const canSum = paidEntries.every((entry) => entry.currency === currency && Number.isFinite(entry.amount));
  if (!canSum) return `${paidEntries.length} paid checkout${paidEntries.length === 1 ? "" : "s"}`;
  const total = paidEntries.reduce((sum, entry) => sum + entry.amount, 0);
  return `${formatMinorCurrency(total, currency)} if unlocked one by one`;
}

function FormatsPage({ catalog, conversionCount, universalProviderReady }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Available");
  const categories = useMemo(
    () => [
      "Available",
      "Documents",
      "Images",
      "Audio",
      "Video",
      "Spreadsheets",
      "Archives",
      "Data extraction"
    ],
    []
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visiblePairs = useMemo(
    () =>
      catalog.filter((pair) => {
        const categoryMatch =
          category === "Available"
            ? pair.available
            : pair.category === category;
        const searchMatch =
          !normalizedQuery ||
          [pair.label, pair.input, pair.output, pair.converterTitle, pair.detail, pair.category]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery));
        return categoryMatch && searchMatch;
      }),
    [catalog, category, normalizedQuery]
  );
  const upcomingConverters = data.converters.filter((converter) => !isLiveConverter(converter));
  const coveredFamilies = ["Documents", "Images", "Audio", "Video", "Archives"];

  return (
    <main className="page-shell formats-page">
      <header className="site-header" aria-label="Site header">
        <a className="brand" href="/" aria-label="AI Converter home">
          <span className="brand-mark">
            <Wand2 size={18} strokeWidth={2.4} />
          </span>
          <span className="brand-name">AI Converter</span>
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="/">Open converter</a>
          <a href="/support">Support</a>
        </nav>
      </header>

      <section className="formats-hero">
        <div>
          <h1>All conversion options</h1>
          <p>
            A plain list of what <BrandName /> can convert today, generated from the same capability map the app uses.
          </p>
        </div>
        <div className="formats-stats" aria-label="Conversion coverage">
          <div>
            <span>Available now</span>
            <strong>{availableConversionCountLabel(conversionCount)}</strong>
          </div>
          <div>
            <span>Format families</span>
            <strong>{coveredFamilies.join(", ")}</strong>
          </div>
          <div>
            <span>More formats</span>
            <strong>{universalProviderReady ? "Coming soon" : "In progress"}</strong>
          </div>
        </div>
      </section>

      <section className="formats-toolbar" aria-label="Format filters">
        <label className="formats-search">
          <Search size={17} />
          <input
            type="search"
            value={query}
            placeholder="Search a format"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="formats-tabs">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={classNames(category === item && "is-selected")}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="formats-grid" aria-label="Conversion options">
        {visiblePairs.map((pair) => (
          <article className={classNames("format-card", !pair.available && "is-disabled")} key={`${pair.converterId}-${pair.input}-${pair.output}-${pair.label}`}>
            <div>
              <span>{pair.category}</span>
              <strong>{pair.label}</strong>
              <p>{pair.detail}</p>
            </div>
            <div className="format-card-meta">
              <span>{pair.input}</span>
              <ArrowRight size={14} />
              <span>{pair.output}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="formats-confidence" aria-label="Conversion confidence rules">
        <article>
          <h2>Preview first</h2>
          <p>Most conversions show a free preview before payment. Simple image conversions download immediately.</p>
        </article>
        <article>
          <h2>Honest availability</h2>
          <p>Formats only count as available when the live app is ready to accept that input and output.</p>
        </article>
        <article>
          <h2>More coming soon</h2>
          <p>{upcomingConverters.length ? upcomingConverters.map((converter) => converter.title).join(", ") : "New routes will appear here when they are wired."}</p>
        </article>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <BrandName />
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="/">Converter</a>
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

function App() {
  const [selectedId, setSelectedId] = useState("bank");
  const [outputFormat, setOutputFormat] = useState("csv");
  const [fileQueue, setFileQueue] = useState([]);
  const [activeFileId, setActiveFileId] = useState("");
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
  const [pricingPreview, setPricingPreview] = useState(null);
  const [tickerCopyCount, setTickerCopyCount] = useState(TICKER_MIN_COPY_COUNT);
  const [tickerStyle, setTickerStyle] = useState({
    "--ticker-distance": "-25%",
    "--ticker-duration": "48s"
  });
  const fileInputRef = useRef(null);
  const tickerViewportRef = useRef(null);
  const tickerGroupRef = useRef(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);
  const routePath = window.location.pathname.replace(/\/+$/, "") || "/";

  const selected = useMemo(
    () => data.converters.find((converter) => converter.id === selectedId),
    [selectedId]
  );
  const activeFileEntry = useMemo(
    () => fileQueue.find((entry) => entry.id === activeFileId) || null,
    [fileQueue, activeFileId]
  );
  const file = activeFileEntry?.file || null;
  const universalProviderReady = Boolean(capabilities.universalProvider || capabilities.cloudConvert || capabilities.convertioBackup);
  const conversionCatalog = useMemo(
    () => buildConversionCatalog(data.converters, { universalProviderReady }),
    [universalProviderReady]
  );
  const conversionCount = useMemo(
    () => availableConversionCount(data.converters, { universalProviderReady }),
    [universalProviderReady]
  );
  const popularConversions = useMemo(
    () => [
      ...TOP_CONVERSION_REQUESTS
        .filter((request) => request.qaPriority === "core" || universalProviderReady)
        .map((request) => request.label),
      ...(universalProviderReady ? ["Docs, images, audio, video, archives", "Many more formats available"] : [])
    ],
    [universalProviderReady]
  );
  const popularConversionsSummary = universalProviderReady
    ? {
        title: availableConversionCountLabel(conversionCount),
        detail: "Generated from conversion options available today. More coming soon."
      }
    : {
        title: "More conversion options coming soon",
        detail: "New format groups appear here after they pass QA."
      };
  const converterIsEnabled = (converter) => !isProviderConverter(converter) || universalProviderReady;
  const liveConverters = useMemo(() => data.converters.filter(isLiveConverter), []);
  const selectableConverters = useMemo(
    () => liveConverters.filter(converterIsEnabled),
    [liveConverters, universalProviderReady]
  );
  const selectedOutputFormats = useMemo(() => capableOutputFormats(selected, file), [selected, file]);
  const selectedPlan = useMemo(() => planForPages(pageCount), [pageCount]);
  const selectedPlanPrice = displayPriceForPlan(selectedPlan, pricingPreview);
  const isLocalImageConverter = isLocalConverter(selected);
  const selectedEnabled = converterIsEnabled(selected);
  const selectedMaxSizeMb = selectedId === "audio-transcript" ? 25 : selectedId === "screenshot-code" ? 8 : MAX_SIZE_MB;
  const selectedConfidence = useMemo(
    () => confidenceDetailsForConverter(selected, outputFormat, { universalProviderReady }),
    [selected, outputFormat, universalProviderReady]
  );
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
  const flowStep = !file ? 1 : result ? (result.status === "complete" ? 4 : 3) : 2;

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
    fetch("/api/pricing-preview")
      .then((response) => response.json())
      .then((payload) => {
        if (payload?.available) setPricingPreview(payload);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const viewport = tickerViewportRef.current;
    const group = tickerGroupRef.current;
    if (!viewport || !group) return undefined;

    let frameId = 0;
    const updateTicker = () => {
      const groupWidth = Math.ceil(group.scrollWidth || group.getBoundingClientRect().width);
      const viewportWidth = Math.ceil(viewport.clientWidth || viewport.getBoundingClientRect().width);
      if (!groupWidth || !viewportWidth) return;

      const nextCopyCount = Math.max(TICKER_MIN_COPY_COUNT, Math.ceil(viewportWidth / groupWidth) + 3);
      setTickerCopyCount((current) => (current === nextCopyCount ? current : nextCopyCount));
      setTickerStyle((current) => {
        const nextStyle = {
          "--ticker-distance": `-${groupWidth}px`,
          "--ticker-duration": `${Math.max(28, Math.round(groupWidth / 34))}s`
        };
        return current["--ticker-distance"] === nextStyle["--ticker-distance"] &&
          current["--ticker-duration"] === nextStyle["--ticker-duration"]
          ? current
          : nextStyle;
      });
    };

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updateTicker);
    };

    scheduleUpdate();
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(viewport);
    resizeObserver.observe(group);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [popularConversions]);

  useEffect(() => {
    const nextFormat = selectedOutputFormats[0]?.id || defaultOutputFormat(selected);
    if (!selectedOutputFormats.some((format) => format.id === outputFormat)) {
      setOutputFormat(nextFormat);
      updateActiveFileSettings({ outputFormat: nextFormat });
    }
  }, [selected, selectedOutputFormats, outputFormat, activeFileId]);

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

  function initialSettingsForFile(nextFile, preferredSelectedId = selectedId) {
    if (!nextFile) {
      return {
        selectedId: selectedId || "bank",
        outputFormat: outputFormat || "csv",
        pageCount: 25
      };
    }
    const matches = selectableConverters.filter((converter) => converterAcceptsFile(converter, nextFile));
    const nextSelected = preferredConverterForFile(matches, preferredSelectedId) || selected;
    const outputFormats = capableOutputFormats(nextSelected, nextFile);
    const nextOutputFormat = outputFormats.some((format) => format.id === outputFormat)
      ? outputFormat
      : outputFormats[0]?.id || defaultOutputFormat(nextSelected);
    return {
      selectedId: nextSelected?.id || selectedId,
      outputFormat: nextOutputFormat,
      pageCount: isPdfFile(nextFile) ? estimatePages(nextFile) : 1
    };
  }

  function applyEntrySettings(entry) {
    setSelectedId(entry.selectedId);
    setOutputFormat(entry.outputFormat);
    setPageCount(entry.pageCount);
  }

  function updateActiveFileSettings(updates) {
    if (!activeFileId) return;
    setFileQueue((currentQueue) =>
      currentQueue.map((entry) => (entry.id === activeFileId ? { ...entry, ...updates } : entry))
    );
  }

  function handleOutputFormatChange(nextFormat) {
    setOutputFormat(nextFormat);
    updateActiveFileSettings({ outputFormat: nextFormat });
    setResult(null);
  }

  function handlePageCountChange(nextPageCount) {
    setPageCount(nextPageCount);
    updateActiveFileSettings({ pageCount: nextPageCount });
    setResult(null);
  }

  function activateFileEntry(entry) {
    setError("");
    setResult(null);
    setActiveFileId(entry.id);
    applyEntrySettings(entry);
  }

  function handleFileChange(event) {
    const incomingFiles = Array.from(event.target.files || []);
    if (!incomingFiles.length) return;
    const nextEntries = incomingFiles.map((nextFile) => ({
      id: fileEntryId(nextFile),
      file: nextFile,
      ...initialSettingsForFile(nextFile)
    }));
    setError("");
    setResult(null);
    setFileQueue((currentQueue) => [...currentQueue, ...nextEntries]);
    const nextActive = nextEntries[0];
    setActiveFileId(nextActive.id);
    applyEntrySettings(nextActive);
    event.target.value = "";
  }

  function handleUploadAnotherFile() {
    setError("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
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
    return `Unlock ${resultFormatLabel(outputFormat)} · ${displayPriceForPlan(result?.plan || selectedPlan, pricingPreview)}`;
  }

  if (routePath === "/formats") {
    return (
      <FormatsPage
        catalog={conversionCatalog}
        conversionCount={conversionCount}
        universalProviderReady={universalProviderReady}
      />
    );
  }

  return (
    <main className="page-shell">
      <header className="site-header" aria-label="Site header">
        <a className="brand" href="/" aria-label="AI Converter home">
          <span className="brand-mark">
            <Wand2 size={18} strokeWidth={2.4} />
          </span>
          <span className="brand-name">AI Converter</span>
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="/formats">All formats</a>
          <a href="/support">Support</a>
        </nav>
      </header>

      <section id="top" className="conversion-stage">
        <div className="conversion-heading">
          <h1>
            <span>What would you like to</span>
            <strong>convert?</strong>
          </h1>
          <p>Drop a file and <BrandName /> will suggest the cleanest outputs.</p>
        </div>

        <section className={classNames("converter-workspace", file && "has-file", result && "has-result")} aria-label="AI conversion workspace">
          <form className="conversion-flow" id="start" onSubmit={handleConvert}>
            <div className="flow-rail" aria-label="Conversion steps">
              {["Upload", "Choose output", "Preview", "Unlock"].map((step, index) => (
                <span
                  key={step}
                  className={classNames(
                    "flow-step",
                    flowStep === index + 1 && "is-active",
                    flowStep > index + 1 && "is-done"
                  )}
                >
                  <i>{index + 1}</i>
                  {step}
                </span>
              ))}
            </div>

            {!file && (
              <label className="upload-target">
                <span className="upload-symbol">
                  <Upload size={26} />
                </span>
                <span>
                  <strong>Drop a file here or click to upload</strong>
                  <small>PDF, images, audio, documents, media, and archives</small>
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={allAcceptedTypes(selectableConverters)}
                  onChange={handleFileChange}
                />
              </label>
            )}

            {file && (
              <input
                ref={fileInputRef}
                className="sr-only-file-input"
                type="file"
                multiple
                accept={allAcceptedTypes(selectableConverters)}
                onChange={handleFileChange}
              />
            )}

            {!file && (
              <div className="quiet-benefits" aria-label="Conversion guardrails">
                <span>
                  <ShieldCheck size={15} />
                  Free preview first
                </span>
                <span>
                  <Database size={15} />
                  Private short retention
                </span>
              </div>
            )}

            {file && (
              <>
                <div className="detected-file">
                  <div>
                    <FileText size={18} />
                    <span>
                      <small>{fileQueue.length > 1 ? "Active file" : "Uploaded file"}</small>
                      <strong>{file.name}</strong>
                      <small>{fileKindLabel(file)}</small>
                    </span>
                  </div>
                  <div className="detected-file-actions">
                    <button type="button" onClick={handleUploadAnotherFile}>
                      Upload another file
                    </button>
                  </div>
                </div>

                {fileQueue.length > 1 && (
                  <div className="file-queue" aria-label="Queued uploaded files">
                    <div className="mini-section-heading">
                      <span>Queued files</span>
                      <strong>{fileQueue.length} uploaded</strong>
                    </div>
                    <div className="file-queue-list">
                      {fileQueue.map((entry) => (
                        <button
                          type="button"
                          key={entry.id}
                          className={classNames("file-queue-item", entry.id === activeFileId && "is-active")}
                          onClick={() => activateFileEntry(entry)}
                        >
                          <FileText size={16} />
                          <span>
                            <strong>{entry.file.name}</strong>
                            <small>
                              {fileKindLabel(entry.file)} · Output:{" "}
                              {outputLabel(
                                data.converters.find((converter) => converter.id === entry.selectedId),
                                entry.outputFormat
                              )} · {entryPriceInfo(entry, pricingPreview).display}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="selected-route-panel">
                  <div>
                    <h2>{selectedRouteTitle(selected, file)}</h2>
                    <p>{renderBrandText(selectedRouteDescription(selected, file))}</p>
                  </div>

                  {selectedOutputFormats.length > 1 && (
                    <div className="format-picker" aria-label="Output format">
                      <span>Choose output</span>
                      <div>
                        {selectedOutputFormats.map((format) => (
                          <button
                            type="button"
                            key={format.id}
                            className={classNames("format-option", outputFormat === format.id && "is-selected")}
                            onClick={() => handleOutputFormatChange(format.id)}
                          >
                            {format.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="instant-price-panel" aria-label="Instant price estimate">
                    <div>
                      <span>Price for this file</span>
                      <strong>{entryPriceInfo(activeFileEntry, pricingPreview).display}</strong>
                      <small>
                        {isLocalImageConverter
                          ? `${selectedOutputLabel} · no checkout needed`
                          : `${selectedOutputLabel} · ${selectedPlan.detail} · pay after preview`}
                      </small>
                    </div>
                    {fileQueue.length > 1 && (
                      <div>
                        <span>Queued files</span>
                        <strong>{queuePriceSummary(fileQueue, pricingPreview)}</strong>
                        <small>{fileQueue.length} uploaded files priced from their selected outputs</small>
                      </div>
                    )}
                  </div>

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
                        onChange={(event) => handlePageCountChange(Number(event.target.value || 1))}
                        disabled={isLocalImageConverter}
                      />
                    </label>
                    <div>
                      <span>{isLocalImageConverter ? "Cost" : "Checkout amount"}</span>
                      <strong>
                        {isLocalImageConverter ? "Free" : `${selectedPlanPrice} · ${selectedPlan.detail}`}
                      </strong>
                    </div>
                  </div>

                  <div className="confidence-panel" aria-label="Selected conversion details">
                    <div>
                      <span>Output</span>
                      <strong>{selectedConfidence.output}</strong>
                    </div>
                    <div>
                      <span>Preview</span>
                      <strong>{selectedConfidence.preview}</strong>
                    </div>
                    <div>
                      <span>Privacy</span>
                      <strong>{selectedConfidence.privacy}</strong>
                    </div>
                    <div>
                      <span>Limit</span>
                      <strong>{selectedConfidence.limit}</strong>
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
                      This conversion is built but waiting on a production key.
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="inline-alert" role="alert">
                <AlertCircle size={17} />
                <span>{error}</span>
              </div>
            )}
          </form>

          {result && (
            <aside className="preview-panel">
              <div className="preview-header">
                <div>
                  <FileSpreadsheet size={18} />
                  <strong>Preview</strong>
                </div>
                <span>{previewCountLabel}</span>
              </div>

              {result.localDownloadUrl ? (
                <div className="local-result">
                  <img src={result.localPreviewUrl} alt="Converted image preview" />
                  <div>
                    <strong>{result.localFileName}</strong>
                    <p>This conversion happened in your browser. The image was not uploaded to <BrandName />.</p>
                    <button className="primary-button" onClick={handleUnlock} type="button">
                      {resultButtonLabel()}
                      <Download size={17} />
                    </button>
                  </div>
                </div>
              ) : result.status === "failed" ? (
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

                  {["preview_ready", "complete", "converting_full"].includes(result.status) && (
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
                  {result.refundStatus && (
                    <div className="inline-note">
                      {result.refundStatus === "credit_due"
                        ? "Credit review is queued because a full CSV was already delivered."
                        : "Refund review is queued for this failed paid export."}
                    </div>
                  )}
                </>
              )}
            </aside>
          )}
        </section>

        <section className="popular-conversions" aria-label="Popular conversion suggestions">
          <div className="popular-conversions-row">
            <span className="popular-conversions-label">Popular requests</span>
            <div className="conversion-ticker" aria-hidden="true" ref={tickerViewportRef}>
              <div className="conversion-ticker-track" style={tickerStyle}>
                {Array.from({ length: tickerCopyCount }, (_, copyIndex) => (
                  <div
                    className={classNames("ticker-group", copyIndex > 0 && "is-duplicate")}
                    key={copyIndex}
                    ref={copyIndex === 0 ? tickerGroupRef : null}
                  >
                    {popularConversions.map((item) => (
                      <span className="ticker-chip" key={`${copyIndex}-${item}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="popular-conversions-more">
            <strong>{popularConversionsSummary.title}</strong>
            <span>{popularConversionsSummary.detail}</span>
          </div>
          <ul className="sr-only">
            {popularConversions.map((item) => (
              <li key={item}>{item}</li>
            ))}
            <li>{popularConversionsSummary.title}. {popularConversionsSummary.detail}</li>
          </ul>
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
          <h2>Built for files you would not email around.</h2>
          <p>
            Upload directly, review a sample, then unlock only if it looks right.
            Source files stay private, expire quickly, and never enter a human
            file review queue.
          </p>
        </div>
        <div className="queue-list">
          <article className="queue-item">
            <span className="queue-number">01</span>
            <div>
              <h3>Upload directly</h3>
              <p>Your file goes into private storage for preview and download, not a public link or shared inbox.</p>
            </div>
            <strong>Private</strong>
          </article>
          <article className="queue-item">
            <span className="queue-number">02</span>
            <div>
              <h3>Check a real sample</h3>
              <p>We parse digital bank PDFs first and use OCR only when a file needs it. If the preview is not reliable, the job stops.</p>
            </div>
            <strong>Fail-closed</strong>
          </article>
          <article className="queue-item">
            <span className="queue-number">03</span>
            <div>
              <h3>Unlock, download, expire</h3>
              <p>Pay only after the preview. Paid jobs can run one stronger redo, then source files leave the short retention window.</p>
            </div>
            <strong>Short retention</strong>
          </article>
        </div>
      </section>

      <section id="pricing" className="pricing-section">
        <div className="section-heading compact">
          <h2>Higher-trust conversion. Lower one-off pricing.</h2>
          <p>Preview is free. Pay once only when the sample looks right.</p>
        </div>
        <div className="pricing-grid">
          {data.pricing.map((plan) => (
            <article className="price-card" key={plan.name}>
              <h3>{plan.name}</h3>
              <strong>{displayPriceForPlan(plan, pricingPreview)}</strong>
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
          <h2>Private conversion, plainly stated.</h2>
          <p>
            Source files are private, never accepted by email, and removed after failed
            extraction, completed redo, or the 24-hour lifecycle. Local image and SVG
            conversions stay in your browser.
          </p>
        </div>
        <button className="primary-button" onClick={() => fileInputRef.current?.click()}>
          Upload file
          <Upload size={18} />
        </button>
      </section>

      <footer className="footer">
        <div className="footer-brand">
          <BrandName />
        </div>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="/privacy">Privacy</a>
          <a href="/formats">Formats</a>
          <a href="/about">About</a>
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
