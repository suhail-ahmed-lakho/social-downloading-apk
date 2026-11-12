export interface SpeedSample {
  timestamp: number;
  bytes: number;
}

export interface DownloadTelemetry {
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  remainingBytes: number;
  downloadedMB: string;
  totalMB: string;
  remainingMB: string;
  speedBps: number;
  speedText: string;
  etaSeconds: number | null;
  etaText: string;
  statusText?: string;
  isEstimated?: boolean;
}

const MB_IN_BYTES = 1024 * 1024;
const KB_IN_BYTES = 1024;
const SPEED_WINDOW_MS = 3500;

/** Format a byte count into megabytes (e.g. "12.4 MB"). */
export function formatBytesToMB(bytes: number): string {
  const safeBytes = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  const mb = safeBytes / MB_IN_BYTES;
  if (mb >= 100) return `${mb.toFixed(0)} MB`;
  if (mb >= 10) return `${mb.toFixed(1)} MB`;
  return `${mb.toFixed(2)} MB`;
}

/** Format raw bytes/sec speed cleanly as MB/s, KB/s, or B/s. */
export function formatSpeed(bytesPerSecond: number): string {
  const safeBps = Number.isFinite(bytesPerSecond) && bytesPerSecond > 0 ? bytesPerSecond : 0;
  if (safeBps >= MB_IN_BYTES) {
    const mbps = safeBps / MB_IN_BYTES;
    return `${mbps >= 10 ? mbps.toFixed(1) : mbps.toFixed(2)} MB/s`;
  }
  if (safeBps >= KB_IN_BYTES) {
    return `${Math.round(safeBps / KB_IN_BYTES)} KB/s`;
  }
  if (safeBps > 0) {
    return `${Math.round(safeBps)} B/s`;
  }
  return '0 KB/s';
}

/** Format estimated remaining seconds into human-readable text. */
export function formatEta(etaSeconds: number | null): string {
  if (etaSeconds === null || !Number.isFinite(etaSeconds) || etaSeconds < 0) {
    return '--';
  }
  if (etaSeconds < 1) {
    return '<1s';
  }
  const rounded = Math.ceil(etaSeconds);
  if (rounded < 60) {
    return `${rounded}s left`;
  }
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s left` : `${mins}m left`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m left`;
}

/** Prune rolling window samples and append the newest observation if bytes increased or interval passed. */
export function recordSpeedSample(
  existingSamples: SpeedSample[],
  bytesDownloaded: number,
  now: number = Date.now()
): SpeedSample[] {
  const safeBytes = Math.max(0, bytesDownloaded);
  const cutoff = now - SPEED_WINDOW_MS;
  const recent = existingSamples.filter((s) => s.timestamp >= cutoff);

  // Always retain the earliest point just before window cutoff if list would become single-point
  if (recent.length === 0 && existingSamples.length > 0) {
    const last = existingSamples[existingSamples.length - 1];
    recent.push(last);
  }

  const lastSample = recent[recent.length - 1];
  if (!lastSample || now - lastSample.timestamp >= 120 || safeBytes !== lastSample.bytes) {
    recent.push({ timestamp: now, bytes: safeBytes });
  }
  return recent;
}

/** Compute instantaneous rolling-window bytes/sec download rate. */
export function calculateSpeedBps(samples: SpeedSample[]): number {
  if (!samples || samples.length < 2) {
    return 0;
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const deltaMs = last.timestamp - first.timestamp;
  const deltaBytes = last.bytes - first.bytes;

  if (deltaMs <= 50 || deltaBytes <= 0) {
    return 0;
  }

  return (deltaBytes / deltaMs) * 1000;
}

/** Compute complete live download telemetry for UI and notifications. */
export function computeDownloadTelemetry(params: {
  writtenBytes: number;
  totalBytes: number;
  estimatedTotalBytes?: number;
  samples: SpeedSample[];
  overridePercent?: number;
  statusText?: string;
}): DownloadTelemetry {
  const { writtenBytes, totalBytes, estimatedTotalBytes, samples, overridePercent, statusText } = params;
  const safeWritten = Math.max(0, Number.isFinite(writtenBytes) ? writtenBytes : 0);
  const safeServerTotal = Math.max(0, Number.isFinite(totalBytes) ? totalBytes : 0);
  const safeEstimated =
    typeof estimatedTotalBytes === 'number' && Number.isFinite(estimatedTotalBytes) && estimatedTotalBytes > 0
      ? estimatedTotalBytes
      : 0;

  const isEstimated = safeServerTotal <= 0 && safeEstimated > 0 && overridePercent !== 100;
  // When using an estimate and actual bytes approach/exceed it while still streaming,
  // smoothly expand the baseline so progress stays <= 98% instead of freezing at 100%.
  const resolvedTotal =
    safeServerTotal > 0
      ? safeServerTotal
      : isEstimated
        ? safeWritten >= safeEstimated * 0.92
          ? Math.round(safeWritten * 1.12)
          : safeEstimated
        : 0;

  const effectiveWritten = safeServerTotal > 0 ? Math.min(safeWritten, safeServerTotal) : safeWritten;
  const remainingBytes = resolvedTotal > 0 ? Math.max(0, resolvedTotal - effectiveWritten) : 0;

  let percent = 0;
  if (typeof overridePercent === 'number' && Number.isFinite(overridePercent)) {
    percent = Math.max(0, Math.min(100, Math.round(overridePercent)));
  } else if (resolvedTotal > 0) {
    const rawPct = Math.round((effectiveWritten / resolvedTotal) * 100);
    percent = isEstimated
      ? Math.max(effectiveWritten > 0 ? 1 : 0, Math.min(98, rawPct))
      : Math.max(0, Math.min(100, rawPct));
  }

  const speedBps = calculateSpeedBps(samples);
  const etaSeconds =
    speedBps > 0 && resolvedTotal > 0 && remainingBytes > 0
      ? remainingBytes / speedBps
      : remainingBytes === 0 && safeServerTotal > 0
        ? 0
        : null;

  return {
    percent,
    downloadedBytes: effectiveWritten,
    totalBytes: resolvedTotal,
    remainingBytes,
    downloadedMB: formatBytesToMB(effectiveWritten),
    totalMB: resolvedTotal > 0 ? formatBytesToMB(resolvedTotal) : '-- MB',
    remainingMB: resolvedTotal > 0 ? formatBytesToMB(remainingBytes) : '-- MB',
    speedBps,
    speedText: formatSpeed(speedBps),
    etaSeconds,
    etaText: formatEta(etaSeconds),
    statusText,
    isEstimated,
  };
}

