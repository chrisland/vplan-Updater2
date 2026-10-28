export const HISTORY_LIMIT = 10;

export function appendUpload(history, entry) {
  return [entry, ...history].slice(0, HISTORY_LIMIT);
}

// Decode the display copy without changing the original bytes sent to the server.
export function decodeHtml(bytes) {
  const initial = new TextDecoder().decode(bytes);
  const charset = initial.slice(0, 4096).match(/charset\s*=\s*["']?\s*([\w-]+)/i)?.[1];
  try {
    return new TextDecoder(charset || 'utf-8').decode(bytes);
  } catch {
    return initial;
  }
}

export function previewDocument(html) {
  // Applied before any uploaded markup; previews cannot execute scripts, submit
  // forms, navigate the app, or request external images/styles.
  return '<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; base-uri \'none\'; form-action \'none\'"><style>body{margin:16px;overflow-wrap:anywhere}</style></head><body>' + html + '</body></html>';
}
