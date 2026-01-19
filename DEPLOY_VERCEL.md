# 🚀 Guia de Deploy no Vercel

Este guia mostra como fazer deploy do sistema de gerenciamento de empréstimos no Vercel com banco de dados MySQL gratuito.

---

## 📋 Pré-requisitos

1. Conta no GitHub (gratuita)
2. Conta no Vercel (gratuita)
3. Conta no Filess.io ou Aiven (gratuitas)

---

## 🗄️ Passo 1: Criar Banco de Dados MySQL Gratuito

### Opção A: Filess.io (Recomendada - 10MB gratuito)

1. Acesse [https://filess.io/](https://filess.io/)
2. Clique em **"Sign Up"** e crie uma conta gratuita
3. Após login, clique em **"Create Database"**
4. Escolha **MySQL** como tipo
5. Selecione o plano **Free** (10MB)
6. Escolha a região mais próxima (ex: USA ou Europe)
7. Clique em **"Create"**
8. Copie a **Connection String** que aparece (algo como):
   ```
   mysql://user_abc123:pass_xyz789@mysql-abc.filess.io:3306/db_jurista
   ```

### Opção B: Aiven (Requer cartão de crédito, mas não cobra)

1. Acesse [https://aiven.io/free-mysql-database](https://aiven.io/free-mysql-database)
2. Clique em **"Get started for free"**
3. Crie uma conta (vai pedir cartão de crédito mas não cobra no plano gratuito)
4. Crie um serviço MySQL gratuito
5. Copie a **Connection String**

---

## 📦 Passo 2: Preparar o Código

1. **Criar repositório no GitHub:**
   ```bash
   cd /home/ubuntu/jurista_vercel
   git init
   git add .
   git commit -m "Initial commit - Sistema Jurista"
   ```

2. **Criar repositório no GitHub:**
   - Acesse [https://github.com/new](https://github.com/new)
   - Nome: `jurista-emprestimos`
   - Deixe como **público** ou **privado** (sua escolha)
   - **NÃO** adicione README, .gitignore ou licença
   - Clique em **"Create repository"**

3. **Enviar código para o GitHub:**
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/jurista-emprestimos.git
   git branch -M main
   git push -u origin main
   ```

---

## 🌐 Passo 3: Deploy no Vercel

1. **Acessar Vercel:**
   - Vá para [https://vercel.com/](https://vercel.com/)
   - Clique em **"Sign Up"**
   - Escolha **"Continue with GitHub"**
   - Autorize o Vercel a acessar seus repositórios

2. **Importar Projeto:**
   - No dashboard do Vercel, clique em **"Add New..." → "Project"**
   - Encontre o repositório **"jurista-emprestimos"**
   - Clique em **"Import"**

3. **Configurar Variáveis de Ambiente:**
   - Na tela de configuração, role até **"Environment Variables"**
   - Adicione a variável:
     - **Name:** `DATABASE_URL`
     - **Value:** Cole a connection string do Filess.io/Aiven
     - Exemplo: `mysql://user_abc123:pass_xyz789@mysql-abc.filess.io:3306/db_jurista?ssl={"rejectUnauthorized":true}`
   - Clique em **"Add"**

4. **Configurar Build:**
   - **Framework Preset:** Selecione **"Other"**
   - **Build Command:** `cd client && npm install && npm run build`
   - **Output Directory:** `client/dist`
   - **Install Command:** `npm install`

5. **Deploy:**
   - Clique em **"Deploy"**
   - Aguarde 2-3 minutos
   - Seu site estará online! 🎉

---

## 🔧 Passo 4: Migrar Banco de Dados

Após o deploy, você precisa criar as tabelas no banco de dados:

1. **Instalar Drizzle Kit localmente:**
   ```bash
   cd /home/ubuntu/jurista_vercel
   npm install -g drizzle-kit
   ```

2. **Criar arquivo .env local:**
   ```bash
   echo "DATABASE_URL=sua_connection_string_aqui" > .env
   ```

3. **Executar migração:**
   ```bash
   npm run db:push
   ```

Isso criará todas as tabelas (clientes, empréstimos, pagamentos) no seu banco de dados.

---

## ✅ Passo 5: Testar o Site

1. Acesse a URL fornecida pelo Vercel (algo como `https://jurista-emprestimos.vercel.app`)
2. O dashboard deve carregar normalmente
3. Teste criar um cliente
4. Teste criar um empréstimo
5. Teste registrar um pagamento

---

## 🔄 Atualizações Futuras

Para atualizar o site após fazer mudanças:

```bash
cd /home/ubuntu/jurista_vercel
git add .
git commit -m "Descrição das mudanças"
git push
```

O Vercel detecta automaticamente e faz o deploy da nova versão!

---

## ⚠️ Limitações do Plano Gratuito

### Filess.io:
- ✅ 10MB de armazenamento (suficiente para ~500-1000 clientes)
- ✅ Sempre online (não dorme)
- ✅ SSL incluído
- ❌ Backup manual necessário

### Vercel:
- ✅ 100GB de bandwidth por mês
- ✅ Deploy automático via Git
- ✅ SSL incluído
- ⚠️ Funções serverless com timeout de 10 segundos
- ⚠️ Cold start de 1-3 segundos na primeira requisição

---

## 🆘 Problemas Comuns

### Erro: "Cannot connect to database"
- Verifique se a `DATABASE_URL` está correta no Vercel
- Certifique-se de que adicionou `?ssl={"rejectUnauthorized":true}` no final

### Erro: "Table doesn't exist"
- Execute `npm run db:push` localmente para criar as tabelas

### Site demora para carregar
- Normal no primeiro acesso (cold start)
- Próximas requisições serão mais rápidas

### Banco de dados cheio (10MB)
- Exporte os dados
- Delete registros antigos
- Ou migre para Aiven (plano gratuito maior)

---

## 📊 Monitoramento

- **Dashboard Vercel:** [https://vercel.com/dashboard](https://vercel.com/dashboard)
  - Veja logs de erro
  - Monitore uso de bandwidth
  - Veja analytics de visitantes

- **Filess.io Dashboard:** [https://filess.io/dashboard](https://filess.io/dashboard)
  - Monitore uso de armazenamento
  - Veja conexões ativas

---

## 🎯 Domínio Personalizado (Opcional)

Para usar um domínio próprio (ex: `meusite.com.br`):

1. Compre um domínio em qualquer registrador (Registro.br, GoDaddy, etc)
2. No Vercel, vá em **Settings → Domains**
3. Adicione seu domínio
4. Configure os DNS conforme instruções do Vercel
5. Aguarde propagação (até 48h)

---

## 💾 Backup dos Dados

**Importante:** Faça backup regular dos dados!

```bash
# Exportar todos os dados
mysqldump -h mysql-abc.filess.io -u user_abc123 -p db_jurista > backup.sql

# Importar backup
mysql -h mysql-abc.filess.io -u user_abc123 -p db_jurista < backup.sql
```

---

## 🎉 Pronto!

Seu sistema está online e acessível de qualquer lugar! 

**URL do seu site:** `https://jurista-emprestimos.vercel.app`

Compartilhe o link com seus clientes ou acesse de qualquer dispositivo (computador, tablet, celular).
