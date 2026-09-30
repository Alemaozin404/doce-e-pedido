# 🧁 Doce & Pedido

Plataforma completa de pedidos para confeitarias artesanais: cardápio online, carrinho,
"Monte sua Festa", pedidos personalizados, envio organizado pelo **WhatsApp** e uma
**área administrativa** com dashboard, produtos, pedidos, calendário, clientes e configurações.

Feito com **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase**.

---

## ✨ Funcionalidades

| Área | Recursos |
| --- | --- |
| **Home** | Hero com foto, CTAs ("Ver cardápio" / "Fazer pedido"), indicadores, destaques, categorias, como funciona, kits, depoimentos, Instagram e CTA final |
| **Cardápio** | 7 categorias, busca por nome/ingrediente, filtro por categoria, preço, disponibilidade |
| **Produto** | Galeria, opções (sabores etc.), quantidade, data desejada, observações, relacionados |
| **Carrinho** | +/− quantidade, remover (com confirmação), limpar, subtotal, taxa de entrega, total — persistente (localStorage) |
| **Checkout** | Nome, telefone, data, horário, retirada/entrega, endereço, observações → **mensagem formatada no WhatsApp** |
| **Monte sua Festa** | Calculadora por número de convidados com estimativa de valores e orçamento via WhatsApp |
| **Personalizados** | Formulário completo (evento, data, convidados, tema, cores, referência) via WhatsApp |
| **Contato** | WhatsApp, Instagram, horários, localização — tudo configurável |
| **Admin** | Login só com senha, dashboard com métricas, pedidos com código amigável (ORD-...) e 6 status, encomendas personalizadas com pipeline próprio, calendário, CRUD de produtos, clientes, moderação de avaliações, relatórios e configurações da loja |
| **PWA** | Instalável no celular (manifest + service worker + ícones) |
| **SEO** | Metadata dinâmica, Open Graph, sitemap.xml, robots.txt, palavras-chave por cidade |

O site funciona **mesmo sem Supabase** (modo demonstração com produtos fictícios).
Com Supabase configurado, o catálogo e a área administrativa usam o banco real.

---

## 🚀 Como rodar no VS Code

