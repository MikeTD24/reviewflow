import { initializeExport } from './export-ui.js';
import { initializeGeneration } from './generation-ui.js';
import {
  createPageCapture,
  readPageSnapshot,
  type PageCapture,
} from '../extraction/page-extractor.js';
import {
  createReviewFormInput,
  validateReviewForm,
  type EditableReview,
  type ReviewFormErrors,
  type ReviewFormInput,
} from '../shared/review-form.js';
import type { ReviewDraft } from '../shared/review-draft.js';
import { ReviewStorage } from '../storage/review-storage.js';
function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error('Element du popup introuvable : ' + selector);
  return element;
}
const captureButton = required<HTMLButtonElement>('#capture-button'),
  statusMessage = required<HTMLParagraphElement>('#status-message'),
  emptyState = required<HTMLElement>('#empty-state'),
  captureResult = required<HTMLElement>('#capture-result'),
  pageTitle = required<HTMLElement>('#page-title'),
  pageUrl = required<HTMLAnchorElement>('#page-url'),
  pageDomain = required<HTMLElement>('#page-domain'),
  pageDescription = required<HTMLElement>('#page-description'),
  selectedText = required<HTMLElement>('#selected-text'),
  reviewForm = required<HTMLFormElement>('#review-form'),
  draftList = required<HTMLUListElement>('#draft-list'),
  noDrafts = required<HTMLElement>('#no-drafts'),
  draftCount = required<HTMLElement>('#draft-count');
const fields = {
  name: required<HTMLInputElement>('#product-name'),
  description: required<HTMLTextAreaElement>('#product-description'),
  category: required<HTMLInputElement>('#product-category'),
  price: required<HTMLInputElement>('#product-price'),
  currency: required<HTMLInputElement>('#product-currency'),
  notes: required<HTMLTextAreaElement>('#research-notes'),
  pros: required<HTMLTextAreaElement>('#research-pros'),
  cons: required<HTMLTextAreaElement>('#research-cons'),
  testCriteria: required<HTMLTextAreaElement>('#research-criteria'),
  tags: required<HTMLTextAreaElement>('#research-tags'),
} satisfies Record<keyof ReviewFormInput, HTMLInputElement | HTMLTextAreaElement>;
const errorElements = {
  name: required<HTMLElement>('#product-name-error'),
  price: required<HTMLElement>('#product-price-error'),
  currency: required<HTMLElement>('#product-currency-error'),
};
const storage = new ReviewStorage(chrome.storage.local);
// Ces references relient la capture affichee au brouillon sauvegarde sans variable globale persistante.
let currentCapture: PageCapture | undefined,
  currentDraftId: string | undefined,
  currentCapturedAt: string | undefined;
