# Pirataria no Minecraft — Dashboard D3.js

Projeto de visualização de dados desenvolvido com D3.js a partir do arquivo `piracydataset.csv`.

## Contexto (antes dos dados)

Seção de abertura com barra de itens estilo Minecraft e três painéis: riscos digitais (malware, mineração, roubo de credenciais), impacto econômico e mercado/acesso (com o vídeo de Gabe Newell incorporado). A lógica das abas fica em `context.js`.

## Perguntas respondidas

1. Qual plataforma tem mais usuários adeptos à pirataria?
2. Qual a média de idade dos jogadores adeptos à pirataria?
3. Qual a relação de usuários que jogam a versão original em comparação com a versão "pirata"?

## Resultados calculados

- Total de registros: 1423
- Piratas (Cracked): 1156 (81.24%)
- Originais (Paid Version): 267 (18.76%)
- Piratas no computador: 974
- Piratas no celular: 182
- Média de idade dos usuários piratas: 16.68 anos
- Relação piratas : originais: 4.33 : 1

## Visualizações

### 01 — Bolhas (empacotamento circular)
Compara computador e celular usando o tamanho de círculos. O número dentro do círculo também informa a quantidade.

### 02 — Enxame de pontos
Cada ponto representa um usuário pirata. A posição horizontal representa a idade e a linha tracejada representa a média.

### 03 — Matriz de quadrados (waffle)
Cada quadrado representa um registro. A distribuição entre piratas e originais permite perceber a proporção sem usar pizza.


```bash
python -m http.server 8000
```