Requisitos: [Node.js 18.17+](https://nodejs.org) e npm.

```bash
# 1. Instalar dependências
npm install

# 2. (Opcional, mas recomendado) configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e preencha ao menos NEXT_PUBLIC_WHATSAPP_NUMBER

# 3. Rodar em desenvolvimento
npm run dev
```

Abra <http://localhost:3000>.

Outros scripts:

```bash
npm run build      # build de produção
npm run start      # servir o build de produção
npm run typecheck  # verificar TypeScript
```

> **Primeira execução sem `.env.local`:** o site roda em modo demonstração
> (produtos fictícios, admin indica que falta configuração). Nada quebra.

---

## 🗄️ Configurar o Supabase

1. Crie uma conta em <https://supabase.com> e um novo projeto.
2. Abra **SQL Editor** e execute o conteúdo de [`database/schema.sql`](database/schema.sql)
   (tabelas, relacionamentos, índices, triggers, **RLS** e seeds).
3. Ainda no SQL Editor, execute [`database/storage.sql`](database/storage.sql)
   (bucket `media` para imagens com leitura pública e escrita só para admin).
4. Em **Project Settings → API**, copie:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Nunca** use a `service_role` no frontend.
5. Cole as chaves no `.env.local` e reinicie `npm run dev`.6. **Criar a administradora:** em **Authentication → Users → Add user**, cadastre o e-mail **`admin@doceepedido.local`** com a senha que você quiser usar no painel (ex.: `2117007`). O trigger `on_auth_user_created` cria o perfil automaticamente com `role = 'admin'`.
7. Faça login em `/admin/login` — agora basta **digitar a senha** (o e-mail técnico é usado internamente pelo sistema).
8. **Importante:** execute também as migrations em `database/migrations/` (`001_add_message_header.sql` e `002_order_code_rpc.sql`) no SQL Editor.

### Segurança (já implementada)

- Chaves apenas via variáveis de ambiente (`.env.local`); nenhuma credencial no frontend.
- **Row Level Security** em todas as tabelas: leitura pública apenas do catálogo,
  avaliações aprovadas e configurações; escrita somente autenticada.
- Senhas gerenciadas pelo Supabase Auth (nunca armazenadas manualmente).
- Entradas de formulários **sanitizadas** (`lib/validation.ts`) antes do uso.
- `/admin` bloqueado no `robots.txt`; páginas admin sem indexação.

---

## 💬 Configurar o WhatsApp

O número **não fica espalhado pelo código**. Ele é lido nesta ordem:

1. Tabela `settings` (editável em **/admin/configuracoes**) — tem prioridade;
2. Variável `NEXT_PUBLIC_WHATSAPP_NUMBER` no `.env.local`;
3. Vazio (o site avisa que não está configurado).

Formato: **só dígitos, com país e DDD** — ex.: `5511987654321`.

O envio usa o mecanismo **oficial** de abertura de conversa:

```
https://wa.me/<número>?text=<mensagem codificada>
```

A mensagem do pedido é gerada e codificada automaticamente por
[`services/whatsapp.ts`](services/whatsapp.ts) (também centraliza "Monte sua Festa"
e pedidos personalizados). Para migrar futuramente à **WhatsApp Business API**,
basta alterar esse único arquivo — a arquitetura já está preparada.

> Não há integração falsa: nada é "enviado" automaticamente. O cliente revisa
> e aperta enviar no próprio WhatsApp.

---

## ☁️ Deploy na Vercel

1. Suba o projeto para um repositório (GitHub/GitLab/Bitbucket).
2. Em <https://vercel.com>, **Add New → Project** e importe o repositório.
3. A Vercel detecta Next.js sozinha. Em **Environment Variables**, adicione:

   | Variável | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon public |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | ex. `5511987654321` |
   | `NEXT_PUBLIC_INSTAGRAM` | ex. `doceepedido` |
   | `NEXT_PUBLIC_CITY` | cidade para SEO (opcional) |
   | `NEXT_PUBLIC_SITE_URL` | `https://seudominio.com` (produção) |

4. **Deploy**. Depois, no Supabase (**Authentication → URL Configuration**),
   adicione `https://seudominio.com` entre as URLs permitidas.

---

## 📁 Estrutura de pastas

```
├── app/
│   ├── (site)/                # Site público
│   │   ├── page.tsx           # Home
│   │   ├── cardapio/          # Cardápio (filtros + busca)
│   │   ├── produto/[id]/      # Página do produto
│   │   ├── carrinho/          # Carrinho
│   │   ├── checkout/          # Checkout → WhatsApp
│   │   ├── monte-sua-festa/   # Calculadora de festa
│   │   ├── personalizados/    # Orçamento personalizado
│   │   └── contato/           # Contato
│   ├── admin/                 # Área administrativa protegida
│   │   ├── login/             # Autenticação
│   │   ├── page.tsx           # Dashboard
│   │   ├── produtos/          # CRUD de produtos
│   │   ├── pedidos/           # Pedidos + status
│   │   ├── calendario/        # Calendário de encomendas
│   │   ├── clientes/          # Clientes
│   │   └── configuracoes/     # Configurações da loja
│   ├── layout.tsx             # Layout raiz (fontes, providers, SEO)
│   ├── sitemap.ts / robots.ts # SEO
│   ├── not-found.tsx          # 404
│   └── error.tsx              # Erro global
├── components/
│   ├── ui/                    # Button, Modal, Toast, Skeleton, EmptyState…
│   ├── layout/                # Navbar, Footer, botões flutuantes, PWA
│   ├── product/               # ProductCard
│   ├── cart/                  # CartContext (carrinho global)
│   └── SettingsContext.tsx    # Configurações no cliente
├── services/                  # catalog, settings, whatsapp
├── lib/                       # config, supabase, format, validation
├── types/                     # Tipos do domínio
├── data/                      # Dados demo (substitua pelos reais)
├── database/                  # schema.sql + storage.sql (Supabase)
└── public/                    # manifest, sw.js, ícones
```

---

## 🧩 Substituindo os dados de demonstração

- **Com Supabase:** cadastre os produtos reais em **/admin/produtos** (nome, preço,
  categoria, foto, sabores, estoque, destaque) e ajuste as categorias direto no
  Supabase (**Table Editor → categories**).
- **Sem Supabase:** edite [`data/demo.ts`](data/demo.ts) — os produtos são só
  exemplos e devem ser trocados pelos reais.

## 🎨 Personalização visual

A paleta fica em [`tailwind.config.ts`](tailwind.config.ts): creme (#FDF9F4),
rosa suave (#E8B4BC), chocolate (#5C4033) e dourado (#C9A96A). Fontes
(Playfair Display + Plus Jakarta Sans) em [`app/layout.tsx`](app/layout.tsx).

## ✅ Checklist de qualidade

- [x] Build de produção sem erros (`npm run build`)
- [x] TypeScript estrito sem erros (`npm run typecheck`)
- [x] Todas as rotas respondem 200 (testadas em produção build)
- [x] Fluxo completo: cardápio → produto → carrinho → checkout → WhatsApp
- [x] Mensagem do WhatsApp gerada e codificada por serviço centralizado
- [x] RLS + auth + sanitização de entradas
- [x] Mobile-first, acessibilidade (HTML semântico, labels, aria, foco visível)
- [x] PWA instalável, sitemap, robots, Open Graph
