const escapeRegexp = [
  [/&/g, "&amp;"],
  [/</g, "&lt;"],
  [/>/g, "&gt;"],
  [/"/g, "&quot;"],
  [/'/g, "&#39;"],
] as const;

// エスケープ処理
export function escape(s?: string | null): string {
  if (!s || s.length <= 0) return "";
  for (const [searchValue, replaceValue] of escapeRegexp) {
    s = s.replace(searchValue, replaceValue);
  }
  return s;
}
