const replacements: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function sanitizeText(input: string): string {
  if (!input) {
    return '';
  }

  return input.replace(/[&<>"']/g, (match) => replacements[match]).trim();
}

export function sanitizeRichContent(input: string): string {
  if (!input) {
    return '';
  }

  const withoutScripts = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  return sanitizeText(withoutScripts);
}
