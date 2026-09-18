let totalUsedBytes = 2576980377; // 2.4 GB baseline

export function trackStorageUsage(bytes) {
  if (typeof bytes === 'number' && !isNaN(bytes)) {
    totalUsedBytes += bytes;
  }
}

export function getStorageStats(req, res) {
  const maxQuota = 100 * 1024 * 1024 * 1024; // 100 GB
  const percentage = Math.min(100, Math.round((totalUsedBytes / maxQuota) * 1000) / 10);

  res.json({
    usedBytes: totalUsedBytes,
    maxBytes: maxQuota,
    formattedUsed: (totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB',
    formattedMax: '100 GB',
    usagePercentage: percentage,
    totalFilesManaged: 142,
    activeEncryptions: 8
  });
}
