# Instruções para Aplicar Migration no Supabase

## Migration: pending_user_requests

Esta migration cria a tabela necessária para o sistema de aprovação de usuários criados por Coordenadores.

### Como Aplicar

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Copie todo o conteúdo do arquivo: `supabase/migrations/20251129000000_create_pending_user_requests.sql`
6. Cole no editor SQL
7. Clique em **Run** (ou pressione Ctrl+Enter)

### O que esta migration faz:

- ✅ Cria tabela `pending_user_requests` para armazenar solicitações de criação de usuários
- ✅ Adiciona políticas RLS para controle de acesso:
  - Coordenadores e Gerentes podem visualizar solicitações
  - Coordenadores podem criar solicitações
  - Apenas Gerentes podem aprovar/rejeitar
- ✅ Cria índices para melhor performance
- ✅ Adiciona trigger para atualização automática de `updated_at`

### Campos da tabela:

- `id`: UUID primário
- `email`: Email do usuário a ser criado
- `password_hash`: Senha criptografada
- `requested_role`: Função solicitada (Analista, Coordenador, Gerente)
- `requested_by`: ID do Coordenador que fez a solicitação
- `status`: Status da solicitação (pending, approved, rejected)
- `approved_by`: ID do Gerente que aprovou/rejeitou
- `reviewed_at`: Data/hora da revisão
- `rejection_reason`: Motivo da rejeição (opcional)
- `created_at`: Data/hora da criação
- `updated_at`: Data/hora da última atualização

## Verificação

Após aplicar a migration, você pode verificar se foi criada corretamente executando:

```sql
SELECT * FROM pending_user_requests LIMIT 1;
```

Se não houver erro, a tabela foi criada com sucesso! ✅
