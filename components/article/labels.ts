/** "japaneseTitle" -> "Japanese title" (kunci camelCase dari parser infobox) */
export function humanize(key: string): string {
  const words = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Param dinamis Next bisa masih ter-encode (%27, %20); jangan sampai melempar error */
export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
