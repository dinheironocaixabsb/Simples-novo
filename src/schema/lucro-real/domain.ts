import { z } from 'zod';

export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "O nome do workspace é obrigatório"),
  created_at: z.string().datetime().optional(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const ClientSchema = z.object({
  id: z.string(),
  workspace_id: z.string(),
  cnpj: z.string(),
  name: z.string().min(1, "O nome do cliente é obrigatório"),
  deleted_at: z.string().datetime().nullable().optional(),
});
export type Client = z.infer<typeof ClientSchema>;
