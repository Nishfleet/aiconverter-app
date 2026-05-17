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
  ShieldCheck,
  Upload,
  Wand2
} from "lucide-react";
import data from "./data/converters.json";
import { convertImageInBrowser, convertRasterToSvgInBrowser } from "./local-converters.js";
import "./styles.css";

const MAX_SIZE_MB = 50;
const MAX_PAGES = 500;
const CORE_POPULAR_CONVERSIONS = [
  "Bank statement PDF to CSV",
  "Receipt image to expense CSV",
  "Invoice PDF to JSON",
  "Screenshot table to CSV",
  "JPG to PNG",
  "PNG to JPG",
  "WEBP to PNG",
  "Audio to transcript",
  "Document to Markdown"
];

const PROVIDER_POPULAR_CONVERSIONS = [
  "PDF to Word",
  "Word to PDF",
  "PDF to JPG",
  "HEIC to JPG",
  "SVG to PNG",
  "MP4 to MP3",
  "MOV to MP4",
  "GIF to MP4",
  "WAV to MP3",
  "XLSX to CSV",
  "CSV to XLSX",
  "Docs, images, audio, video, archives",
  "Many more formats available"
];

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

function planById(planId) {
  return data.pricing.find((plan) => plan.id === planId) || null;
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

function fileKindLabel(candidate) {
  if (!candidate) return "No file selected";
  const extension = fileExtension(candidate);
  return `${extension} · ${(candidate.size / 1024 / 1024).toFixed(1)} MB`;
}

function fileExtension(candidate) {
  if (!candidate) return "FILE";
  return candidate.name.split(".").pop()?.toUpperCase() || "FILE";
}

function normalizedFormatId(candidate) {
  const extension = fileExtension(candidate).toLowerCase();
  const aliases = {
    jpeg: "jpg",
    htm: "html"
  };
  return aliases[extension] || extension;
}

function fileFamily(candidate) {
  if (!candidate) return "file";
  const extension = fileExtension(candidate).toLowerCase();
  const type = String(candidate.type || "").toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff", "heic", "heif", "svg"].includes(extension) || type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (["mp4", "mov", "avi", "mkv", "wmv", "webm"].includes(extension)) return "video";
  if (["mp3", "wav", "m4a", "aac", "ogg", "flac"].includes(extension)) return "audio";
  if (["zip", "7z", "tar", "gz", "rar"].includes(extension)) return "archive";
  if (["xls", "xlsx", "xlsm", "csv", "ods", "numbers"].includes(extension)) return "spreadsheet";
  if (["ppt", "pptx", "odp"].includes(extension)) return "presentation";
  if (["pdf", "doc", "docx", "rtf", "txt", "md", "html", "htm", "odt"].includes(extension)) return "document";
  return "file";
}

function universalOutputCapabilityIds(candidate) {
  const extension = fileExtension(candidate).toLowerCase();
  const type = String(candidate?.type || "").toLowerCase();

  const groups = {
    text: ["txt", "md", "html", "pdf", "docx"],
    pdf: ["pdf", "docx", "txt", "html", "md", "png", "jpg"],
    word: ["docx", "pdf", "txt", "html", "md"],
    spreadsheet: ["xlsx", "csv", "pdf", "html"],
    presentation: ["pptx", "pdf", "png", "jpg"],
    image: ["png", "jpg", "webp", "gif", "svg", "pdf"],
    svg: ["svg", "png", "jpg", "webp", "pdf"],
    audio: ["mp3", "wav", "m4a", "ogg", "flac"],
    video: ["mp4", "webm", "mov", "gif"],
    archive: ["zip", "7z", "tar"]
  };

  if (["txt", "md", "html", "htm", "rtf"].includes(extension) || ["text/plain", "text/markdown", "text/html"].includes(type)) return groups.text;
  if (extension === "pdf" || type === "application/pdf") return groups.pdf;
  if (["doc", "docx", "odt"].includes(extension)) return groups.word;
  if (["csv", "xls", "xlsx", "xlsm", "xlsb", "ods", "numbers"].includes(extension)) return groups.spreadsheet;
  if (["ppt", "pptx", "odp"].includes(extension)) return groups.presentation;
  if (extension === "svg" || type === "image/svg+xml") return groups.svg;
  if (fileFamily(candidate) === "image") return groups.image;
  if (fileFamily(candidate) === "audio") return groups.audio;
  if (fileFamily(candidate) === "video") return groups.video;
  if (fileFamily(candidate) === "archive") return groups.archive;
  return groups.text;
}

function capableOutputFormats(converter, candidate) {
  const formats = converter?.outputFormats || [];
  if (!candidate) return formats;
  const inputFormat = normalizedFormatId(candidate);
  if (converter?.id === "image-format") return formats.filter((format) => format.id !== inputFormat);
  if (converter?.id !== "universal-file") return formats;
  const capableIds = universalOutputCapabilityIds(candidate);
  return formats.filter((format) => capableIds.includes(format.id) && format.id !== inputFormat);
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
  return pricingPreview?.prices?.[planId]?.display || planById(planId)?.price || plan?.price || "$3";
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
  const fileInputRef = useRef(null);
  const turnstileRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

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
  const popularConversions = useMemo(
    () => (universalProviderReady ? [...CORE_POPULAR_CONVERSIONS, ...PROVIDER_POPULAR_CONVERSIONS] : CORE_POPULAR_CONVERSIONS),
    [universalProviderReady]
  );
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

  return (
    <main className="page-shell">
      <header className="site-header" aria-label="Site header">
        <a className="brand" href="/" aria-label="AI Converter home">
          <span className="brand-mark">
            <Wand2 size={18} strokeWidth={2.4} />
          </span>
          <span>AI Converter</span>
        </a>
      </header>

      <section id="top" className="conversion-stage">
        <div className="conversion-heading">
          <h1>What would you like to convert?</h1>
          <p>Drop a file and AI Converter will suggest the cleanest outputs.</p>
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
                              )}
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
                    <p>{selectedRouteDescription(selected, file)}</p>
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
                      <span>{isLocalImageConverter ? "Cost" : "All-in total"}</span>
                      <strong>
                        {isLocalImageConverter ? "Free · browser local" : `${selectedPlanPrice} · ${selectedPlan.detail}`}
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
                    <p>This conversion happened in your browser. The image was not uploaded to AI Converter.</p>
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
          <span className="popular-conversions-label">Popular requests</span>
          <div className="conversion-ticker" aria-hidden="true">
            <div className="conversion-ticker-track">
              {[0, 1].map((copyIndex) => (
                <div className={classNames("ticker-group", copyIndex === 1 && "is-duplicate")} key={copyIndex}>
                  {popularConversions.map((item) => (
                    <span className={classNames("ticker-chip", item.startsWith("Many more") && "is-more")} key={`${copyIndex}-${item}`}>
                      {item}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <ul className="sr-only">
            {popularConversions.map((item) => (
              <li key={item}>{item}</li>
            ))}
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
          <strong>AI Converter</strong>
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
