import { z } from 'zod';

export const documentSchema = z.object({
  title: z.string().trim().min(3, 'Título muito curto').max(200, 'Título muito longo'),
  content: z.string().trim().min(1, 'Conteúdo obrigatório'),
  category_id: z.string().uuid().nullable().optional(),
  status: z.enum(['Rascunho', 'Aguardando Aprovação', 'Aprovado', 'Arquivado']),
});

export type DocumentPayload = z.infer<typeof documentSchema>;

export function validateDocumentPayload(payload: Partial<DocumentPayload>) {
  return documentSchema.safeParse(payload);
}
