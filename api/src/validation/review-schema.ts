import { z } from 'zod';

// Les limites protegent l'API tout en restant largement superieures aux champs du popup.
const optionalText = (maxLength: number) => z.string().trim().max(maxLength).optional();
const textList = z.array(z.string().trim().min(1).max(200)).max(50);

export const structureReviewSchema = z.object({
  source: z.object({
    url: z.url().max(2_048),
    domain: z.string().trim().min(1).max(253),
    pageTitle: z.string().trim().min(1).max(500),
    description: optionalText(5_000),
    selectedText: optionalText(10_000),
    capturedAt: z.iso.datetime(),
  }),
  product: z.object({
    name: z.string().trim().min(1).max(500),
    description: optionalText(5_000),
    category: optionalText(200),
    price: z.number().finite().nonnegative().optional(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/)
      .optional(),
  }),
  research: z.object({
    notes: z.string().trim().max(10_000),
    pros: textList,
    cons: textList,
    testCriteria: textList,
    tags: textList,
  }),
});

export type StructureReviewRequest = z.infer<typeof structureReviewSchema>;
