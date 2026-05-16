import { convertFileToCsv } from "./extract.js";
import { outputFormatFromResultKey, updateJob } from "./jobs.js";
import { requestDodoRefund } from "./dodo.js";

export async function runFullConversion(env, job, options = {}) {
  if (!job?.source_key || !job?.result_key) {
    throw new Error("The original file is no longer available.");
  }

  const source = await env.AICONVERTER_BUCKET.get(job.source_key);
  if (!source) throw new Error("The original file has expired. Upload it again.");

  await updateJob(env, job.id, {
    status: "converting_full",
    full_started_at: new Date().toISOString()
  });

  try {
    const arrayBuffer = await source.arrayBuffer();
    const converted = await convertFileToCsv(
      env,
      job.converter_id || "bank",
      job.original_file_name || "statement.pdf",
      job.input_mime_type || "application/pdf",
      arrayBuffer,
      {
        estimatedPages: job.estimated_pages || 25,
        outputFormat: outputFormatFromResultKey(job.result_key),
        allowPaidFallback: true,
        ...(options.convertOptions || {})
      }
    );

    if (!converted.ok) {
      await env.AICONVERTER_BUCKET.delete(job.source_key).catch(() => {});
      const refund = job.paid_at
        ? await requestDodoRefund(env, job, converted.message, { cashRefund: options.cashRefund !== false })
        : { status: "", refundId: "" };
      await updateJob(env, job.id, {
        status: "failed",
        error: converted.message,
        confidence: converted.confidence || 0,
        row_count: converted.rowCount || 0,
        source_deleted_at: new Date().toISOString(),
        extractor: converted.provider || "",
        refund_status: refund.status || job.refund_status || "",
        refund_id: refund.refundId || job.refund_id || ""
      });
      return {
        ok: false,
        message: converted.message,
        confidence: converted.confidence || 0,
        rowCount: converted.rowCount || 0,
        refundStatus: refund.status || ""
      };
    }

    await env.AICONVERTER_BUCKET.put(job.result_key, converted.content || converted.csv, {
      httpMetadata: { contentType: converted.contentType || "text/csv; charset=utf-8" },
      customMetadata: {
        jobId: job.id,
        purpose: `result-${converted.fileExtension || "csv"}`,
        deleteAfter: job.expires_at
      }
    });

    const sourceDeletedAt = options.deleteSource ? new Date().toISOString() : "";
    if (options.deleteSource) await env.AICONVERTER_BUCKET.delete(job.source_key).catch(() => {});
    await updateJob(env, job.id, {
      status: "complete",
      confidence: converted.confidence,
      row_count: converted.rowCount,
      ...(sourceDeletedAt ? { source_deleted_at: sourceDeletedAt } : {}),
      completed_at: new Date().toISOString(),
      extractor: converted.provider || ""
    });

    return {
      ok: true,
      previewRows: converted.previewRows,
      columns: converted.columns || [],
      confidence: converted.confidence,
      rowCount: converted.rowCount,
      outputFormat: converted.outputFormat || outputFormatFromResultKey(job.result_key)
    };
  } catch (error) {
    const message = error?.message || "The full converted file could not be generated.";
    if (job.paid_at) {
      await env.AICONVERTER_BUCKET.delete(job.source_key).catch(() => {});
      const refund = await requestDodoRefund(env, job, message, { cashRefund: options.cashRefund !== false });
      await updateJob(env, job.id, {
        status: "failed",
        error: message,
        confidence: 0,
        row_count: 0,
        source_deleted_at: new Date().toISOString(),
        refund_status: refund.status || job.refund_status || "refund_due",
        refund_id: refund.refundId || job.refund_id || ""
      });
      return {
        ok: false,
        message,
        confidence: 0,
        rowCount: 0,
        refundStatus: refund.status || "refund_due"
      };
    }

    await updateJob(env, job.id, {
      status: "preview_ready",
      error: message
    });
    throw error;
  }
}
