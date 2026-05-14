/**
 * 3-strategy AI JSON parser. Returns { parsed, raw }.
 * 1) ```json``` fenced block
 * 2) first balanced { ... } block (string-aware)
 * 3) full string
 */
export function parseAIJson(text) {
  if (text == null) return { parsed: null, raw: text };
  const raw = String(text);

  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try { return { parsed: JSON.parse(fenceMatch[1].trim()), raw }; } catch (_) {}
  }

  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = raw.substring(start, i + 1);
        try { return { parsed: JSON.parse(candidate), raw }; } catch (_) { start = -1; }
      }
    }
  }

  try { return { parsed: JSON.parse(raw), raw }; } catch (_) { return { parsed: null, raw }; }
}

export default parseAIJson;
