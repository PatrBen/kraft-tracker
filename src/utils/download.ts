/** Bietet einen Text als Datei zum Herunterladen an (am iPhone: Vorschau mit Teilen/Sichern). */
export function downloadTextFile(content: string, fileName: string, mimeType = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Etwas warten, sonst bricht manch ein Browser den Download ab.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
