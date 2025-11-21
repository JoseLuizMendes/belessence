# 🌟 Belessence - E-commerce de Perfumes Premium

Uma experiência de e-commerce moderna e sofisticada para perfumes premium, desenvolvida com as mais recentes tecnologias web e **pnpm** para máxima performance.

## ✨ Características Principais

### 🎨 **Design Premium & Responsivo**
- **Paleta de Cores da Marca**: Preto profundo, dourado suave, champagne e branco
- **Tipografia Elegante**: Playfair Display (títulos) + Inter (corpo)
- **Responsividade Mobile-First**: Otimizado para todas as telas
  - 📱 Mobile (9:16) - Layout vertical otimizado
  - ⬜ Quadrado (1:1) - Perfeito para redes sociais  
  - 🖥️ Desktop (16:9) - Experiência completa

### 🛠️ **Stack Tecnológica Moderna**
- **Framework**: Next.js 16 com App Router
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4 com OKLCH
- **Componentes**: shadcn/ui + Radix UI
- **Animações**: Framer Motion
- **Ícones**: Lucide React
- **Gerenciador**: **pnpm** (mais rápido que npm/yarn)

### 🚀 **Vantagens do pnpm**
- ⚡ **Instalação 3x mais rápida** que npm
- 💾 **Economia de espaço** com hard links
- 🔒 **Segurança aprimorada** com strict mode
- 🌐 **Monorepo friendly** nativo
- 📦 **Cache global** inteligente

### 🎯 **Funcionalidades Implementadas**

#### 🏠 **Página Inicial**
- **Hero Section**: Seção cinematográfica com gradientes OKLCH
- **Navegação Premium**: Menu responsivo com dropdown e mobile sheet
- **Coleções Exclusivas**: Cards interativos com hover effects
- **Produtos em Destaque**: Showcase com ratings e badges
- **Newsletter**: Captura elegante de leads
- **Footer Completo**: Links organizados e informações da empresa

#### 🛒 **E-commerce Features**
- **Carrinho Funcional**: Contador dinâmico no header
- **Busca Inteligente**: Modal de busca com overlay
- **Filtros por Categoria**: Navegação organizada
- **Sistema de Avaliações**: Stars e contadores de reviews
- **Badges Dinâmicos**: Novo, Bestseller, Limitado

#### 🎨 **Experiência do Usuário**
- **Animações Suaves**: Fade-in, stagger effects, parallax
- **Micro-interações**: Hover states, loading states
- **Acessibilidade**: ARIA labels, navegação por teclado
- **Performance**: Lazy loading, otimização de imagens

## 🚀 **Como Executar**

### Pré-requisitos
- Node.js 18+ 
- **pnpm** (recomendado) ou npm/yarn

### Instalação do pnpm
```bash
# Via npm (global)
npm install -g pnpm

# Via Homebrew (macOS)
brew install pnpm

# Via PowerShell (Windows)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

### Setup do Projeto
```bash
# Clone o repositório
cd frontend/belessence

# Instale as dependências com pnpm
pnpm install

# Execute em modo desenvolvimento
pnpm dev

