import type { ReviewDraft } from '../shared/review-draft.js';

export type ExportFormat = 'csv' | 'json' | 'markdown';

function escapeMarkdown(value: string): string {
  // Neutralise les caracteres susceptibles de transformer le contenu utilisateur en balisage.
  return value.replace(/([\\`*_[\]<>#])/g, '\\$1');
}

function markdownList(items: string[]): string {
  return items.length > 0
    ? items.map((item) => `- ${escapeMarkdown(item)}`).join('\n')
    : '_Aucun element._';
}

export function createSafeFilename(name: string, capturedAt: string, extension: string): string {
  // Le slug ASCII reste portable entre Windows, macOS et Linux.
  const slug =
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'fiche-reviewflow';
  return `${slug}-${capturedAt.slice(0, 10)}.${extension}`;
}

export function exportReviewAsJson(draft: ReviewDraft): string {
  return JSON.stringify(draft, null, 2);
}

export function exportReviewAsMarkdown(draft: ReviewDraft): string {
  const lines = [
    `# ${escapeMarkdown(draft.product.name)}`,
    '',
    '## Source',
    '',
    `- Page : ${escapeMarkdown(draft.source.pageTitle)}`,
    `- Domaine : ${escapeMarkdown(draft.source.domain)}`,
    `- URL : <${draft.source.url}>`,
    `- Capture : ${draft.source.capturedAt}`,
    `- Derniere modification : ${draft.updatedAt}`,
    `- Mode : ${draft.generated?.mode ?? 'non genere'}`,
  ];

  if (draft.generated) {
    lines.push(
      `- Generation : ${draft.generated.generatedAt}`,
      '',
      '## Resume',
      '',
      escapeMarkdown(draft.generated.summary),
      '',
      '## Checklist',
      '',
      markdownList(draft.generated.checklist),
    );
  }

  lines.push('', '## Produit', '', `- Nom : ${escapeMarkdown(draft.product.name)}`);
  if (draft.product.category) lines.push(`- Categorie : ${escapeMarkdown(draft.product.category)}`);
  if (draft.product.price !== undefined) {
    lines.push(
      `- Prix : ${draft.product.price}${draft.product.currency ? ` ${draft.product.currency}` : ''}`,
    );
  }
  if (draft.product.description) {
    lines.push('', '### Description', '', escapeMarkdown(draft.product.description));
  }

  lines.push(
    '',
    '## Recherche editoriale',
    '',
    '### Notes',
    '',
    draft.research.notes ? escapeMarkdown(draft.research.notes) : '_Aucune note._',
    '',
    '### Points positifs',
    '',
    markdownList(draft.research.pros),
    '',
    '### Points negatifs',
    '',
    markdownList(draft.research.cons),
    '',
    '### Criteres de test',
    '',
    markdownList(draft.research.testCriteria),
    '',
    '### Tags',
    '',
    markdownList(draft.research.tags),
    '',
  );
  return lines.join('\n');
}

const csvHeaders = [
  'id',
  'nom',
  'categorie',
  'prix',
  'devise',
  'description_produit',
  'titre_page',
  'url',
  'domaine',
  'capture_le',
  'modifie_le',
  'texte_selectionne',
  'notes',
  'points_positifs',
  'points_negatifs',
  'criteres_de_test',
  'tags',
  'resume_genere',
  'checklist_generee',
  'mode_generation',
  'genere_le',
];

function escapeCsvCell(value: string | number | undefined): string {
  const normalized = String(value ?? '').replace(/\r\n|\r|\n/g, '\r\n');
  // Le point-virgule, les guillemets et les retours ligne imposent une cellule quotee en CSV.
  return /[;"\r\n]/.test(normalized) ? `"${normalized.replace(/"/g, '""')}"` : normalized;
}

export function exportReviewAsCsv(draft: ReviewDraft): string {
  const generated = draft.generated;
  const row = [
    draft.id,
    draft.product.name,
    draft.product.category,
    draft.product.price,
    draft.product.currency,
    draft.product.description,
    draft.source.pageTitle,
    draft.source.url,
    draft.source.domain,
    draft.source.capturedAt,
    draft.updatedAt,
    draft.source.selectedText,
    draft.research.notes,
    draft.research.pros.join(' | '),
    draft.research.cons.join(' | '),
    draft.research.testCriteria.join(' | '),
    draft.research.tags.join(' | '),
    generated?.summary,
    generated?.checklist.join(' | '),
    generated?.mode,
    generated?.generatedAt,
  ];
  // Le BOM UTF-8 permet a Excel de reconnaitre correctement les accents des champs editoriaux.
  return `\uFEFF${csvHeaders.join(';')}\r\n${row.map(escapeCsvCell).join(';')}\r\n`;
}

export function createReviewExport(draft: ReviewDraft, format: ExportFormat) {
  const isJson = format === 'json';
  const isCsv = format === 'csv';
  return {
    content: isJson
      ? exportReviewAsJson(draft)
      : isCsv
        ? exportReviewAsCsv(draft)
        : exportReviewAsMarkdown(draft),
    filename: createSafeFilename(
      draft.product.name,
      draft.source.capturedAt,
      isJson ? 'json' : isCsv ? 'csv' : 'md',
    ),
    mimeType: isJson ? 'application/json' : isCsv ? 'text/csv' : 'text/markdown',
  };
}
