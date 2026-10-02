import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const MIN_VALID_AGE = 5; // idades menores que 5 são consideradas dados inválidos

const raw = await d3.csv("NewDataSetMinecraft.csv", d => ({
  age: d.age === "" || d.age == null ? NaN : +d.age,
  client: d.client.trim(),
  version: d.version.trim()
}));

// Segurança extra: descarta qualquer registro com idade informada < 5.
// (registros sem idade continuam nas análises que não dependem da idade)
const data = raw.filter(d => !(Number.isFinite(d.age) && d.age < MIN_VALID_AGE));

const pirates = data.filter(d => d.version === "Cracked");
const paid = data.filter(d => d.version === "Paid Version");

const pcPirates = pirates.filter(d => d.client.includes("Computer"));
const mobilePirates = pirates.filter(d => d.client.includes("Mobile"));

// Idade só é analisada nos registros com idade válida
const piratesWithAge = pirates.filter(d => Number.isFinite(d.age) && d.age >= MIN_VALID_AGE);
const missingAge = pirates.length - piratesWithAge.length;

const meanAge = d3.mean(piratesWithAge, d => d.age);
const total = data.length;
const piratePct = pirates.length / total * 100;
const paidPct = paid.length / total * 100;

const fmt = d3.format(",d");
const pct = d3.format(".2f");
const ageText = d => Number.isFinite(d.age) ? `${d.age} anos` : "não informada";

// ---------- Summary ----------
const summary = [
  ["Registros", fmt(total)],
  ["Usuários Cracked", fmt(pirates.length)],
  ["Idade média dos Cracked", meanAge.toFixed(2) + " anos"],
  ["Cracked × Paid", (pirates.length / paid.length).toFixed(2) + " : 1"]
];

d3.select("#summary")
  .selectAll(".stat")
  .data(summary)
  .join("div")
  .attr("class", "stat")
  .html(([label, value]) => `
    <div class="stat-label">${label}</div>
    <div class="stat-value">${value}</div>
  `);

d3.select("#age-insight").html(
  `<strong>Média encontrada:</strong> ${meanAge.toFixed(2)} anos.
   A média foi calculada sobre os ${fmt(piratesWithAge.length)}
   registros <strong>Cracked</strong> com idade válida (≥ ${MIN_VALID_AGE} anos)` +
  (missingAge > 0
    ? `; ${fmt(missingAge)} registro${missingAge > 1 ? "s" : ""} sem idade informada ${missingAge > 1 ? "ficaram" : "ficou"} de fora desta análise.`
    : ".")
);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

function showTooltip(event, html) {
  tooltip
    .style("opacity", 1)
    .html(html)
    .style("left", `${event.clientX + 14}px`)
    .style("top", `${event.clientY + 14}px`);
}

function hideTooltip() {
  tooltip.style("opacity", 0);
}

// ---------- 01. Bubble / Circle Packing ----------
function drawPlatformChart() {
  const el = document.querySelector("#platform-chart");
  const width = Math.max(600, el.clientWidth);
  const height = 390;

  const svg = d3.select(el).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const groups = [
    { name: "PC — Java Edition", short: "PC", value: pcPirates.length, color: "var(--accent)" },
    { name: "Mobile — Bedrock", short: "Mobile", value: mobilePirates.length, color: "var(--accent-2)" }
  ];

  const root = d3.hierarchy({ children: groups })
    .sum(d => d.value);

  d3.pack()
    .size([width - 80, height - 60])
    .padding(22)(root);

  const nodes = root.leaves();

  const g = svg.append("g")
    .attr("transform", `translate(40,30)`);

  const node = g.selectAll(".platform-node")
    .data(nodes)
    .join("g")
    .attr("class", "platform-node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .style("cursor", "pointer")
    .on("mousemove", (event, d) => {
      showTooltip(event,
        `<strong>${d.data.name}</strong><br>
         ${fmt(d.data.value)} usuários Cracked<br>
         ${pct(d.data.value / pirates.length * 100)}% dos usuários Cracked`
      );
    })
    .on("mouseleave", hideTooltip);

  node.append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => d.data.color)
    .attr("fill-opacity", 1)
    .attr("stroke", "#000")
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 4);

  node.append("text")
    .attr("class", "platform-label")
    .attr("dy", -5)
    .text(d => d.data.short);

  node.append("text")
    .attr("class", "platform-number")
    .attr("dy", 27)
    .text(d => fmt(d.data.value));

  node.append("text")
    .attr("class", "platform-percent")
    .attr("dy", 48)
    .text(d => pct(d.data.value / pirates.length * 100) + "%");
}

