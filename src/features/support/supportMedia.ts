/**
 * Normalizes backend support attachment URLs to relative `/api/support/images/...`
 * paths so HTTPS reverse proxies (e.g. Vercel) never fail due to HTTP Mixed Content.
 */
export function resolveSupportAttachmentUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const marker = '/api/support/images/';
  const markerIdx = trimmed.indexOf(marker);
  if (markerIdx !== -1) {
    return trimmed.slice(markerIdx);
  }

  return trimmed;
}
