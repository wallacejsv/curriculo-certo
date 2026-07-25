# Currículo Certo

> 🇧🇷 Português · [🇺🇸 English](README.en.md)

Gerador de currículo e carta de apresentação sob medida para uma vaga específica, usando IA. Você cola a descrição da vaga e o seu perfil do LinkedIn; a aplicação devolve um currículo e uma carta ajustados àquela vaga, prontos para baixar em PDF — no mesmo idioma do anúncio.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · Claude (Anthropic) · React PDF

---

## Índice

- [Como funciona](#como-funciona)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Configurando a chave da API](#configurando-a-chave-da-api)
- [Rodando o projeto](#rodando-o-projeto)
- [Usando a aplicação](#usando-a-aplicação)
- [Como a IA é usada](#como-a-ia-é-usada)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Scripts](#scripts)
- [Limitações conhecidas](#limitações-conhecidas)

---

## Como funciona

```
Vaga (título + descrição)  ─┐
                            ├─→  /api/generate  ─→  Claude  ─→  JSON validado  ─→  Preview + PDF
Perfil do LinkedIn ─────────┘     (Node runtime)     (2 chamadas)     (Zod)
   texto colado ou PDF
```

1. Você preenche o título e a descrição da vaga, e fornece seu perfil do LinkedIn — colando o texto ou enviando o PDF que o próprio LinkedIn exporta.
2. Se for PDF, o texto é extraído no servidor com [`unpdf`](https://github.com/unjs/unpdf) (pdf.js empacotado, sem dependências nativas).
3. Uma heurística leve detecta o idioma provável da vaga e passa isso como dica ao modelo.
4. O Claude gera **dois documentos em paralelo**: o currículo e a carta.
5. A resposta é validada contra schemas Zod. Se vier fora do formato, há retry automático.
6. O front exibe um preview e gera os PDFs no navegador, sob demanda.

---

## Requisitos

- **Node.js 18+**
- Uma **chave de API da Anthropic** ([console.anthropic.com](https://console.anthropic.com/settings/keys))

---

## Instalação

```bash
git clone https://github.com/wallacejsv/curriculo-certo.git
```

```bash
cd curriculo-certo && npm install
```

---

## Configurando a chave da API

A aplicação precisa de uma chave da Anthropic para funcionar. Sem ela, a geração falha com uma mensagem explícita.

**1.** Crie sua chave em [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

**2.** Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

**3.** Abra o `.env` e preencha a variável:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

Pronto. O `.env` já está no `.gitignore` — sua chave não vai para o repositório.

> [!WARNING]
> Nunca comite o arquivo `.env`, e nunca cole sua chave em issues, prints ou pull requests. Se uma chave vazar, revogue-a imediatamente no console da Anthropic e gere outra.

### Custo

Cada geração faz **duas chamadas** à API da Anthropic (uma para o currículo, outra para a carta), com limite de 8.192 tokens de saída cada. O custo por geração é da ordem de centavos de dólar e varia com o tamanho da vaga e do perfil. Consulte a [tabela de preços da Anthropic](https://www.anthropic.com/pricing) para o modelo que estiver usando.

---

## Rodando o projeto

**Desenvolvimento** — em [localhost:3000](http://localhost:3000):

```bash
npm run dev
```

**Produção:**

```bash
npm run build && npm start
```

**Verificação de tipos:**

```bash
npm run lint
```

---

## Usando a aplicação

1. **Título da vaga** — ex.: `Product Manager Sênior`.
2. **Descrição da vaga** — cole o anúncio completo. Quanto mais completo, melhor o ajuste: é daqui que saem as palavras-chave e o idioma.
3. **Seu LinkedIn** — duas opções:

   | Modo | Como fazer |
   |---|---|
   | **Colar texto** | Abra seu perfil no LinkedIn, selecione tudo (`Ctrl+A`) e cole no campo. |
   | **Upload PDF** | No LinkedIn: seu perfil → **Mais** → **Salvar como PDF**. Envie o arquivo. |

4. Clique em **Gerar currículo + carta** e aguarde alguns segundos.
5. Confira o preview e baixe os PDFs. Os arquivos saem nomeados a partir do seu nome e do cargo.

O painel verde **"Requisitos da vaga cobertos"** lista quais exigências do anúncio o modelo conseguiu evidenciar no seu histórico real — útil para você ver, antes de enviar, onde seu perfil cobre a vaga e onde não cobre.

---

## Como a IA é usada

### Duas chamadas independentes, em paralelo

Currículo e carta são gerados por **chamadas separadas**, cada uma com sua própria *tool*:

| Documento | Tool | Schema Zod |
|---|---|---|
| Currículo | `emit_resume` | `ResumeSchema` |
| Carta | `emit_cover_letter` | `CoverLetterSchema` |

A separação é deliberada. Com um schema combinado, o modelo ocasionalmente serializava um dos campos como string JSON e derrubava o outro — uma falha irrecuperável. Com uma tool de objeto único por documento, se ele serializar, o input chega como string no topo e é recuperado com `JSON.parse`; e não existe "outro campo" para se perder.

Como as duas chamadas são independentes, rodam via `Promise.all` — a latência total é a de uma só.

### Saída estruturada e validação

O modelo é forçado a responder pela tool (`tool_choice`), nunca em texto livre. A resposta passa por:

1. **Coerção** — se o input veio como string JSON, faz `JSON.parse`.
2. **Validação Zod** — o objeto precisa bater com o schema.
3. **Retry** — até **3 tentativas** em caso de resposta malformada.

Truncamento por `max_tokens` não é retentado: retry não resolveria, então o erro é reportado direto ao usuário com orientação para encurtar a entrada.

### Idioma

Uma heurística em `src/lib/language.ts` conta marcadores de português e inglês na descrição da vaga (acentos, palavras funcionais, termos típicos de anúncio) e produz uma **dica**. A decisão final é do modelo, que verifica contra o texto real e registra o resultado no campo `language`. Currículo e carta saem sempre no idioma da vaga, sem mistura.

### Regras de escrita

Os system prompts (`src/lib/prompt.ts`) impõem duas restrições centrais:

**Nada de invenção.** O modelo só pode usar fatos presentes no perfil: empregos, empresas, datas, formação e competências reais. Pode reescrever, reordenar e enfatizar em função da vaga — nunca inventar empregadores, cargos, diplomas, certificações ou números. Se um requisito da vaga não tem lastro no perfil, é omitido em vez de forjado.

**Não pode soar como texto de IA.** O prompt bane explicitamente o vocabulário que denuncia geração automática — clichês de autoelogio (*orientado a resultados*, *proativo*, *proven track record*), jargão corporativo (*alavancar*, *sinergia*, *leverage*, *cutting-edge*), a "regra de três" repetitiva, ritmo uniforme entre frases e as aberturas e fechamentos manjados de carta de apresentação.

### Otimização para ATS

O currículo é construído para passar por *Applicant Tracking Systems* e ainda assim ser agradável a um recrutador humano: experiência em ordem cronológica inversa, bullets com verbo de ação e resultado mensurável quando o perfil fornece um, palavras-chave da vaga incorporadas naturalmente, e seções com nomes padrão no idioma escolhido.

---

## Variáveis de ambiente

| Variável | Obrigatória | Padrão | Descrição |
|---|:---:|---|---|
| `ANTHROPIC_API_KEY` | ✅ | — | Sua chave da API da Anthropic. |
| `RESUME_MODEL` | ❌ | `claude-sonnet-5` | Modelo usado na geração. Aceita qualquer ID de modelo válido da Anthropic. |

---

## Estrutura do projeto

```
src/
├── app/
│   ├── api/generate/route.ts   Endpoint POST: recebe o form, orquestra a geração
│   ├── page.tsx                Página principal (React Query + estados de UI)
│   ├── layout.tsx              Layout raiz
│   └── globals.css             Estilos globais (Tailwind)
├── components/
│   ├── JobForm.tsx             Formulário: vaga + LinkedIn (colar ou upload)
│   ├── ResultView.tsx          Preview dos documentos e download dos PDFs
│   └── Providers.tsx           Provider do React Query
├── lib/
│   ├── anthropic.ts            Chamadas ao Claude, tools, retry e validação
│   ├── prompt.ts               System prompts (voz, no-invention, regras ATS)
│   ├── schema.ts               Schemas Zod e tipos derivados
│   ├── language.ts             Heurística de detecção de idioma
│   └── linkedin.ts             Extração de texto do PDF do LinkedIn
└── pdf/
    ├── ResumeDocument.tsx      Documento PDF do currículo
    └── CoverLetterDocument.tsx Documento PDF da carta
```

---

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm start` | Serve o build de produção |
| `npm run lint` | Verificação de tipos (`tsc --noEmit`) |

---

## Limitações conhecidas

- **Sem suíte de testes.** O projeto ainda não tem testes automatizados.
- **Timeout de 120s** na rota de geração (`maxDuration`). Vagas e perfis muito longos podem esbarrar nesse limite.
- **Limite de 8.192 tokens** por documento. Perfis muito extensos podem ser truncados; nesse caso a aplicação avisa e sugere encurtar a entrada.
- **Extração de PDF depende do layout.** O PDF exportado pelo LinkedIn funciona bem; PDFs de currículo com layout de colunas ou muito gráficos podem extrair texto embaralhado. Nesses casos, prefira colar o texto.
- **Geração de PDF roda no navegador.** O `@react-pdf/renderer` é carregado sem SSR e monta o arquivo no cliente.