// ---------- 02. Beeswarm / Dot Plot ----------
function drawAgeChart() {
  const el = document.querySelector("#age-chart");
  const width = Math.max(600, el.clientWidth);
  const margin = { top: 50, right: 30, bottom: 70, left: 30 };
  const r = 3.5;

  // Somente idades válidas (>= 5 anos); cópias para a simulação não alterar os dados originais
  const nodes = piratesWithAge.map(d => ({ ...d }));

  const x = d3.scaleLinear()
    .domain([
      Math.floor(d3.min(nodes, d => d.age)) - 1,
      Math.ceil(d3.max(nodes, d => d.age)) + 1
    ])
    .range([margin.left, width - margin.right]);

  // 1) roda a simulação ao redor de y = 0 para descobrir a altura necessária
  const simulation = d3.forceSimulation(nodes)
    .force("x", d3.forceX(d => x(d.age)).strength(1))
    .force("y", d3.forceY(0).strength(.08))
    .force("collide", d3.forceCollide(r + .4))
    .stop();

  for (let i = 0; i < 300; i++) simulation.tick();

  const yMin = d3.min(nodes, d => d.y) - r;
  const yMax = d3.max(nodes, d => d.y) + r;
  const swarmHeight = yMax - yMin;

  // 2) com a altura conhecida, posiciona tudo
  const plotTop = margin.top;
  const axisY = plotTop + swarmHeight + 16;
  const height = Math.max(430, axisY + margin.bottom);
  const dy = plotTop - yMin;

  const svg = d3.select(el).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  svg.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(x.ticks(20))
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", margin.top - 10)
    .attr("y2", axisY);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${axisY})`)
    .call(d3.axisBottom(x).ticks(20).tickFormat(d3.format("d")));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", axisY + 50)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--muted)")
    .text("Idade (anos)");

  svg.append("line")
    .attr("class", "mean-line")
    .attr("x1", x(meanAge))
    .attr("x2", x(meanAge))
    .attr("y1", margin.top - 10)
    .attr("y2", axisY);

  svg.append("text")
    .attr("class", "mean-label")
    .attr("x", x(meanAge) + 8)
    .attr("y", margin.top - 16)
    .text(`Média: ${meanAge.toFixed(2)} anos`);

  svg.selectAll(".age-dot")
    .data(nodes)
    .join("circle")
    .attr("class", "age-dot")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y + dy)
    .attr("r", r)
    .attr("fill", "var(--accent)")
    .attr("fill-opacity", .75)
    .attr("stroke", "#000")
    .attr("stroke-width", .8)
    .on("mousemove", (event, d) => {
      showTooltip(event, `<strong>Idade:</strong> ${d.age} anos<br>${d.client}`);
    })
    .on("mouseleave", hideTooltip);
}

// ---------- 03. Waffle / Dot Matrix ----------
function drawVersionChart() {
  const el = document.querySelector("#version-chart");
  const width = Math.max(600, el.clientWidth);

  // Ordem sequencial (sem seguir o id do dataset):
  // primeiro TODOS os Paid Version, depois TODOS os Cracked.
  const ordered = [...paid, ...pirates];

  const columns = 50;
  const gap = 3;
  const side = 24;
  const top = 74;
  const cell = Math.max(6, Math.min(18, Math.floor((width - side * 2 - (columns - 1) * gap) / columns)));

  const rows = Math.ceil(ordered.length / columns);
  const matrixWidth = columns * cell + (columns - 1) * gap;
  const matrixHeight = rows * cell + (rows - 1) * gap;
  const x0 = (width - matrixWidth) / 2;
  const height = top + matrixHeight + 56;

  const svg = d3.select(el).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  svg.append("g")
    .attr("transform", `translate(${x0},${top})`)
    .selectAll("rect")
    .data(ordered)
    .join("rect")
    .attr("x", (_, i) => (i % columns) * (cell + gap))
    .attr("y", (_, i) => Math.floor(i / columns) * (cell + gap))
    .attr("width", cell)
    .attr("height", cell)
    .attr("rx", 0)
    .attr("fill", d => d.version === "Cracked" ? "var(--danger)" : "var(--accent-2)")
    .attr("opacity", .95)
    .style("cursor", "pointer")
    .on("mousemove", (event, d) => {
      showTooltip(event,
        `<strong>${d.version}</strong><br>
         Plataforma: ${d.client}<br>
         Idade: ${ageText(d)}`
      );
    })
    .on("mouseleave", hideTooltip);

  // Paid Version vem primeiro (canto superior esquerdo) → rótulo à esquerda
  svg.append("image")
    .attr("href", "assets/diamond.png")
    .attr("x", side).attr("y", 10)
    .attr("width", 34).attr("height", 34);

  svg.append("text")
    .attr("x", side + 44)
    .attr("y", 34)
    .attr("fill", "var(--accent-2)")
    .text(`PAID — ${fmt(paid.length)} (${pct(paidPct)}%)`);

  // Cracked ocupa o restante da matriz → rótulo à direita
  svg.append("image")
    .attr("href", "assets/creeper.webp")
    .attr("x", width - side - 34).attr("y", 10)
    .attr("width", 34).attr("height", 34);

  svg.append("text")
    .attr("x", width - side - 44)
    .attr("y", 34)
    .attr("text-anchor", "end")
    .attr("fill", "var(--danger)")
    .text(`CRACKED — ${fmt(pirates.length)} (${pct(piratePct)}%)`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", top + matrixHeight + 32)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--muted)")
    .text(`${fmt(total)} registros — 1 quadrado = 1 usuário — primeiro Paid Version, depois Cracked`);
}

drawPlatformChart();
drawAgeChart();
drawVersionChart();