# Acesse http://localhost:3000
```

### Scripts Disponíveis
```bash
pnpm dev          # Servidor de desenvolvimento
pnpm build        # Build de produção
pnpm start        # Servidor de produção
pnpm lint         # Verificação de código
pnpm type-check   # Verificação de tipos TypeScript
```

### Comandos pnpm Úteis
```bash
pnpm add <package>           # Adicionar dependência
pnpm add -D <package>        # Adicionar dev dependency
pnpm remove <package>        # Remover dependência
pnpm update                  # Atualizar dependências
pnpm outdated               # Verificar dependências desatualizadas
pnpm why <package>          # Ver por que um pacote foi instalado
```

## 📱 **Adaptações Responsivas**

### Mobile (9:16)
- Menu hambúrguer com sheet lateral
- Hero section otimizada para vertical
- Cards em coluna única
- Botões full-width
- Navegação touch-friendly

### Tablet (1:1)
- Layout híbrido desktop/mobile
- Grid de 2 colunas para produtos
- Menu condensado
- Espaçamento otimizado

### Desktop (16:9)
- Layout completo com sidebar
- Grid de 3 colunas
- Menu horizontal completo
- Hover effects avançados

## 🎨 **Sistema de Design**

### Cores da Marca (OKLCH)
```css
--belessence-black: oklch(0.1 0 0)          /* Preto profundo */
--belessence-gold: oklch(0.7 0.15 85)       /* Dourado suave */
--belessence-champagne: oklch(0.95 0.05 85) /* Champagne */
--belessence-white: oklch(1 0 0)            /* Branco puro */
```

### Tipografia
- **Display**: Playfair Display (400, 500, 600, 700)
- **Body**: Inter (300, 400, 500, 600, 700)

### Componentes Customizados
- **Gradient Hero**: Fundo cinematográfico com OKLCH
- **Glass Effect**: Backdrop blur para header
- **Gradient Cards**: Cards com gradiente da marca
- **Text Shadow Gold**: Sombra dourada para títulos

## 🔧 **Componentes shadcn/ui Utilizados**

- ✅ Button - Botões com variantes
- ✅ Card - Cards de produtos e coleções  
- ✅ Input - Campos de formulário
- ✅ Badge - Etiquetas e contadores
- ✅ Sheet - Menu mobile lateral
- ✅ Dialog - Modais e overlays
- ✅ Navigation Menu - Menu com dropdowns
- ✅ Avatar - Imagens de perfil
- ✅ Separator - Divisores de seção

## 📦 **Estrutura do Projeto**

```
frontend/belessence/
├── src/
│   ├── app/
│   │   ├── globals.css      # Estilos globais + Tailwind
│   │   ├── layout.tsx       # Layout principal
│   │   └── page.tsx         # Página inicial
│   ├── components/
│   │   └── ui/              # Componentes shadcn/ui
│   └── lib/
│       └── utils.ts         # Utilitários
├── public/                  # Assets estáticos
├── components.json          # Configuração shadcn/ui
├── package.json            # Dependências e scripts
├── pnpm-lock.yaml          # Lock file do pnpm
├── tailwind.config.ts      # Configuração Tailwind
└── tsconfig.json           # Configuração TypeScript
```

## 📈 **Próximas Implementações**

### Funcionalidades Pendentes
- [ ] Sistema de autenticação (NextAuth.js)
- [ ] Página de produto individual
- [ ] Carrinho de compras completo
- [ ] Sistema de pagamento (Stripe)
- [ ] Filtros avançados
- [ ] Sistema de reviews
- [ ] Wishlist/Favoritos
- [ ] Programa de fidelidade

### Melhorias Técnicas
- [ ] PWA (Progressive Web App)
- [ ] SEO otimizado (next-seo)
- [ ] Analytics integrado (Vercel Analytics)
- [ ] Testes automatizados (Vitest + Testing Library)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Otimização de performance (Bundle Analyzer)

## 🎯 **Identidade da Marca**

### Personalidade
- **Refinada**: Elegância em cada detalhe
- **Sedutora**: Apelo sensorial e emocional
- **Confiável**: Qualidade premium garantida
- **Moderna**: Tecnologia e tradição

### Tom de Voz
- **Elegante**: Linguagem sofisticada
- **Claro**: Comunicação direta
- **Sensorial**: Apelo aos sentidos
- **Emocional**: Conexão com o cliente

### Experiência do Cliente
- **Curadoria**: Seleção especializada
- **Personalização**: Experiência única
- **Premium**: Qualidade superior
- **Sensorial**: Jornada envolvente

## 🔄 **Migração para pnpm**

### Por que pnpm?
- **Performance**: 3x mais rápido que npm
- **Eficiência**: Economia de espaço em disco
- **Segurança**: Strict mode por padrão
- **Compatibilidade**: 100% compatível com npm

### Comandos Equivalentes
| npm | pnpm |
|-----|------|
| `npm install` | `pnpm install` |
| `npm run dev` | `pnpm dev` |
| `npm add package` | `pnpm add package` |
| `npm remove package` | `pnpm remove package` |

---

**Desenvolvido com ❤️ para despertar seus sentidos**

*Belessence - Onde cada fragrância conta uma história*

**Powered by pnpm ⚡ - Faster, more efficient package management**