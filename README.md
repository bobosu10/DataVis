# Pirataria no Minecraft — Dashboard D3.js

Projeto de visualização de dados desenvolvido com D3.js a partir do arquivo `piracydataset.csv`.

## Perguntas respondidas

1. Qual plataforma tem mais usuários adeptos à pirataria?
2. Qual a média de idade dos jogadores adeptos à pirataria?
3. Qual a relação de usuários que jogam a versão original em comparação com a versão "pirata"?

## Resultados calculados

- Total de registros: 1423
- Cracked: 1156 (81.24%)
- Paid Version: 267 (18.76%)
- Cracked no PC: 974
- Cracked no Mobile: 182
- Média de idade dos usuários Cracked: 16.68 anos
- Relação Cracked : Paid: 4.33 : 1

## Visualizações

### 01 — Bubble / Circle Packing
Compara PC e Mobile usando o tamanho de círculos. O número dentro do círculo também informa a quantidade.

### 02 — Beeswarm / Dot Plot
Cada ponto representa um usuário Cracked. A posição horizontal representa a idade e a linha tracejada representa a média.

### 03 — Waffle / Dot Matrix
Cada quadrado representa um registro. A distribuição entre Cracked e Paid permite perceber a proporção sem usar pizza.


```bash
python -m http.server 8000
```
