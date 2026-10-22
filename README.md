# Pirataria no Minecraft — visualização com D3.js

Apresentação acadêmica em português sobre os registros de `NewDataSetMinecraft.csv`. A página combina contexto, indicadores, gráficos D3 e uma tabela interativa do conjunto de dados.

## Como executar

Sirva a pasta por HTTP para que o navegador carregue o CSV e o módulo D3:

```bash
python -m http.server 8000
```

Depois, abra `http://localhost:8000`.

## O que a apresentação mostra

- **01 — Plataforma:** compara computador e celular entre os registros piratas com um pictograma D3.js (aproximadamente 50 usuários por personagem).
- **02 — Idade:** apresenta a distribuição das idades dos usuários piratas e a média; os pontos verdes representam computador e os laranjas, celular.
- **Galeria:** carrossel automático com as quatro imagens de `assets/`; clique na imagem para ampliá-la. O vídeo relacionado está incorporado logo abaixo.
- **03 — Tipo de versão:** compara os registros piratas e originais em uma matriz de quadrados; cada grupo está ordenado por idade crescente.
- **Dataset analisado:** permite buscar, filtrar por plataforma e versão, paginar e baixar os resultados filtrados como CSV.

Os valores são calculados no navegador a partir do arquivo CSV. Todas as análises, a tabela e o CSV exportado incluem somente registros com idade informada igual ou superior a 12 anos. O arquivo de origem permanece inalterado. Na tabela e no CSV exportado, os identificadores de Discord e Minecraft são omitidos.

## Resultados deste arquivo

- Registros analisados (idade ≥ 12): **1.392** de 1.397
- Usuários piratas: **1.130** (aproximadamente **81,18%**)
- Usuários originais: **262** (aproximadamente **18,82%**)
- Piratas no computador: **953**
- Piratas no celular: **177**
- Idade média dos piratas: **16,99 anos**
- Proporção: **4,31 usuários piratas para cada original**

Quatro registros com idade abaixo de 12 anos e um sem idade informada ficam fora de todas as análises e da tabela exibida. Os resultados descrevem somente este arquivo; não representam necessariamente toda a população de jogadores e não demonstram causalidade ou perdas econômicas.

## Fontes de contexto

- Federal Trade Commission, [How To Recognize, Remove, and Avoid Malware](https://consumer.ftc.gov/articles/how-recognize-remove-avoid-malware) — orientação geral de segurança, não uma pesquisa específica sobre Minecraft.
- [Vídeo de Gabe Newell sobre pirataria](https://www.youtube.com/watch?v=qRa6oFU8XIg).
