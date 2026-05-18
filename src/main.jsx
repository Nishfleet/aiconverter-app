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
  Trash2,
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
const BANK_NATIVE_FORMATS = new Set(["ofx", "qbo"]);
const BANK_ADVANCED_FORMATS = new Set(["ofx", "qbo", "qif"]);
const BANK_CSV_FORMATS = new Set(["quickbooks-csv", "xero-csv", "wave-csv", "gnucash-csv", "csv"]);

const classNames = (...values) => values.filter(Boolean).join(" ");
let turnstileScriptPromise = null;
const TICKER_MIN_COPY_COUNT = 8;
const BRAND_NAME = "AI Converter";
const BATCH_RETURN_KEY = "aiconverter_batch_return";

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

function bankNativeNeedsDetails(outputFormat) {
  return BANK_NATIVE_FORMATS.has(outputFormat);
}

function defaultBankDetails() {
  return {
    bankName: "",
    bankId: "",
    accountId: "",
    accountType: "CHECKING",
    currency: "USD",
    intuitBankId: ""
  };
}

function isBankAdvancedFormat(format) {
  return BANK_ADVANCED_FORMATS.has(String(format || "").toLowerCase());
}

function isEditableBankCsvResult(result) {
  return result?.status === "complete" && result?.converterId === "bank" && BANK_CSV_FORMATS.has(result?.outputFormat);
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
    "quickbooks-csv": "QuickBooks CSV",
    "xero-csv": "Xero CSV",
    "wave-csv": "Wave CSV",
    "gnucash-csv": "GnuCash CSV",
    qif: "QIF",
    ofx: "OFX",
    qbo: "QBO",
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
    csv: "aiconverter-export.csv",
    "quickbooks-csv": "aiconverter-quickbooks.csv",
    "xero-csv": "aiconverter-xero.csv",
    "wave-csv": "aiconverter-wave.csv",
    "gnucash-csv": "aiconverter-gnucash.csv",
    qif: "aiconverter-bank.qif",
    ofx: "aiconverter-bank.ofx",
    qbo: "aiconverter-bank.qbo"
  };
  return names[extension] || `aiconverter-export.${extension}`;
}

function previewMetricLabel(converterId, result) {
  if (converterId === "audio-transcript") return `${result.rowCount || 0} words`;
  if (["document-markdown", "screenshot-code", "universal-file"].includes(converterId)) return "1 generated file";
  return `${result.rowCount || 0} rows`;
}

