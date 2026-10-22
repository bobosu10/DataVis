import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const MIN_ANALYSIS_AGE = 12;

const raw = await d3.csv("NewDataSetMinecraft.csv", (d, i) => ({
  row: i + 1,
  age: d.age === "" || d.age == null ? NaN : +d.age,
  client: d.client.trim(),
  version: d.version.trim()
}));

const data = raw.filter(d => Number.isFinite(d.age) && d.age >= MIN_ANALYSIS_AGE);
const excludedUnderAge = raw.filter(d => Number.isFinite(d.age) && d.age < MIN_ANALYSIS_AGE).length;
const excludedWithoutAge = raw.length - data.length - excludedUnderAge;

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
// Os valores do CSV estão em inglês; a interface mostra tudo em português
const clientText = c => c.includes("Computer") ? "Computador" : c.includes("Mobile") ? "Celular" : c;
const versionText = v => v === "Cracked" ? "Pirata" : v === "Paid Version" ? "Original (paga)" : v;
// ---------- Summary ----------
const summary = [
  ["Registros", fmt(total)],
  ["Usuários piratas", fmt(pirates.length)],
  ["Idade média dos piratas", meanAge.toFixed(2) + " anos"],
  ["Piratas por original", (pirates.length / paid.length).toFixed(2) + " : 1"]
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

d3.select("#dataset-count").text(`${fmt(data.length)} registros (idade ≥ ${MIN_ANALYSIS_AGE})`);

d3.select("#analysis-note").html(
  `<strong>Como os números foram calculados:</strong> são considerados ${fmt(total)} de ${fmt(raw.length)} registros do CSV, ` +
  `somente os que têm idade informada e igual ou superior a ${MIN_ANALYSIS_AGE} anos. ` +
  `${fmt(excludedUnderAge)} registros com menos de ${MIN_ANALYSIS_AGE} anos e ${fmt(excludedWithoutAge)} sem idade válida ` +
  `ficam fora de todas as análises. A tabela e a exportação seguem o mesmo filtro.`
);

const leadingPlatform = pcPirates.length >= mobilePirates.length
  ? { name: "computador", count: pcPirates.length }
  : { name: "celular", count: mobilePirates.length };

d3.select("#conclusion-text").text(
  `Nesta amostra, ${fmt(pirates.length)} de ${fmt(total)} registros (${pct(piratePct)}%) estão classificados como piratas. ` +
  `Entre eles, a plataforma mais frequente é ${leadingPlatform.name} (${fmt(leadingPlatform.count)} de ${fmt(pirates.length)}, ` +
  `${pct(leadingPlatform.count / pirates.length * 100)}%). A idade média dos piratas com idade ≥ ${MIN_ANALYSIS_AGE} anos é ${meanAge.toFixed(2)} anos, ` +
  `e há ${(pirates.length / paid.length).toFixed(2)} usuários piratas para cada original. ` +
  `Esses resultados descrevem somente o CSV e não demonstram causalidade nem representam necessariamente todos os jogadores.`
);

const datasetBody = d3.select("#dataset-rows");
const datasetSearch = d3.select("#dataset-search");
const platformFilter = d3.select("#platform-filter");
const versionFilter = d3.select("#version-filter");
const pageSizeSelect = d3.select("#page-size");
let currentPage = 1;

function getFilteredRows() {
  const query = datasetSearch.property("value").trim().toLocaleLowerCase("pt-BR");
  const platform = platformFilter.property("value");
  const version = versionFilter.property("value");

  return data.filter(d => {
    const matchesPlatform = !platform || d.client.includes(platform);
    const matchesVersion = !version || d.version === version;
    const searchable = [
      d.row,
      Number.isFinite(d.age) ? d.age : "não informada",
      clientText(d.client),
      versionText(d.version)
    ].join(" ").toLocaleLowerCase("pt-BR");

    return matchesPlatform && matchesVersion && (!query || searchable.includes(query));
  });
}

function updateDataset() {
  const filteredRows = getFilteredRows();
  const pageSize = +pageSizeSelect.property("value");
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  currentPage = Math.min(currentPage, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(start, start + pageSize);

  const tableRows = datasetBody.selectAll("tr")
    .data(pageRows, d => d.row)
    .join(
      enter => {
        const row = enter.append("tr");
        row.append("th").attr("scope", "row").attr("class", "row-number");
        row.append("td").attr("class", "row-age");
        row.append("td").attr("class", "row-platform");
        row.append("td").attr("class", "row-version");
        return row;
      }
    );

  tableRows.select(".row-number").text(d => fmt(d.row));
  tableRows.select(".row-age").text(d => Number.isFinite(d.age) ? d.age : "Não informada");
  tableRows.select(".row-platform").text(d => clientText(d.client));
  tableRows.select(".row-version").text(d => versionText(d.version));

  const shownFrom = filteredRows.length ? start + 1 : 0;
  const shownTo = Math.min(start + pageSize, filteredRows.length);
  d3.select("#dataset-results").text(
    `Exibindo ${fmt(shownFrom)}–${fmt(shownTo)} de ${fmt(filteredRows.length)} resultados; ` +
    `${fmt(data.length)} registros analisados (idade ≥ ${MIN_ANALYSIS_AGE}).`
  );
  d3.select("#dataset-page").text(`Página ${currentPage} de ${pageCount}`);
  d3.select("#dataset-prev").property("disabled", currentPage <= 1);
  d3.select("#dataset-next").property("disabled", currentPage >= pageCount);
  d3.select("#dataset-download").property("disabled", filteredRows.length === 0);
}

function resetDatasetPage() {
  currentPage = 1;
  updateDataset();
}

datasetSearch.on("input", resetDatasetPage);
platformFilter.on("change", resetDatasetPage);
versionFilter.on("change", resetDatasetPage);
pageSizeSelect.on("change", resetDatasetPage);
d3.select("#dataset-prev").on("click", () => {
  currentPage -= 1;
  updateDataset();
});
d3.select("#dataset-next").on("click", () => {
  currentPage += 1;
  updateDataset();
});
d3.select("#dataset-reset").on("click", () => {
  datasetSearch.property("value", "");
  platformFilter.property("value", "");
  versionFilter.property("value", "");
  pageSizeSelect.property("value", "25");
  resetDatasetPage();
});
d3.select("#dataset-download").on("click", () => {
  const rows = getFilteredRows().map(d => ({
    "Registro": d.row,
    "Idade": Number.isFinite(d.age) ? d.age : "Não informada",
    "Plataforma": clientText(d.client),
    "Versão": versionText(d.version)
  }));
  const csv = d3.csvFormat(rows, ["Registro", "Idade", "Plataforma", "Versão"]);
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "minecraft-dataset-filtrado.csv";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
updateDataset();

d3.select("#age-insight").html(
  `<strong>Média encontrada:</strong> ${meanAge.toFixed(2)} anos.
   A média foi calculada sobre os ${fmt(pirates.length)}
   registros <strong>piratas</strong> analisados, todos com idade ≥ ${MIN_ANALYSIS_AGE} anos.`
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

// ---------- 01. Pictogram ----------
function drawPlatformChart() {
  const el = document.querySelector("#platform-chart");
  const width = Math.max(600, el.clientWidth);
  const height = 250;
  const unit = 50;
  const labelWidth = 190;
  const iconStep = 30;
  const columns = Math.max(1, Math.floor((width - labelWidth - 32) / iconStep));

  const svg = d3.select(el).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const groups = [
    { name: "Computador", value: pcPirates.length, color: "var(--accent)" },
    { name: "Celular", value: mobilePirates.length, color: "var(--mobile)" }
  ];

  const category = svg.selectAll(".platform-category")
    .data(groups)
    .join("g")
    .attr("class", "platform-category")
    .attr("transform", (_, i) => `translate(18,${42 + i * 100})`);

  category.append("text")
    .attr("class", "platform-label")
    .attr("x", 0)
    .attr("y", 12)
    .attr("text-anchor", "start")
    .text(d => d.name);

  category.append("text")
    .attr("class", "platform-count")
    .attr("x", 0)
    .attr("y", 40)
    .attr("text-anchor", "start")
    .text(d => `${fmt(d.value)} usuários · ${pct(d.value / pirates.length * 100)}%`);

  category.each(function(d) {
    const iconCount = Math.round(d.value / unit);
    const icons = d3.select(this).append("g")
      .attr("class", "pictogram-icons")
      .attr("transform", `translate(${labelWidth},0)`)
      .selectAll(".pictogram-person")
      .data(d3.range(iconCount))
      .join("g")
      .attr("class", "pictogram-person")
      .attr("transform", i => `translate(${(i % columns) * iconStep},${Math.floor(i / columns) * 34})`)
      .attr("fill", d.color)
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5);

    icons.append("rect").attr("x", 7).attr("y", 0).attr("width", 10).attr("height", 10);
    icons.append("rect").attr("x", 5).attr("y", 11).attr("width", 14).attr("height", 11);
    icons.append("rect").attr("x", 1).attr("y", 12).attr("width", 4).attr("height", 9);
    icons.append("rect").attr("x", 19).attr("y", 12).attr("width", 4).attr("height", 9);
    icons.append("rect").attr("x", 6).attr("y", 23).attr("width", 5).attr("height", 9);
    icons.append("rect").attr("x", 13).attr("y", 23).attr("width", 5).attr("height", 9);
  });
}

// ---------- 02. Beeswarm / Dot Plot ----------
function drawAgeChart() {
  const el = document.querySelector("#age-chart");
  const width = Math.max(600, el.clientWidth);
  const margin = { top: 50, right: 30, bottom: 95, left: 30 };
  const r = 3.8;
  const verticalScale = 1.3;

  // Cópias para a simulação não alterarem os dados originais
  const nodes = pirates.map(d => ({ ...d }));

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
    .attr("viewBox", `0 0 ${width} ${height * verticalScale}`);
  const chart = svg.append("g")
    .attr("transform", `scale(1,${verticalScale})`);

  chart.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(x.ticks(20))
    .join("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", margin.top - 10)
    .attr("y2", axisY);

  chart.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${axisY})`)
    .call(d3.axisBottom(x).ticks(20).tickFormat(d3.format("d")));

  chart.append("text")
    .attr("x", width / 2)
    .attr("y", axisY + 50)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--muted)")
    .text("Idade (anos)");

  chart.append("line")
    .attr("class", "mean-line")
    .attr("x1", x(meanAge))
    .attr("x2", x(meanAge))
    .attr("y1", margin.top - 10)
    .attr("y2", axisY);

  chart.append("text")
    .attr("class", "mean-label")
    .attr("x", x(meanAge) + 8)
    .attr("y", margin.top - 16)
    .text(`Média: ${meanAge.toFixed(2)} anos`);

  chart.selectAll(".age-dot")
    .data(nodes)
    .join("circle")
    .attr("class", "age-dot")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y + dy)
    .attr("r", r)
    .attr("fill", d => d.client.includes("Computer") ? "var(--accent)" : "var(--mobile)")
    .attr("fill-opacity", .75)
    .attr("stroke", "#000")
    .attr("stroke-width", .8)
    .on("mousemove", (event, d) => {
      showTooltip(event, `<strong>Idade:</strong> ${d.age} anos<br>${clientText(d.client)}`);
    })
    .on("mouseleave", hideTooltip);
}

// ---------- 03. Waffle / Dot Matrix ----------
function drawVersionChart() {
  const el = document.querySelector("#version-chart");
  const width = Math.max(600, el.clientWidth);

  const byIncreasingAge = rows => [...rows].sort((a, b) => a.age - b.age || a.row - b.row);
  const ordered = [...byIncreasingAge(pirates), ...byIncreasingAge(paid)];

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
        `<strong>${versionText(d.version)}</strong><br>
         Plataforma: ${clientText(d.client)}<br>
         Idade: ${d.age} anos`
      );
    })
    .on("mouseleave", hideTooltip);

  // Cracked vem primeiro (canto superior esquerdo) → rótulo à esquerda
  svg.append("image")
    .attr("href", "assets/creeper.webp")
    .attr("x", side).attr("y", 10)
    .attr("width", 34).attr("height", 34);

  svg.append("text")
    .attr("x", side + 44)
    .attr("y", 34)
    .attr("fill", "var(--danger)")
    .text(`PIRATAS — ${fmt(pirates.length)} (${pct(piratePct)}%)`);

  // Paid Version ocupa o restante da matriz → rótulo à direita
  svg.append("image")
    .attr("href", "assets/diamond.png")
    .attr("x", width - side - 34).attr("y", 10)
    .attr("width", 34).attr("height", 34);

  svg.append("text")
    .attr("x", width - side - 44)
    .attr("y", 34)
    .attr("text-anchor", "end")
    .attr("fill", "var(--accent-2)")
    .text(`ORIGINAIS — ${fmt(paid.length)} (${pct(paidPct)}%)`);

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", top + matrixHeight + 32)
    .attr("text-anchor", "middle")
    .attr("fill", "var(--muted)")
    .text(`${fmt(total)} registros — 1 quadrado = 1 usuário — primeiro piratas, depois originais`);
}

drawPlatformChart();
drawAgeChart();
drawVersionChart();

// ---------- Carrossel de imagens ----------
const carouselImages = [
  { src: "assets/youtubePirata1.png", alt: "Imagem 1 de 4 sobre pirataria no Minecraft" },
  { src: "assets/youtubePirata2.png", alt: "Imagem 2 de 4 sobre pirataria no Minecraft" },
  { src: "assets/youtubepirata3.png", alt: "Imagem 3 de 4 sobre pirataria no Minecraft" },
  { src: "assets/youtubepirata4.png", alt: "Imagem 4 de 4 sobre pirataria no Minecraft" }
];
const carouselImage = d3.select("#carousel-image");
const carouselStatus = d3.select("#carousel-status");
const imageDialog = document.querySelector("#image-dialog");
let activeSlide = 0;

function showSlide(index) {
  activeSlide = (index + carouselImages.length) % carouselImages.length;
  const image = carouselImages[activeSlide];
  carouselImage.attr("src", image.src).attr("alt", image.alt);
  carouselStatus.text(`Imagem ${activeSlide + 1} de ${carouselImages.length}`);
  d3.selectAll(".carousel-thumbnails button")
    .attr("aria-current", (_, i) => i === activeSlide ? "true" : null);
}

d3.select("#carousel-prev").on("click", () => showSlide(activeSlide - 1));
d3.select("#carousel-next").on("click", () => showSlide(activeSlide + 1));
d3.selectAll(".carousel-thumbnails button").on("click", function() {
  showSlide(+this.dataset.slide);
});

d3.select("#carousel-zoom").on("click", () => {
  d3.select("#dialog-image")
    .attr("src", carouselImages[activeSlide].src)
    .attr("alt", carouselImages[activeSlide].alt);
  imageDialog.showModal();
});
d3.select("#image-dialog-close").on("click", () => imageDialog.close());
imageDialog.addEventListener("click", event => {
  if (event.target === imageDialog) imageDialog.close();
});

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.setInterval(() => {
    if (!imageDialog.open && document.visibilityState === "visible") showSlide(activeSlide + 1);
  }, 5000);
}