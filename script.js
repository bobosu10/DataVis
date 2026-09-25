import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const data = await d3.csv("piracydataset.csv", d => ({
  age: +d.age,
  client: d.client.trim(),
  version: d.version.trim()
}));

const pirates = data.filter(d => d.version === "Cracked");
const paid = data.filter(d => d.version === "Paid Version");

const pcPirates = pirates.filter(d => d.client.includes("Computer"));
const mobilePirates = pirates.filter(d => d.client.includes("Mobile"));

const meanAge = d3.mean(pirates, d => d.age);
const total = data.length;
const piratePct = pirates.length / total * 100;
const paidPct = paid.length / total * 100;

const fmt = d3.format(",d");
const pct = d3.format(".2f");

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
   A média foi calculada somente sobre os ${fmt(pirates.length)}
   registros classificados como <strong>Cracked</strong>.`
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
    .attr("fill-opacity", .78)
    .attr("stroke", "#eef3ff")
    .attr("stroke-opacity", .12)
    .attr("stroke-width", 2);

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
  const height = 430;
  const margin = { top: 40, right: 30, bottom: 60, left: 30 };

  const svg = d3.select(el).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const x = d3.scaleLinear()
    .domain([
      Math.floor(d3.min(pirates, d => d.age)) - 1,
      Math.ceil(d3.max(pirates, d => d.age)) + 1
    ])
    .range([margin.left, width - margin.right]);

  const baseline = height / 2 + 25;

  svg.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(x.ticks(10))
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom);

  svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${baseline + 70})`)
    .call(d3.axisBottom(x).ticks(12).tickFormat(d3.format("d")));

  const simulation = d3.forceSimulation(pirates)
    .force("x", d3.forceX(d => x(d.age)).strength(1))
    .force("y", d3.forceY(baseline).strength(.15))
    .force("collide", d3.forceCollide(4.5))
    .stop();

  for (let i = 0; i < 180; i++) simulation.tick();

  svg.append("line")
    .attr("class", "mean-line")
    .attr("x1", x(meanAge))
    .attr("x2", x(meanAge))
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom);

  svg.append("text")
    .attr("class", "mean-label")
    .attr("x", x(meanAge) + 8)
    .attr("y", margin.top + 5)
    .text(`Média: ${meanAge.toFixed(2)} anos`);

  svg.selectAll(".age-dot")
    .data(pirates)
    .join("circle")
    .attr("class", "age-dot")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 4)
    .attr("fill", "var(--accent)")
    .attr("fill-opacity", .48)
    .attr("stroke", "var(--accent)")
    .attr("stroke-width", .6)
    .on("mousemove", (event, d) => {
      showTooltip(event, `<strong>Idade:</strong> ${d.age} anos`);
    })
    .on("mouseleave", hideTooltip);
}

// ---------- 03. Waffle / Dot Matrix ----------
function drawVersionChart() {
  const el = document.querySelector("#version-chart");
  const width = Math.max(600, el.clientWidth);
  const height = 520;

  const svg = d3.select(el).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  // One square per record. 40 columns = 35 rows for 1400+ records.
  const columns = 40;
  const gap = 3;
  const top = 58;
  const side = 24;
  const availableWidth = width - side * 2;
  const cell = Math.min(11, (availableWidth - (columns - 1) * gap) / columns);

  const rows = Math.ceil(data.length / columns);
  const matrixHeight = rows * (cell + gap);
  const x0 = (width - (columns * cell + (columns - 1) * gap)) / 2;

  const squares = svg.append("g")
    .attr("transform", `translate(${x0},${top})`)
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (_, i) => (i % columns) * (cell + gap))
    .attr("y", (_, i) => Math.floor(i / columns) * (cell + gap))
    .attr("width", cell)
    .attr("height", cell)
    .attr("rx", 1.5)
    .attr("fill", d => d.version === "Cracked" ? "var(--danger)" : "var(--accent-2)")
    .attr("opacity", .85)
    .style("cursor", "pointer")
    .on("mousemove", (event, d) => {
      showTooltip(event,
        `<strong>${d.version}</strong><br>
         Plataforma: ${d.client}<br>
         Idade: ${d.age}`
      );
    })
    .on("mouseleave", hideTooltip);

  svg.append("text")
    .attr("x", side)
    .attr("y", 28)
    .attr("fill", "var(--danger)")
    .attr("font-weight", 800)
    .text(`CRACKED — ${fmt(pirates.length)} (${pct(piratePct)}%)`);

  svg.append("text")
    .attr("x", width - side)
    .attr("y", 28)
    .attr("text-anchor", "end")
    .attr("fill", "var(--accent-2)")
    .attr("font-weight", 800)
    .text(`PAID — ${fmt(paid.length)} (${pct(paidPct)}%)`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", top + matrixHeight + 25)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--muted)")
    .attr("font-size", 12)
    .text(`${fmt(total)} registros — 1 quadrado = 1 usuário`);
}

drawPlatformChart();
drawAgeChart();
drawVersionChart();