function paymentNoticeForResult(result) {
  if (!result || result.paid) return "";
  const status = String(result.paymentStatus || "").toLowerCase();
  const event = String(result.paymentEvent || "").toLowerCase();
  if (status === "failed" || event === "payment.failed") {
    return result.paymentMessage || "Payment failed. Try again with another card.";
  }
  if (status === "cancelled" || event === "payment.cancelled") {
    return result.paymentMessage || "Payment was cancelled. You can try checkout again.";
  }
  if (status === "processing" || event === "payment.processing") {
    return result.paymentMessage || "Payment is still processing. Refresh this conversion in a moment.";
  }
  return "";
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
  return pricingPreview?.prices?.[planId]?.display || planById(planId)?.price || plan?.price || "₹399";
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

function formatRetentionCountdown(value, now) {
  const expiry = Date.parse(value || "");
  if (!Number.isFinite(expiry)) return "";
  const remaining = expiry - now;
  if (remaining <= 0) return "expired";
  const minutes = Math.max(1, Math.ceil(remaining / 60000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function entryPriceInfo(entry, pricingPreview) {
  if (!entry) return { display: "", amount: 0, currency: "INR", free: false };
  const converter = converterById(entry.selectedId);
  if (isLocalConverter(converter)) return { display: "Free", amount: 0, currency: "INR", free: true };
  return priceInfoForPlan(planForPages(entry.pageCount), pricingPreview);
}

function queuePriceSummary(entries, pricingPreview) {
  if (!entries.length) return "";
  const paidFileEntries = entries.filter((entry) => !isLocalConverter(converterById(entry.selectedId)));
  const paidEntries = paidFileEntries.map((entry) => entryPriceInfo(entry, pricingPreview)).filter((entry) => !entry.free);
  if (!paidEntries.length) return "All selected files are free";
  const totalPages = paidFileEntries.reduce((sum, entry) => sum + Math.max(1, Number(entry.pageCount || 1)), 0);
  return priceInfoForPlan(planForPages(totalPages), pricingPreview).display;
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
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-glyph">
              <span className="brand-glyph-core" />
              <span className="brand-glyph-spark spark-a" />
              <span className="brand-glyph-spark spark-b" />
              <span className="brand-glyph-spark spark-c" />
            </span>
          </span>
          <span className="brand-name">AI Converter</span>
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="/">Open converter</a>
          <a href="/support/">Support</a>
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
          <a href="/privacy/">Privacy</a>
          <a href="/terms/">Terms</a>
          <a href="/refund/">Refunds</a>
          <a href="/security/">Security</a>
          <a href="/trust/">Trust center</a>
          <a href="/data-retention/">Data retention</a>
          <a href="/support/">Support</a>
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
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [bankDetails, setBankDetails] = useState(defaultBankDetails);
  const [email, setEmail] = useState("");
  const [converting, setConverting] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [redoing, setRedoing] = useState(false);
  const [deletingJob, setDeletingJob] = useState(false);
  const [reviewRowsOpen, setReviewRowsOpen] = useState(false);
  const [reviewRowsLoading, setReviewRowsLoading] = useState(false);
  const [reviewRowsSaving, setReviewRowsSaving] = useState(false);
  const [reviewColumns, setReviewColumns] = useState([]);
  const [reviewRows, setReviewRows] = useState([]);
  const [reviewRowsTruncated, setReviewRowsTruncated] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
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
  const [retentionNow, setRetentionNow] = useState(Date.now());
  const fileInputRef = useRef(null);
  const tickerViewportRef = useRef(null);
  const tickerGroupRef = useRef(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);
  const activeFileIdRef = useRef("");
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
  const primaryOutputFormats = useMemo(
    () =>
      selectedId === "bank"
        ? selectedOutputFormats.filter((format) => !isBankAdvancedFormat(format.id))
        : selectedOutputFormats,
    [selectedId, selectedOutputFormats]
  );
  const advancedBankOutputFormats = useMemo(
    () => (selectedId === "bank" ? selectedOutputFormats.filter((format) => isBankAdvancedFormat(format.id)) : []),
    [selectedId, selectedOutputFormats]
  );
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
  const completedServerResults = useMemo(
    () =>
      fileQueue
        .map((entry) => entry.result)
        .filter((entryResult) => entryResult?.status === "complete" && entryResult.jobId && !entryResult.localDownloadUrl),
    [fileQueue]
  );
  const previewReadyServerResults = useMemo(
    () =>
      fileQueue
        .map((entry) => entry.result)
        .filter(
          (entryResult) =>
            entryResult?.status === "preview_ready" &&
            !entryResult.paid &&
            entryResult.jobId &&
            !entryResult.localDownloadUrl
        ),
    [fileQueue]
  );
  const isPdfFirstConverter = selectedId === "bank";
  const selectedOutputLabel = outputLabel(selected, outputFormat);
  const needsBankDetailsForOutput = selectedId === "bank" && bankNativeNeedsDetails(outputFormat);
  const bankDetailsReady =
    !needsBankDetailsForOutput ||
    Boolean(
      bankDetails.bankId.trim() &&
        bankDetails.accountId.trim() &&
        (outputFormat !== "qbo" || bankDetails.intuitBankId.trim())
    );
  const canConvert =
    file &&
    !converting &&
    file.size <= selectedMaxSizeMb * 1024 * 1024 &&
    pageCount <= MAX_PAGES &&
    selectedEnabled &&
    bankDetailsReady &&
    (isLocalImageConverter || !needsTurnstile || Boolean(turnstileToken));
  const flowStep = !file ? 1 : result ? (result.status === "complete" ? 4 : 3) : 2;
  const canDeleteServerJob = Boolean(result?.jobId && ["preview_ready", "complete"].includes(result.status));
  const canReviewRows = isEditableBankCsvResult(result);
  const sourceCountdown = result?.sourceDeletedAt
    ? "deleted"
    : formatRetentionCountdown(result?.sourceExpiresAt, retentionNow);
  const resultCountdown = formatRetentionCountdown(result?.resultExpiresAt, retentionNow);
  const paymentNotice = paymentNoticeForResult(result);

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

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
    const allowedFormats = selectedId === "bank" && !showBankDetails ? primaryOutputFormats : selectedOutputFormats;
    const nextFormat = allowedFormats[0]?.id || selectedOutputFormats[0]?.id || defaultOutputFormat(selected);
    if (!selectedOutputFormats.some((format) => format.id === outputFormat)) {
      setOutputFormat(nextFormat);
      updateActiveFileSettings({ outputFormat: nextFormat });
    }
  }, [selected, selectedId, selectedOutputFormats, primaryOutputFormats, showBankDetails, outputFormat, activeFileId]);

  useEffect(() => {
    return () => {
      if (result?.localDownloadUrl) URL.revokeObjectURL(result.localDownloadUrl);
    };
  }, [result?.localDownloadUrl]);

  useEffect(() => {
    setReviewRowsOpen(false);
    setReviewRows([]);
    setReviewColumns([]);
    setReviewRowsTruncated(false);
    setReviewMessage("");
  }, [result?.jobId, result?.outputFormat]);

  useEffect(() => {
    if (!result?.sourceExpiresAt && !result?.resultExpiresAt) return undefined;
    const timer = window.setInterval(() => setRetentionNow(Date.now()), 60000);
    setRetentionNow(Date.now());
    return () => window.clearInterval(timer);
  }, [result?.sourceExpiresAt, result?.resultExpiresAt]);

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
    const urlBatchId = params.get("batchId");
    const jobId = urlJobId || "";
    const paymentId = params.get("payment_id") || params.get("paymentId");
    const paymentStatus = params.get("status") || params.get("payment_status");
    const shouldCleanUrl = Boolean(urlJobId || urlBatchId || paymentId || paymentStatus);
    if (urlBatchId) {
      restoreBatch(urlBatchId)
        .catch(() => setError("We could not restore that batch. Contact support if you were charged."))
        .finally(() => window.history.replaceState({}, "", window.location.pathname));
      return;
    }
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

  async function restoreBatch(batchId) {
    const stored = JSON.parse(sessionStorage.getItem(BATCH_RETURN_KEY) || "{}");
    if (stored.batchId !== batchId || !Array.isArray(stored.jobs) || stored.jobs.length < 2) {
      throw new Error("Missing batch return details.");
    }
    for (const item of stored.jobs) {
      const response = await fetch("/api/job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: item.jobId, token: item.token || "" })
      });
      const restored = await response.json();
      if (!response.ok) throw new Error(restored.error || "Batch restore failed.");
      const restoredResult = {
        ...restored,
        token: restored.token || item.token || "",
        plan: data.pricing.find((plan) => plan.id === restored.plan) || selectedPlan
      };
      setResultForFile(item.fileEntryId, restoredResult);
      if (restoredResult.paid && restoredResult.status === "preview_ready") {
        await finalizeConversion(item.jobId, restoredResult.token || item.token || "", "", item.fileEntryId);
      }
    }
    sessionStorage.removeItem(BATCH_RETURN_KEY);
  }

  function initialSettingsForFile(nextFile, preferredSelectedId = selectedId) {
    if (!nextFile) {
      return {
        selectedId: selectedId || "bank",
        outputFormat: outputFormat || "csv",
        pageCount: 25,
        bankDetails: defaultBankDetails()
      };
    }
    const matches = selectableConverters.filter((converter) => converterAcceptsFile(converter, nextFile));
    const nextSelected = preferredConverterForFile(matches, preferredSelectedId) || selected;
    const outputFormats = capableOutputFormats(nextSelected, nextFile);
    const preferredOutputFormat = nextSelected?.id === "bank" && isBankAdvancedFormat(outputFormat) ? "" : outputFormat;
    const nextOutputFormat = outputFormats.some((format) => format.id === preferredOutputFormat)
      ? outputFormat
      : outputFormats[0]?.id || defaultOutputFormat(nextSelected);
    return {
      selectedId: nextSelected?.id || selectedId,
      outputFormat: nextOutputFormat,
      pageCount: isPdfFile(nextFile) ? estimatePages(nextFile) : 1,
      bankDetails: defaultBankDetails()
    };
  }

  function applyEntrySettings(entry) {
    setSelectedId(entry.selectedId);
    setOutputFormat(entry.outputFormat);
    setPageCount(entry.pageCount);
    setBankDetails(entry.bankDetails || defaultBankDetails());
    setShowBankDetails(entry.selectedId === "bank" && isBankAdvancedFormat(entry.outputFormat));
  }

  function updateActiveFileSettings(updates) {
    if (!activeFileId) return;
    setFileQueue((currentQueue) =>
      currentQueue.map((entry) => (entry.id === activeFileId ? { ...entry, ...updates } : entry))
    );
  }

  function clearActiveResult() {
    setResult(null);
    updateActiveFileSettings({ result: null, status: "" });
  }

  function attachResultToFile(fileId, nextResult) {
    if (!fileId || !nextResult) return;
    setFileQueue((currentQueue) =>
      currentQueue.map((entry) =>
        entry.id === fileId
          ? {
              ...entry,
              selectedId: nextResult.converterId || entry.selectedId,
              outputFormat: nextResult.outputFormat || entry.outputFormat,
              result: nextResult,
              status: nextResult.status || entry.status
            }
          : entry
      )
    );
  }

  function setResultForFile(fileId, nextResult) {
    const resultWithOwner = nextResult ? { ...nextResult, fileEntryId: fileId } : nextResult;
    if (!fileId) {
      setResult(resultWithOwner);
      return;
    }
    if (activeFileIdRef.current === fileId) setResult(resultWithOwner);
    attachResultToFile(fileId, resultWithOwner);
  }

  function handleOutputFormatChange(nextFormat) {
    setOutputFormat(nextFormat);
    if (selectedId === "bank" && isBankAdvancedFormat(nextFormat)) setShowBankDetails(true);
    updateActiveFileSettings({ outputFormat: nextFormat });
    clearActiveResult();
  }

  function toggleBankDetails() {
    setShowBankDetails((current) => {
      const next = !current;
      if (!next && isBankAdvancedFormat(outputFormat)) {
        const nextFormat = primaryOutputFormats[0]?.id || "quickbooks-csv";
        setOutputFormat(nextFormat);
        updateActiveFileSettings({ outputFormat: nextFormat });
        clearActiveResult();
      }
      return next;
    });
  }

  function handlePageCountChange(nextPageCount) {
    setPageCount(nextPageCount);
    updateActiveFileSettings({ pageCount: nextPageCount });
    clearActiveResult();
  }

  function handleBankDetailsChange(field, value) {
    setBankDetails((current) => {
      const nextDetails = { ...current, [field]: value };
      updateActiveFileSettings({ bankDetails: nextDetails });
      return nextDetails;
    });
    clearActiveResult();
  }

  function activateFileEntry(entry) {
    setError("");
    setResult(entry.result || null);
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
    const fileId = activeFileId;
    const fileToConvert = file;
    const converterToUse = selectedId;
    const outputToUse = outputFormat;
    const planToUse = selectedPlan;
    const pageCountToUse = pageCount;
    const emailToUse = email;
    const bankDetailsToUse = bankDetails;

    const form = new FormData();
    form.append("file", fileToConvert);
    form.append("converterId", converterToUse);
    form.append("email", emailToUse);
    form.append("planId", planToUse.id);
    form.append("estimatedPages", String(pageCountToUse));
    form.append("outputFormat", outputToUse);
    if (converterToUse === "bank" && BANK_ADVANCED_FORMATS.has(outputToUse)) {
      form.append("accountingMetadata", JSON.stringify(bankDetailsToUse));
    }
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

      setResultForFile(fileId, payload);
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
    const fileId = activeFileId;
    const fileToConvert = file;
    const outputToUse = outputFormat;
    const selectedToUse = selected;
    const selectedIdToUse = selectedId;

    try {
      const converted =
        selectedToUse?.mode === "local-svg"
          ? await convertRasterToSvgInBrowser(fileToConvert)
          : await convertImageInBrowser(fileToConvert, outputToUse);
      const localResult = {
        status: "complete",
        localDownloadUrl: converted.url,
        localFileName: converted.fileName,
        localPreviewUrl: converted.url,
        outputFormat: outputToUse,
        converterId: selectedIdToUse,
        rowCount: 1,
        confidence: 1,
        paid: true,
        columns: [],
        previewRows: []
      };
      setResultForFile(fileId, localResult);
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

  async function handleBatchUnlock() {
    if (previewReadyServerResults.length < 2) return;
    setUnlocking(true);
    setError("");
    try {
      const jobs = previewReadyServerResults.map((entryResult) => ({
        jobId: entryResult.jobId,
        token: entryResult.token || "",
        fileEntryId: entryResult.fileEntryId || ""
      }));
      const response = await fetch("/api/batch-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          jobs: jobs.map(({ jobId, token }) => ({ jobId, token }))
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Batch checkout is not ready yet.");

      if (payload.mode === "finalize_all") {
        for (const item of jobs) await finalizeConversion(item.jobId, item.token, "", item.fileEntryId);
        return;
      }

      if (payload.mode === "checkout" && payload.checkoutUrl) {
        sessionStorage.setItem(BATCH_RETURN_KEY, JSON.stringify({ batchId: payload.batchId, jobs }));
        window.location.href = payload.checkoutUrl;
        return;
      }

      throw new Error("Batch checkout is not ready yet.");
    } catch (err) {
      setError(err.message || "Batch checkout is not ready yet.");
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

  async function downloadValidationReport() {
    if (!result?.jobId || !result.validationReportAvailable) return;
    setError("");
    try {
      const response = await fetch("/api/validation-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: result.jobId, ...(result.token ? { token: result.token } : {}) })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "The validation report could not be downloaded.");
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = "aiconverter-validation-report.txt";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(err.message || "The validation report could not be downloaded.");
    }
  }

  async function loadReviewRows() {
    if (!canReviewRows) return;
    if (reviewRowsOpen && reviewRows.length) {
      setReviewRowsOpen(false);
      return;
    }
    setReviewRowsOpen(true);
    setReviewRowsLoading(true);
    setReviewMessage("");
    setError("");
    try {
      const response = await fetch("/api/result-rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: result.jobId, ...(result.token ? { token: result.token } : {}) })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The rows could not be loaded.");
      setReviewColumns(payload.columns || []);
      setReviewRows(payload.rows || []);
      setReviewRowsTruncated(Boolean(payload.truncated));
      setReviewMessage(
        payload.truncated
          ? `Loaded the first ${payload.maxRows} rows. Large exports must be edited after download so rows are not dropped.`
          : `${payload.totalRows || payload.rows?.length || 0} rows loaded.`
      );
    } catch (err) {
      setError(err.message || "The rows could not be loaded.");
      setReviewRowsOpen(false);
    } finally {
      setReviewRowsLoading(false);
    }
  }

  function updateReviewCell(rowIndex, columnKey, value) {
    setReviewRows((currentRows) =>
      currentRows.map((row, index) => (index === rowIndex ? { ...row, [columnKey]: value } : row))
    );
  }

  async function saveReviewRows() {
    if (!canReviewRows || !reviewRows.length) return;
    if (reviewRowsTruncated) {
      setReviewMessage("Large exports must be edited after download so rows are not dropped.");
      return;
    }
    setReviewRowsSaving(true);
    setReviewMessage("");
    setError("");
    try {
      const response = await fetch("/api/update-result-rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: result.jobId,
          ...(result.token ? { token: result.token } : {}),
          columns: reviewColumns,
          rows: reviewRows
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The edited rows could not be saved.");
      const nextResult = {
        ...result,
        ...payload,
        plan: result.plan,
        converterId: result.converterId,
        token: result.token,
        fileEntryId: result.fileEntryId
      };
      setResultForFile(result.fileEntryId || activeFileId, nextResult);
      setReviewMessage(payload.message || "Saved. The download now uses your edited rows.");
    } catch (err) {
      setError(err.message || "The edited rows could not be saved.");
    } finally {
      setReviewRowsSaving(false);
    }
  }

  async function downloadCompletedZip() {
    if (completedServerResults.length < 2) return;
    setError("");
    try {
      const response = await fetch("/api/batch-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobs: completedServerResults.map((entryResult) => ({
            jobId: entryResult.jobId,
            token: entryResult.token || ""
          }))
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "The ZIP could not be downloaded.");
      }
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = `aiconverter-batch-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(err.message || "The ZIP could not be downloaded.");
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

  async function finalizeConversion(jobId, token = "", paymentId = "", fileId = result?.fileEntryId || activeFileId) {
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
      const nextResult = { ...payload, plan: data.pricing.find((plan) => plan.id === planId) || payload.plan || selectedPlan };
      setResultForFile(fileId, nextResult);
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
    const fileId = result.fileEntryId || activeFileId;

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
          const nextResult = { ...payload, plan: data.pricing.find((plan) => plan.id === planId) || payload.plan || selectedPlan };
          setResultForFile(fileId, nextResult);
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
  }, [result?.status, result?.jobId, result?.token, result?.fileEntryId, selectedPlan, activeFileId]);

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
      const nextResult = { ...payload, plan: data.pricing.find((plan) => plan.id === planId) || payload.plan || selectedPlan };
      setResultForFile(result.fileEntryId || activeFileId, nextResult);
    } catch (err) {
      setError(err.message || "The stronger redo could not be prepared.");
    } finally {
      setRedoing(false);
    }
  }

  async function handleDeleteJob() {
    if (!canDeleteServerJob) return;
    setDeletingJob(true);
    setError("");
    try {
      const response = await fetch("/api/delete-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: result.jobId, ...(result.token ? { token: result.token } : {}) })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "This conversion could not be deleted.");
      const nextResult = {
        ...payload,
        converterId: result.converterId,
        outputFormat: result.outputFormat,
        columns: result.columns || [],
        previewRows: [],
        rowCount: 0,
        confidence: 0,
        plan: result.plan
      };
      setResultForFile(result.fileEntryId || activeFileId, nextResult);
    } catch (err) {
      setError(err.message || "This conversion could not be deleted.");
    } finally {
      setDeletingJob(false);
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
      <div className="announcement-bar" aria-label="Product status">
        <p>Private previews are live.</p>
        <a href="#start">Start free preview →</a>
      </div>

      <header className="site-header" aria-label="Site header">
        <a className="brand" href="/" aria-label="AI Converter home">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-glyph">
              <span className="brand-glyph-core" />
              <span className="brand-glyph-spark spark-a" />
              <span className="brand-glyph-spark spark-b" />
              <span className="brand-glyph-spark spark-c" />
            </span>
          </span>
          <span className="brand-name">AI Converter</span>
        </a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="/formats/">All formats</a>
          <a href="#pricing">Pricing</a>
          <a href="/support/">Support</a>
          <a className="nav-proof" href="#security">Private</a>
          <a className="nav-cta" href="#start">Start private preview</a>
        </nav>
      </header>

      <section id="top" className="conversion-stage">
        <div className="hero-backdrop" aria-hidden="true">
          <span className="hero-label label-ok">[ 200 OK ]</span>
          <span className="hero-label label-csv">[ .CSV ]</span>
          <span className="hero-label label-md">[ .MD ]</span>
          <span className="hero-cross cross-a">✦</span>
          <span className="hero-cross cross-b">✦</span>
          <span className="hero-pixel pixel-a" />
          <span className="hero-pixel pixel-b" />
          <pre className="hero-ascii ascii-left">{`+= receipt\n++ date amount\n+ clean rows\n+= csv json`}</pre>
          <pre className="hero-ascii ascii-right">{`{ file }\n  rows: true\n  paid: after\n  private: yes`}</pre>
        </div>

        <div className="landing-hero-grid">
          <div className="conversion-heading">
            <a className="hero-chip-row" href="#start" aria-label="Start with a free preview">
              <span>Preview before checkout</span>
              <ArrowRight size={14} />
            </a>
            <h1>
              <span>Messy files in.</span>
              {" "}
              <strong>Clean exports out.</strong>
            </h1>
            <p>
              Upload a bank statement, receipt, invoice, document, audio file,
              image, or archive. <BrandName /> generates a real preview first and
              only charges when you unlock the export.
            </p>
          </div>

          <section className={classNames("converter-workspace", file && "has-file", result && "has-result")} aria-label="AI conversion workspace">
          <form className="conversion-flow" id="start" onSubmit={handleConvert}>
            <div className="workspace-console-bar" aria-hidden="true">
              <span>Bank PDFs</span>
              <span>Receipts</span>
              <span>Documents</span>
              <span>Any file</span>
            </div>
            {file && (
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
            )}

            {!file && (
              <div className="hero-lab-grid">
                <label className="upload-target">
                  <span className="upload-symbol">
                    <Upload size={26} />
                  </span>
                  <span>
                    <strong>Upload a file for a private preview</strong>
                    <small>PDFs, images, audio, documents, media, and archives</small>
                  </span>
                  <span className="upload-go" aria-hidden="true">
                    <ArrowRight size={20} />
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={allAcceptedTypes(selectableConverters)}
                    onChange={handleFileChange}
                  />
                </label>
                <div className="export-preview-card" aria-hidden="true">
                  <div className="export-preview-top">
                    <span>Preview output</span>
                    <strong>CSV</strong>
                  </div>
                  <div className="export-preview-table">
                    <span>Date</span>
                    <span>Description</span>
                    <span>Amount</span>
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
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
                  <FileText size={15} />
                  Real preview first
                </span>
                <span>
                  <ShieldCheck size={15} />
                  Pay only to export
                </span>
                <span>
                  <Database size={15} />
                  Private short retention
                </span>
                <span>
                  <Wand2 size={15} />
                  No human review
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
                    {previewReadyServerResults.length > 1 && (
                      <button className="primary-button full-width batch-zip-button" type="button" onClick={handleBatchUnlock} disabled={unlocking}>
                        Unlock queued previews
                        {unlocking ? <LoaderCircle className="spin" size={16} /> : <CreditCard size={16} />}
                      </button>
                    )}
                    {completedServerResults.length > 1 && (
                      <button className="secondary-button full-width batch-zip-button" type="button" onClick={downloadCompletedZip}>
                        Download completed ZIP
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                )}

                <div className="selected-route-panel">
                  <div>
                    <h2>{selectedRouteTitle(selected, file)}</h2>
                    <p>{renderBrandText(selectedRouteDescription(selected, file))}</p>
                  </div>

                  {primaryOutputFormats.length > 1 && (
                    <div className="format-picker" aria-label="Output format">
                      <span>Choose output</span>
                      <div>
                        {primaryOutputFormats.map((format) => (
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

                  {selectedId === "bank" && (
                    <div className="advanced-bank-file">
                      <button
                        type="button"
                        className="advanced-toggle"
                        onClick={toggleBankDetails}
                      >
                        Need OFX/QBO? Add bank details
                        <ArrowRight size={15} className={classNames(showBankDetails && "is-open")} />
                      </button>
                      {showBankDetails && (
                        <div className="advanced-bank-body">
                          <div className="format-picker compact" aria-label="Advanced bank file output">
                            <span>Advanced output</span>
                            <div>
                              {advancedBankOutputFormats.map((format) => (
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
                          {needsBankDetailsForOutput && (
                            <div className="bank-details-grid" aria-label="Bank details for OFX and QBO">
                              <label>
                                <span>Bank name</span>
                                <input
                                  value={bankDetails.bankName}
                                  onChange={(event) => handleBankDetailsChange("bankName", event.target.value)}
                                  placeholder="Bank name"
                                />
                              </label>
                              <label>
                                <span>Routing / bank ID</span>
                                <input
                                  value={bankDetails.bankId}
                                  onChange={(event) => handleBankDetailsChange("bankId", event.target.value)}
                                  placeholder="ABA, sort code, bank code"
                                />
                              </label>
                              <label>
                                <span>Account ID</span>
                                <input
                                  value={bankDetails.accountId}
                                  onChange={(event) => handleBankDetailsChange("accountId", event.target.value)}
                                  placeholder="Account number or ID"
                                />
                              </label>
                              <label>
                                <span>Currency</span>
                                <input
                                  value={bankDetails.currency}
                                  onChange={(event) => handleBankDetailsChange("currency", event.target.value.toUpperCase())}
                                  placeholder="USD"
                                  maxLength={3}
                                />
                              </label>
                              <label>
                                <span>Account type</span>
                                <select
                                  value={bankDetails.accountType}
                                  onChange={(event) => handleBankDetailsChange("accountType", event.target.value)}
                                >
                                  <option value="CHECKING">Checking</option>
                                  <option value="SAVINGS">Savings</option>
                                  <option value="MONEYMRKT">Money market</option>
                                  <option value="CREDITLINE">Credit line</option>
                                  <option value="CD">CD</option>
                                </select>
                              </label>
                              <label>
                                <span>QuickBooks institution ID</span>
                                <input
                                  value={bankDetails.intuitBankId}
                                  onChange={(event) => handleBankDetailsChange("intuitBankId", event.target.value)}
                                  placeholder="Only needed for QBO"
                                />
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {needsBankDetailsForOutput && !bankDetailsReady && (
                    <div className="inline-note">
                      {outputFormat === "qbo"
                        ? "QBO needs routing / bank ID, account ID, and QuickBooks institution ID."
                        : "OFX needs routing / bank ID and account ID."}
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
                        <small>{fileQueue.length} uploaded files priced as one checkout when unlocked together</small>
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

              {paymentNotice && (
                <div className="inline-alert payment-alert" role="status">
                  <AlertCircle size={17} />
                  <span>{paymentNotice}</span>
                </div>
              )}

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
              ) : result.status === "deleted" ? (
                <div className="failed-state deleted-state">
                  <Trash2 size={24} />
                  <strong>Deleted.</strong>
                  <p>{result.message || "This conversion and its stored files were deleted."}</p>
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
                      {(sourceCountdown || resultCountdown) && (
                        <div className="retention-countdown" aria-label="File retention countdown">
                          {sourceCountdown && (
                            <span>
                              Source <strong>{sourceCountdown}</strong>
                            </span>
                          )}
                          {resultCountdown && (
                            <span>
                              Result <strong>{resultCountdown}</strong>
                            </span>
                          )}
                        </div>
                      )}
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
                        {result.status === "complete" && result.validationReportAvailable && (
                          <button className="secondary-button" onClick={downloadValidationReport} type="button">
                            Validation report
                            <FileText size={16} />
                          </button>
                        )}
                        {canReviewRows && (
                          <button className="secondary-button" onClick={loadReviewRows} disabled={reviewRowsLoading} type="button">
                            {reviewRowsLoading ? "Loading rows..." : reviewRowsOpen ? "Hide rows" : "Review rows"}
                            {reviewRowsLoading ? <LoaderCircle className="spin" size={16} /> : <FileSpreadsheet size={16} />}
                          </button>
                        )}
                        {canDeleteServerJob && (
                          <button className="secondary-button danger-button" onClick={handleDeleteJob} disabled={deletingJob} type="button">
                            {deletingJob ? "Deleting..." : "Delete now"}
                            {deletingJob ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {reviewRowsOpen && (
                    <div className="row-review-panel" aria-label="Editable exported rows">
                      <div className="row-review-heading">
                        <div>
                          <strong>Review rows</strong>
                          <span>{reviewMessage || "Changes save to the file you download."}</span>
                        </div>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={saveReviewRows}
                          disabled={reviewRowsSaving || reviewRowsLoading || reviewRowsTruncated || !reviewRows.length}
                        >
                          {reviewRowsSaving ? "Saving..." : "Save edits"}
                          {reviewRowsSaving ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
                        </button>
                      </div>
                      {reviewRowsLoading ? (
                        <div className="row-review-empty">Loading exported rows...</div>
                      ) : (
                        <div className="row-review-table">
                          <table>
                            <thead>
                              <tr>
                                {reviewColumns.map((column) => (
                                  <th key={column.key}>{column.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {reviewRows.map((row, rowIndex) => (
                                <tr key={`review-row-${rowIndex}`}>
                                  {reviewColumns.map((column) => (
                                    <td key={column.key}>
                                      <input
                                        value={row[column.key] ?? ""}
                                        onChange={(event) => updateReviewCell(rowIndex, column.key, event.target.value)}
                                        aria-label={`${column.label} row ${rowIndex + 1}`}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
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
        </div>

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
        <div className="section-marker" aria-hidden="true">
          <span>[ 02 / 04 ]</span>
          <strong>WORKFLOW</strong>
        </div>
        <div className="section-heading">
          <h2>Built for files you would not put in a shared inbox.</h2>
          <p>
            Direct upload, real preview, paid export, short retention. No inbox
            forwarding. No manual review line. No mystery handoff.
          </p>
        </div>
        <div className="queue-list">
          <article className="queue-item">
            <span className="queue-number">01</span>
            <div>
              <h3>Upload directly</h3>
              <p>Your file goes into private storage for preview and download, not a public link or shared mailbox.</p>
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
        <div className="section-marker" aria-hidden="true">
          <span>[ 03 / 04 ]</span>
          <strong>PRICING</strong>
        </div>
        <div className="section-heading compact">
          <h2>Pay after the preview, not before the guess.</h2>
          <p>One-time packs. No subscription trap for a file you only need converted once.</p>
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
        <div className="section-marker inverted" aria-hidden="true">
          <span>[ 04 / 04 ]</span>
          <strong>SECURITY</strong>
        </div>
        <div>
          <h2>Private conversion, without the vague trust theater.</h2>
          <p>
            Source files are private, never accepted by email, and removed after failed
            extraction, completed redo, or the 24-hour lifecycle.
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
          <a href="/privacy/">Privacy</a>
          <a href="/formats/">Formats</a>
          <a href="/about/">About</a>
          <a href="/terms/">Terms</a>
          <a href="/refund/">Refunds</a>
          <a href="/security/">Security</a>
          <a href="/trust/">Trust center</a>
          <a href="/data-retention/">Data retention</a>
          <a href="/support/">Support</a>
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
