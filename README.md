### 1. Visão Geral do Projeto

#### 1.1. Nome Formal

**ITSM Onboarding Platform (Guia de Chamados)**

#### 1.2. Propósito Central

O projeto é uma **plataforma de autoatendimento e guia interativo** focada em otimizar o processo de **Onboarding** (integração) de novos usuários ou clientes em um ambiente de **IT Service Management (ITSM)**, geralmente relacionado à abertura e acompanhamento de chamados, requisições de serviço ou incidentes.
Seu objetivo primário é **reduzir a sobrecarga da equipe de suporte (Service Desk)** e **melhorar a experiência do usuário final** (UX) através de:
*   **Autoatendimento:** Permitir que o usuário encontre soluções ou o caminho correto para o chamado sem intervenção humana inicial.
    
*   **Padronização:** Garantir que os chamados abertos contenham as informações mínimas e corretas para o tratamento eficiente.
    
*   **Educação:** Ensinar o usuário a navegar pelos processos e sistemas de ITSM da organização.
    

#### 1.3. URL de Produção

https://itsm-guiadechamados.bolt.host/
<br>
</br>
<img width="1918" height="1039" alt="image" src="https://github.com/user-attachments/assets/8c45f8f2-0d8e-4683-bac8-31be0b1e60ae" />


### 2. Estrutura e Arquitetura (Hipóteses Iniciais)

_Esta seção é baseada na URL e no nome do projeto. Detalhes exatos de tecnologia (tech stack) exigirão acesso ao código-fonte._
| **Componente** | **Descrição/Função** | **Observação Técnica** |
| --- | --- | --- |
| **Frontend (GUI)** | Interface Gráfica de Usuário, responsável pela apresentação do "Guia de Chamados" e interações. | Geralmente construído com um **framework JavaScript** (React, Vue, Angular) ou um **construtor de sites/plataforma low-code/no-code** (dada a URL `bolt.host`). |
| **Backend (API/Serviço)** | Lógica de negócio, como buscar a lista de chamados/guias, gerenciar o fluxo de decisão e, potencialmente, integração com o sistema ITSM principal. | Pode ser uma API RESTful ou um serviço simples de entrega de conteúdo (CMS Headless). |
| **Base de Conhecimento/Conteúdo** | Onde os fluxos do guia, as respostas frequentes (FAQs) e as categorias de serviço/incidente são armazenados. | Pode ser um banco de dados simples, um CMS, ou até mesmo arquivos estáticos (JSON/YAML). |
| **Integração ITSM** | Conexão com a plataforma ITSM principal (ex: Service Now, GLPI, Jira Service Management) para **abertura automática de chamados** ou **verificação de status**. | Essencial para a funcionalidade completa; se não for direta, o guia apenas _direciona_ o usuário. |

### 3. Público-Alvo da Documentação

| **Público** | **Nível de Detalhe Requerido** | **Foco** |
| --- | --- | --- |
| **Usuários Finais** | **Baixo/Funcional** | Como usar o guia para resolver problemas ou abrir chamados. |
| **Stakeholders/Negócios** | **Médio/Estratégico** | O valor do projeto, os KPIs (Tempo Médio de Atendimento - TME, Volume de Chamados) que ele impacta. |
| **Desenvolvedores/DevOps** | **Alto/Técnico** | Estrutura do código, variáveis de ambiente, dependências, deploy, e pontos de integração. |
