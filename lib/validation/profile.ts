import { z } from 'zod';

const optionalUuid = z
  .string()
  .uuid()
  .optional()
  .or(z.literal('').transform(() => undefined));

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2, 'Nom trop court').max(120),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
  universityId: optionalUuid,
  avatarUrl: z.string().url().max(500).optional().or(z.literal('')),
});

export type ProfileUpdateInput = z.input<typeof profileUpdateSchema>;
