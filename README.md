# Pirataria no Minecraft — visualização com D3.js

Apresentação acadêmica em português sobre os registros de `NewDataSetMinecraft.csv`. A página combina contexto, indicadores, gráficos D3 e uma tabela interativa do conjunto de dados.

## Como executar

Sirva a pasta por HTTP para que o navegador carregue o CSV e o módulo D3:

```bash
python -m http.server 8000
```

Depois, abra `http://localhost:8000`.

## O que a apresentação mostra

- **01 — Plataforma:** compara computador e celular entre os registros piratas.
- **02 — Idade:** apresenta a distribuição das idades dos usuários piratas e a média.
- **03 — Tipo de versão:** compara os registros piratas e originais em uma matriz de quadrados.
- **Dataset completo:** permite buscar, filtrar por plataforma e versão, paginar e baixar os resultados filtrados como CSV.

Os valores são calculados no navegador a partir do arquivo CSV. Na tabela e no CSV exportado, os identificadores de Discord e Minecraft são omitidos.

## Resultados deste arquivo

- Registros no CSV: **1.397**
- Usuários piratas: **1.135** (aproximadamente **81,25%**)
- Usuários originais: **262** (aproximadamente **18,75%**)
- Piratas no computador: **958**
- Piratas no celular: **177**
- Idade média dos piratas com idade válida (≥ 5 anos): **16,96 anos**
- Proporção: **4,33 usuários piratas para cada original**

Registros com idade abaixo de 5 anos são excluídos das análises, mas permanecem na tabela do CSV. Registros sem idade podem entrar nas contagens de plataforma e versão, mas não na média de idade. Os resultados descrevem somente este arquivo; não representam necessariamente toda a população de jogadores e não demonstram causalidade ou perdas econômicas.

## Fontes de contexto

- Federal Trade Commission, [How To Recognize, Remove, and Avoid Malware](https://consumer.ftc.gov/articles/how-recognize-remove-avoid-malware) — orientação geral de segurança, não uma pesquisa específica sobre Minecraft.
- [Vídeo de Gabe Newell sobre pirataria](https://www.youtube.com/watch?v=qRa6oFU8XIg).
