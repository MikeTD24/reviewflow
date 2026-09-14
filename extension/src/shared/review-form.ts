import type { PageCapture } from '../extraction/page-extractor.js';

export type ReviewFormInput = {
  name: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  notes: string;
  pros: string;
  cons: string;
  testCriteria: string;
  tags: string;
};

export type EditableReview = {
  product: {
    name: string;
    description?: string;
    category?: string;
    price?: number;
    currency?: string;
  };
  research: {
    notes: string;
    pros: string[];
    cons: string[];
    testCriteria: string[];
    tags: string[];
  };
};

export type ReviewFormErrors = Partial<Record<keyof ReviewFormInput, string>>;

export type ReviewFormResult =
  | { success: true; value: EditableReview; errors: ReviewFormErrors }
  | { success: false; errors: ReviewFormErrors };

function optionalText(value: string): string | undefined {
  const normalized = value.trim();
  return normalized || undefined;
}

// Les listes du formulaire utilisent une ligne par element pour rester simples a editer.
function parseList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createReviewFormInput(capture: PageCapture): ReviewFormInput {
  return {
    name: capture.product.name,
    description: capture.product.description ?? '',
    category: '',
    price: capture.product.price?.toString() ?? '',
    currency: capture.product.currency ?? '',
    notes: '',
    pros: '',
    cons: '',
    testCriteria: '',
    tags: '',
  };
}

export function validateReviewForm(input: ReviewFormInput): ReviewFormResult {
  const errors: ReviewFormErrors = {};
  const name = input.name.trim();
  // Le formulaire accepte la virgule francaise, puis stocke toujours un nombre JavaScript.
  const priceText = input.price.trim().replace(',', '.');
  const price = priceText ? Number(priceText) : undefined;
  const currency = input.currency.trim().toUpperCase();

  if (!name) errors.name = 'Le nom du produit est obligatoire.';
  if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
    errors.price = 'Saisissez un prix positif ou laissez ce champ vide.';
  }
  if (currency && !/^[A-Z]{3}$/.test(currency)) {
    errors.currency = 'Utilisez un code devise de trois lettres, par exemple EUR.';
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  const description = optionalText(input.description);
  const category = optionalText(input.category);

  return {
    success: true,
    errors,
    value: {
      product: {
        name,
        ...(description ? { description } : {}),
        ...(category ? { category } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(currency ? { currency } : {}),
      },
      research: {
        notes: input.notes.trim(),
        pros: parseList(input.pros),
        cons: parseList(input.cons),
        testCriteria: parseList(input.testCriteria),
        tags: parseList(input.tags),
      },
    },
  };
}
