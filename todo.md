# Jurista - Sistema de Gerenciamento de Empréstimos

## Banco de Dados
- [x] Criar tabela de clientes com informações pessoais
- [x] Criar tabela de empréstimos com valor, juros e periodicidade
- [x] Criar tabela de pagamentos com registro de parcelas
- [x] Criar queries para gerenciamento de clientes
- [x] Criar queries para gerenciamento de empréstimos
- [x] Criar queries para gerenciamento de pagamentos

## Backend (tRPC API)
- [x] Implementar API de clientes (criar, listar, editar, deletar)
- [x] Implementar API de empréstimos (criar, listar, editar, deletar)
- [x] Implementar API de pagamentos (registrar, listar, editar)
- [x] Implementar cálculo automático de juros compostos
- [x] Implementar detecção de atrasos
- [x] Implementar queries para dashboard financeiro
- [x] Implementar queries para relatórios detalhados

## Frontend - Interface
- [x] Configurar tema elegante e paleta de cores
- [x] Criar layout principal com navegação
- [x] Criar dashboard financeiro com métricas principais
- [x] Criar página de listagem de clientes
- [x] Criar formulário de cadastro/edição de clientes
- [x] Criar página de detalhes do cliente com histórico
- [x] Criar formulário de novo empréstimo
- [x] Criar página de listagem de empréstimos
- [x] Criar página de detalhes do empréstimo
- [x] Criar formulário de registro de pagamento
- [x] Criar lista de clientes em atraso
- [x] Implementar filtros e busca

## Funcionalidades Avançadas
- [x] Sistema de cálculo de juros compostos (semanal, quinzenal, mensal)
- [x] Controle de parcelas pagas e pendentes
- [x] Alertas visuais para atrasos
- [x] Relatórios detalhados por cliente
- [x] Responsividade para mobile

## Testes
- [x] Testar CRUD de clientes
- [x] Testar CRUD de empréstimos
- [x] Testar registro de pagamentos
- [x] Testar cálculos de juros
- [x] Testar detecção de atrasos
- [x] Testar responsividade mobile

## Autenticação Simples com Senha
- [x] Criar tabela de configurações para armazenar senha
- [x] Implementar API de login com senha
- [x] Implementar API de alteração de senha
- [x] Criar tela de login simples
- [x] Criar página de configurações para alterar senha
- [x] Remover dependência de OAuth
- [x] Testar login e alteração de senha

## Remover Autenticação
- [x] Remover proteção de rotas no App.tsx
- [x] Remover tela de login
- [x] Ajustar backend para não exigir autenticação
- [x] Criar usuário padrão para operações
- [x] Testar acesso direto ao sistema

## Correções e Melhorias de Pagamento
- [x] Corrigir lógica: pagamento de juros não deve abater valor principal
- [x] Adicionar cálculo de juros previstos para o mês atual
- [x] Adicionar métrica de juros mensais no dashboard
- [x] Testar pagamento apenas de juros
- [x] Testar cálculo de juros mensais

## Migração para Vercel + PlanetScale
- [x] Pesquisar documentação do Vercel e PlanetScale
- [x] Criar estrutura de serverless functions
- [x] Adaptar conexão MySQL para serverless (Filess.io/Aiven)
- [x] Converter backend Express para serverless
- [x] Criar vercel.json com configurações
- [ ] Criar documentação de deploy
- [ ] Testar localmente com Vercel CLI
