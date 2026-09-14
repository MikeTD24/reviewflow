import { createReviewExport, type ExportFormat } from '../export/review-export.js';
import type { ReviewStorage } from '../storage/review-storage.js';

type ExportOptions = {
  storage: ReviewStorage;
  getCurrentDraftId: () => string | undefined;
  statusMessage: HTMLElement;
};

function download(content: string, filename: string, mimeType: string): void {
  // L URL temporaire declenche un telechargement sans demander la permission downloads.
  const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function initializeExport(options: ExportOptions): void {
  for (const format of ['json', 'markdown', 'csv'] as const) {
    const button = document.querySelector<HTMLButtonElement>(`[data-export="${format}"]`);
    if (!button) throw new Error(`Bouton export ${format} introuvable.`);
    button.addEventListener('click', async () => {
      const draftId = options.getCurrentDraftId();
      const draft = draftId ? await options.storage.get(draftId) : undefined;
      if (!draft?.generated) {
        options.statusMessage.textContent = 'Structurez la fiche avant de l exporter.';
        return;
      }
      const file = createReviewExport(draft, format satisfies ExportFormat);
      download(file.content, file.filename, file.mimeType);
      const label = format === 'json' ? 'JSON' : format === 'markdown' ? 'Markdown' : 'CSV';
      options.statusMessage.textContent = `Export ${label} telecharge.`;
    });
  }
}
