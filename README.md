# Lubrificação SV v2 (teste)

PWA **offline-first** para lançamento de lubrificação — paralelo ao [PWA antigo](https://lubrificacaomaquinassv-cloud.github.io/pwa-lubrificacao/).

- **Preventiva** / **Corretiva** (completar nível e quebra entram em corretiva)
- Até **5 óleos** + **5 filtros** com busca digitável
- Preço automático via `dim_insumo` + `preco_insumo`
- Grava **`lubrificacao_v3`** + **`financeiro_lubrificacao`** ao sincronizar
- Sem campo Local na tela (gravado como `CAMPO` no banco)

## Configuração

1. Copie `config.example.js` → `config.js`
2. Preencha com URL e **anon key** do Supabase (`dados_controladoria_sv`)

```js
window.SV_CONFIG = {
  SUPABASE_URL: "https://azhpxhrwhegfysoeqmft.supabase.co",
  SUPABASE_ANON_KEY: "sua-chave-anon",
};
```

## Rodar local

```bash
cd lubrificacao-sv-v2
npx serve .
# ou: python -m http.server 8080
```

Abra no celular (mesma rede) ou use GitHub Pages.

## Deploy GitHub Pages

1. Crie repo `lubrificacao-sv-v2` (ou branch `gh-pages`)
2. **Não commite** `config.js` com chave — use Secrets no deploy ou configure manualmente no aparelho de teste
3. Settings → Pages → branch `main` / pasta root

URL de teste separada do PWA de produção.

## Offline

- App shell em cache (Service Worker)
- Catálogo de insumos/frotas em IndexedDB (atualiza quando online)
- Lançamentos ficam na fila `pending` até sync
- Indicador: **“X p/ sincronizar”**

## Tabelas

| Tabela | Uso |
|--------|-----|
| `lubrificacao_v3` | Lançamento operacional (novo) |
| `financeiro_lubrificacao` | Custo automático por insumo |
| `dim_insumo` / `preco_insumo` | Catálogo + preço |
| `dim_equipamento_lubri` | Frotas + intervalo horas |
| `ultima_troca_lubri` | Atualiza horímetro (best effort) |

**Produção atual:** `lubrificacao_v2` — não alterada.

## Ícones PWA

Adicione `icons/icon-192.png` e `icons/icon-512.png` (logo SV) ou ajuste `manifest.json`.
