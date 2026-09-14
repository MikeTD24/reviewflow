export type PageSnapshot = {
  title: string;
  url: string;
  description: string;
  openGraphTitle: string;
  selectedText: string;
  jsonLd: string[];
};

export type ProductCapture = {
  name: string;
  description?: string;
  price?: number;
  currency?: string;
};

export type PageCapture = {
  pageTitle: string;
  url: string;
  domain: string;
  description?: string;
  selectedText?: string;
  product: ProductCapture;
};

type JsonObject = Record<string, unknown>;

export function readPageSnapshot(): PageSnapshot {
  // Les meta standards sont prioritaires ; Open Graph reste un repli courant sur les boutiques.
  const description =
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ??
    document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content ??
    '';

  return {
    title: document.title,
    url: window.location.href,
    description,
    openGraphTitle:
      document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content ?? '',
    selectedText: window.getSelection()?.toString() ?? '',
    jsonLd: Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
    ).map((script) => script.textContent ?? ''),
  };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProductType(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.toLowerCase() === 'product';
  }

  return Array.isArray(value) && value.some(isProductType);
}

function findProduct(value: unknown): JsonObject | undefined {
  // Une page peut publier Product a la racine, dans un tableau ou dans un @graph Schema.org.
  if (Array.isArray(value)) {
    for (const entry of value) {
      const product = findProduct(entry);
      if (product) return product;
    }
    return undefined;
  }

  if (!isJsonObject(value)) return undefined;
  if (isProductType(value['@type'])) return value;

  return findProduct(value['@graph']);
}

function parseJsonLdProduct(blocks: string[]): JsonObject | undefined {
  for (const block of blocks) {
    try {
      const product = findProduct(JSON.parse(block));
      if (product) return product;
    } catch {
      // Un bloc invalide ne doit pas empecher l'analyse des blocs suivants.
    }
  }

  return undefined;
}

export function normalizePrice(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;

  const compact = value.trim().replace(/[^\d,.-]/g, '');
  if (!compact) return undefined;

  // Le dernier separateur est considere decimal afin d'accepter 1 299,90 et 1,299.90.
  const lastComma = compact.lastIndexOf(',');
  const lastDot = compact.lastIndexOf('.');
  let normalized = compact;

  if (lastComma > lastDot) {
    normalized = compact.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma >= 0) {
    normalized = compact.replace(/,/g, '');
  } else if (lastComma >= 0) {
    normalized = compact.replace(',', '.');
  }

  const price = Number(normalized);
  return Number.isFinite(price) ? price : undefined;
}

function readText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readOffer(product: JsonObject): JsonObject | undefined {
  const offers = product['offers'];
  if (Array.isArray(offers)) return offers.find(isJsonObject);
  return isJsonObject(offers) ? offers : undefined;
}

function extractProduct(snapshot: PageSnapshot, pageTitle: string): ProductCapture {
  const product = parseJsonLdProduct(snapshot.jsonLd);
  const offer = product ? readOffer(product) : undefined;
  // Les donnees structurees sont les plus precises, puis viennent les meta et le titre visible.
  const name = readText(product?.['name']) ?? snapshot.openGraphTitle.trim() ?? pageTitle;
  const description = readText(product?.['description']) ?? readText(snapshot.description);
  const price = normalizePrice(offer?.['price']);
  const currency = readText(offer?.['priceCurrency']);

  return {
    name: name || pageTitle,
    ...(description ? { description } : {}),
    ...(price !== undefined ? { price } : {}),
    ...(currency ? { currency } : {}),
  };
}

export function createPageCapture(snapshot: PageSnapshot): PageCapture {
  const pageTitle = snapshot.title.trim();
  const description = snapshot.description.trim();
  const selectedText = snapshot.selectedText.trim();

  return {
    pageTitle,
    url: snapshot.url,
    domain: new URL(snapshot.url).hostname,
    ...(description ? { description } : {}),
    ...(selectedText ? { selectedText } : {}),
    product: extractProduct(snapshot, pageTitle),
  };
}
