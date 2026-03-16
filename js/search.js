(() => {
  const CSV_PATH = "js/data/matrimoni.csv";
  let dataset = [];

  function normalizeStr(s) {
    if (!s) return "";
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function fuzzyMatch(field, query) {
    if (!query) return true;
    if (!field) return false;
    return normalizeStr(field).includes(normalizeStr(query));
  }

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];
      if (ch === '"') {
        if (inQuotes && next === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (ch === ',' && !inQuotes) {
        row.push(cur);
        cur = "";
        continue;
      }
      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (cur || row.length) {
          row.push(cur);
          rows.push(row);
          row = [];
          cur = "";
        }
        if (ch === '\r' && next === '\n') i++;
        continue;
      }
      cur += ch;
    }
    if (cur || row.length) row.push(cur), rows.push(row);
    return rows.filter(r => r.some(c => c !== ""));
  }

  async function loadCSV() {
    try {
      const res = await fetch(CSV_PATH);
      if (!res.ok) throw new Error("CSV load failed: " + res.status);
      const text = await res.text();
      const rows = parseCSV(text);
      if (rows.length < 2) { alert("CSV vuoto o solo header"); return; }
      const headers = rows[0].map(h => h.trim());
      dataset = rows.slice(1).map((r, idx) => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = r[i] ? r[i].trim() : "");
        obj._id = idx;
        return obj;
      });
      alert(`CSV caricato: ${dataset.length} record`);
    } catch (err) {
      alert("Errore caricamento CSV: " + err.message);
    }
  }

  function readFilters() {
    const form = document.getElementById("searchForm");
    const fd = new FormData(form);
    const filters = {};
    for (const [k, v] of fd.entries()) {
      if (v && v.trim() !== "") filters[k] = v.trim();
    }
    alert("Filtri letti: " + JSON.stringify(filters));
    return filters;
  }

  function matchesRecord(record, filters) {
    for (const key in filters) {
      if (!record[key] || !fuzzyMatch(record[key], filters[key])) return false;
    }
    return true;
  }

  function renderResults(results) {
    const container = document.getElementById("results-container");
    const count = document.getElementById("results-count");
    container.innerHTML = "";
    count.textContent = `${results.length} risultati`;

    if (!results.length) return;

    const table = document.createElement("table");
    table.className = "results-table";

    // Header
    const header = table.createTHead();
    const hRow = header.insertRow();
    ["Data", "Sposo", "Sposa"].forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      hRow.appendChild(th);
    });

    // Body
    const tbody = table.createTBody();
    results.forEach(r => {
      const tr = tbody.insertRow();
      const sposo = `${r["Sposo primo nome/i"]} ${r["Sposo cognome"]}`;
      const sposa = `${r["Sposa primo nome/i"]} ${r["Sposa cognome"]}`;

      [r["Data"], sposo, sposa].forEach(text => {
        const td = tr.insertCell();
        td.textContent = text;
      });

      tr.addEventListener("click", () => {
        window.location.href = `record.html?id=${r._id}`;
      });
    });

    container.appendChild(table);
  }

  function init() {
    loadCSV();

    const form = document.getElementById("searchForm");
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const filters = readFilters();
      const results = dataset.filter(r => matchesRecord(r, filters));
      renderResults(results);
    });
  }

  init();
})();