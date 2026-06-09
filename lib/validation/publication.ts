import { z } from 'zod';

export const PUBLICATION_TYPES = [
  'memoire',
  'these',
  'article',
  'rapport',
  'etude_cas',
  'projet_innovation',
  'publication',
  'autre',
] as const;

export const LANGUAGES = ['fr', 'en', 'sw', 'other'] as const;

export const MAX_PDF_BYTES = 25 * 1024 * 1024; // 25 MB

// Empty string from a <select>/<input> becomes undefined, then null in the action.
const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .or(z.literal('').transform(() => undefined));

export const publicationCreateSchema = z.object({
  title: z.string().trim().min(3, 'Titre trop court').max(300),
  abstract: z.string().trim().max(5000).optional().or(z.literal('')),
  type: z.enum(PUBLICATION_TYPES),
  universityId: optionalUuid,
  categoryId: optionalUuid,
  year: z
    .number()
    .int()
    .min(1950)
    .max(2100)
    .optional()
    .nullable(),
  language: z.enum(LANGUAGES).default('fr'),
  keywords: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  coAuthors: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
  attestation: z.literal(true, {
    errorMap: () => ({ message: "Vous devez certifier être l'auteur ou avoir les droits." }),
  }),
  status: z.enum(['draft', 'pending']),
  // File already uploaded to Storage by the browser; we receive its metadata.
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive().max(MAX_PDF_BYTES),
});

export type PublicationCreateInput = z.input<typeof publicationCreateSchema>;