function setFormInput(input: ReviewFormInput): void {
  for (const key of Object.keys(fields) as (keyof ReviewFormInput)[])
    fields[key].value = input[key];
}
function readFormInput(): ReviewFormInput {
  return Object.fromEntries(
    (Object.keys(fields) as (keyof ReviewFormInput)[]).map((key) => [key, fields[key].value]),
  ) as ReviewFormInput;
}
function fromReview(review: EditableReview): ReviewFormInput {
  return {
    name: review.product.name,
    description: review.product.description ?? '',
    category: review.product.category ?? '',
    price: review.product.price?.toString() ?? '',
    currency: review.product.currency ?? '',
    notes: review.research.notes,
    pros: review.research.pros.join('\n'),
    cons: review.research.cons.join('\n'),
    testCriteria: review.research.testCriteria.join('\n'),
    tags: review.research.tags.join('\n'),
  };
}
function showErrors(errors: ReviewFormErrors): void {
  for (const key of Object.keys(errorElements) as (keyof typeof errorElements)[]) {
    const message = errors[key] ?? '';
    errorElements[key].textContent = message;
    fields[key].setAttribute('aria-invalid', String(Boolean(message)));
    fields[key].setAttribute('aria-describedby', errorElements[key].id);
  }
}
function showSource(capture: PageCapture): void {
  pageTitle.textContent = capture.pageTitle;
  pageUrl.textContent = capture.url;
  pageUrl.href = capture.url;
  pageDomain.textContent = capture.domain;
  pageDescription.textContent = capture.description ?? 'Non disponible';
  selectedText.textContent = capture.selectedText ?? 'Aucun texte selectionne';
  emptyState.hidden = true;
  captureResult.hidden = false;
}
// Une nouvelle capture repart d une fiche neuve, contrairement au chargement d un brouillon.
function showCapture(capture: PageCapture): void {
  currentCapture = capture;
  currentDraftId = undefined;
  currentCapturedAt = new Date().toISOString();
  showSource(capture);
  setFormInput(createReviewFormInput(capture));
  showErrors({});
  generation.reset();
}
function showDraft(draft: ReviewDraft): void {
  currentDraftId = draft.id;
  currentCapturedAt = draft.source.capturedAt;
  currentCapture = {
    pageTitle: draft.source.pageTitle,
    url: draft.source.url,
    domain: draft.source.domain,
    ...(draft.source.description ? { description: draft.source.description } : {}),
    ...(draft.source.selectedText ? { selectedText: draft.source.selectedText } : {}),
    product: draft.product,
  };
  showSource(currentCapture);
  setFormInput(fromReview(draft));
  showErrors({});
  generation.show(draft.generated);
  generation.enable();
  statusMessage.textContent = 'Fiche chargee.';
}
async function renderDrafts(): Promise<void> {
  const drafts = await storage.list();
  draftList.replaceChildren();
  noDrafts.hidden = drafts.length > 0;
  draftCount.textContent = drafts.length ? String(drafts.length) : '';
  for (const draft of drafts) {
    const item = document.createElement('li'),
      open = document.createElement('button'),
      remove = document.createElement('button');
    open.type = 'button';
    open.className = 'draft-open';
    open.textContent = draft.product.name;
    open.addEventListener('click', () => showDraft(draft));
    remove.type = 'button';
    remove.className = 'draft-delete';
    remove.textContent = 'Supprimer';
    remove.setAttribute('aria-label', 'Supprimer ' + draft.product.name);
    remove.addEventListener('click', async () => {
      if (!window.confirm('Supprimer cette fiche ?')) return;
      await storage.delete(draft.id);
      if (currentDraftId === draft.id) {
        currentDraftId = undefined;
        generation.reset();
      }
      await renderDrafts();
      statusMessage.textContent = 'Fiche supprimee.';
    });
    item.append(open, remove);
    draftList.append(item);
  }
}
reviewForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = readFormInput(),
    result = validateReviewForm(input);
  showErrors(result.errors);
  if (!result.success) {
    statusMessage.textContent = 'Corrigez les champs signales avant de continuer.';
    const first = (Object.keys(result.errors) as (keyof ReviewFormInput)[])[0];
    if (first) fields[first].focus();
    return;
  }
  if (!currentCapture) {
    statusMessage.textContent = 'Capturez une page avant de sauvegarder.';
    return;
  }
  const now = new Date().toISOString(),
    // L identifiant reste stable lors d une modification ; capturedAt conserve la date initiale.
    draft: ReviewDraft = {
      id: currentDraftId ?? crypto.randomUUID(),
      source: {
        url: currentCapture.url,
        domain: currentCapture.domain,
        pageTitle: currentCapture.pageTitle,
        ...(currentCapture.description ? { description: currentCapture.description } : {}),
        ...(currentCapture.selectedText ? { selectedText: currentCapture.selectedText } : {}),
        capturedAt: currentCapturedAt ?? now,
      },
      product: result.value.product,
      research: result.value.research,
      updatedAt: now,
    };
  try {
    await storage.save(draft);
    currentDraftId = draft.id;
    currentCapturedAt = draft.source.capturedAt;
    generation.enable();
    setFormInput(fromReview(draft));
    await renderDrafts();
    statusMessage.textContent = 'Fiche sauvegardee localement.';
  } catch (error: unknown) {
    console.error('Echec du stockage ReviewFlow', error);
    statusMessage.textContent = 'Impossible de sauvegarder la fiche.';
  }
});
captureButton.addEventListener('click', async () => {
  captureButton.disabled = true;
  statusMessage.textContent = 'Capture en cours...';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id === undefined) throw new Error('Aucune page active accessible.');
    // activeTab autorise cette injection uniquement apres le clic explicite de l utilisateur.
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: readPageSnapshot,
    });
    if (!result?.result) throw new Error("La page n'a retourne aucune information.");
    showCapture(createPageCapture(result.result));
    statusMessage.textContent = 'Page capturee avec succes.';
  } catch (error: unknown) {
    console.error('Echec de la capture ReviewFlow', error);
    statusMessage.textContent =
      'Impossible de capturer cette page. Essayez depuis une page web classique.';
  } finally {
    captureButton.disabled = false;
  }
});
initializeExport({ storage, getCurrentDraftId: () => currentDraftId, statusMessage });

const generation = initializeGeneration({
  storage,
  getCurrentDraftId: () => currentDraftId,
  onDraftSaved: renderDrafts,
  statusMessage,
});

renderDrafts().catch((error: unknown) => {
  console.error('Echec de lecture ReviewFlow', error);
  statusMessage.textContent = 'Impossible de lire les fiches sauvegardees.';
});
