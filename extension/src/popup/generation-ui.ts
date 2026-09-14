import { structureReview, type GeneratedReview } from '../api/review-api.js';
import type { ReviewDraft } from '../shared/review-draft.js';
import type { ReviewStorage } from '../storage/review-storage.js';

type GenerationOptions = {
  storage: ReviewStorage;
  getCurrentDraftId: () => string | undefined;
  onDraftSaved: () => Promise<void>;
  statusMessage: HTMLElement;
};

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Element de generation introuvable : ${selector}`);
  return element;
}

export function initializeGeneration(options: GenerationOptions) {
  const button = required<HTMLButtonElement>('#structure-button');
  const result = required<HTMLElement>('#generated-result');
  const mode = required<HTMLElement>('#generation-mode');
  const summary = required<HTMLElement>('#generated-summary');
  const checklist = required<HTMLUListElement>('#generated-checklist');

  function show(generated?: GeneratedReview | ReviewDraft['generated']): void {
    if (!generated) {
      result.hidden = true;
      return;
    }
    mode.textContent = generated.mode;
    summary.textContent = generated.summary;
    checklist.replaceChildren();
    for (const entry of generated.checklist) {
      const item = document.createElement('li');
      item.textContent = entry;
      checklist.append(item);
    }
    result.hidden = false;
  }

  button.addEventListener('click', async () => {
    const draftId = options.getCurrentDraftId();
    if (!draftId) {
      options.statusMessage.textContent = 'Sauvegardez la fiche avant de la structurer.';
      return;
    }
    button.disabled = true;
    options.statusMessage.textContent = 'Structuration en cours...';
    try {
      const draft = await options.storage.get(draftId);
      if (!draft) throw new Error('Fiche locale introuvable.');
      const generated = await structureReview(draft);
      // Le resultat est attache au brouillon existant ; la source et les corrections sont conservees.
      await options.storage.save({ ...draft, generated, updatedAt: new Date().toISOString() });
      show(generated);
      await options.onDraftSaved();
      options.statusMessage.textContent = `Fiche structuree avec succes en mode ${generated.mode}.`;
    } catch (error: unknown) {
      console.error('Echec de la structuration ReviewFlow', error);
      options.statusMessage.textContent = 'API indisponible. Votre brouillon local est conserve.';
    } finally {
      button.disabled = false;
    }
  });

  return {
    enable: () => {
      button.disabled = false;
    },
    reset: () => {
      button.disabled = true;
      result.hidden = true;
    },
    show,
  };
}
