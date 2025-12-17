# Guia de Gerenciamento de Usuários

## Como Acessar

### 1. Autenticação como Administrador

Na página principal (Dashboard), você encontrará um botão **"Administrador"** no canto superior direito, com ícone de escudo.

- Clique no botão **Administrador**
- Digite suas credenciais de gerente no modal de autenticação
- Apenas usuários com cargo de **Gerente** podem acessar esta funcionalidade
- Após autenticação bem-sucedida, você será redirecionado para a página de gerenciamento

## Funcionalidades Disponíveis

### 1. Adicionar Usuário Manualmente

1. Clique no botão **"Adicionar Usuário"** (azul)
2. Preencha os campos:
   - **Email**: endereço de email do usuário
   - **Senha**: senha do usuário (mínimo 6 caracteres)
   - **Cargo**: Analista, Coordenador ou Gerente
3. Clique em **"Adicionar"**

### 2. Importar Múltiplos Usuários

1. Clique no botão **"Importar"** (verde)
2. Cole os dados dos usuários no campo de texto
3. Formatos aceitos:
   - **CSV**: `email,senha,cargo`
   - **Texto**: `email senha cargo`
   - **Markdown**: `- email senha cargo`

#### Exemplo de importação:

```
joao@empresa.com,senha123,Analista
maria@empresa.com,senha456,Coordenador
admin@empresa.com,senha789,Gerente
```

ou

```
joao@empresa.com senha123 Analista
maria@empresa.com senha456 Coordenador
admin@empresa.com senha789 Gerente
```

4. Clique em **"Importar Usuários"**
5. O sistema mostrará o progresso e resultados da importação
   - ✓ Usuários criados com sucesso
   - ✗ Erros (com detalhes de cada falha)

### 3. Editar Usuário

1. Localize o usuário na tabela
2. Clique no ícone de **lápis** (editar)
3. Modifique:
   - Email
   - Cargo
4. Clique em **"Salvar Alterações"**

**Nota**: Você não pode editar seu próprio usuário através da interface

### 4. Deletar Usuário

1. Localize o usuário na tabela
2. Clique no ícone de **lixeira** (deletar)
3. Confirme a exclusão no modal
4. O usuário e todos os seus dados relacionados serão removidos

**Nota**: Você não pode deletar seu próprio usuário

## Cargos e Suas Permissões

### Analista
- Criar rascunhos de documentos
- Editar seus próprios documentos
- Visualizar documentos aprovados

### Coordenador
- Todas as permissões de Analista
- Editar todos os documentos
- Aprovar documentos de analistas
- Visualizar painel de administração

### Gerente
- Todas as permissões de Coordenador
- Gerenciar usuários (criar, editar, deletar)
- Importar múltiplos usuários
- Acesso total ao sistema

## Dicas Importantes

1. **Senhas**: Use senhas fortes com pelo menos 6 caracteres
2. **Importação em Lote**: Ideal para configuração inicial ou migração de dados
3. **Validação**: O sistema valida automaticamente emails e cargos durante a importação
4. **Erros de Importação**: Usuários com erro não são criados, mas não impedem a criação dos outros
5. **Service Role Key**: Certifique-se de que `VITE_SUPABASE_SERVICE_ROLE_KEY` está configurada nas variáveis de ambiente

## Solução de Problemas

### "Service role key não configurada"

1. Acesse as configurações do projeto
2. Adicione a variável de ambiente `VITE_SUPABASE_SERVICE_ROLE_KEY`
3. Cole o valor da service_role key do Supabase
4. Faça redeploy do projeto

### "Acesso negado"

- Verifique se você está autenticado com credenciais de **Gerente**
- Apenas gerentes podem acessar o gerenciamento de usuários

### Erro na importação

- Verifique o formato dos dados
- Certifique-se de que os cargos estão escritos corretamente: `Analista`, `Coordenador`, `Gerente`
- Cada linha deve ter exatamente 3 campos: email, senha e cargo

## Segurança

- A autenticação é validada em duas etapas:
  1. Verificação das credenciais
  2. Verificação do cargo de Gerente
- Usuários sem cargo de Gerente são automaticamente desconectados
- Todos os acessos são registrados no sistema
