# 💼 Jurista - Sistema de Gerenciamento de Empréstimos

Sistema completo para gerenciar empréstimos com controle de clientes, juros compostos, pagamentos e alertas de atraso.

## 🌟 Funcionalidades

- ✅ Cadastro e gerenciamento de clientes
- ✅ Registro de empréstimos com juros (semanal, quinzenal ou mensal)
- ✅ Cálculo automático de juros compostos
- ✅ Controle de pagamentos (juros, principal ou ambos)
- ✅ Dashboard com métricas financeiras
- ✅ Alertas de empréstimos em atraso
- ✅ Previsão de juros mensais
- ✅ Interface responsiva (desktop e mobile)

## 🚀 Deploy no Vercel

**Leia o guia completo:** [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

### Resumo rápido:

1. Criar banco MySQL gratuito em [Filess.io](https://filess.io/)
2. Fazer fork deste repositório no GitHub
3. Importar no [Vercel](https://vercel.com/)
4. Adicionar variável `DATABASE_URL` nas configurações
5. Deploy automático!

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env
# Editar .env com sua connection string

# Criar tabelas
npm run db:push

# Iniciar servidor de desenvolvimento
npm run dev
```

## 📦 Tecnologias

- **Frontend:** React 19 + Vite + Tailwind CSS 4
- **Backend:** tRPC + Node.js (Serverless)
- **Banco:** MySQL (Filess.io ou Aiven)
- **Deploy:** Vercel
- **ORM:** Drizzle ORM

## 📄 Licença

MIT

## 🤝 Suporte

Para dúvidas sobre deploy, consulte [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)
