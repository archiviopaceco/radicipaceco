(() => {
  const CSV_PATH = "js/data/matrimoni.csv";

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

  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  async function loadRecord(id) {
    try {
      const res = await fetch(CSV_PATH);
      if (!res.ok) throw new Error("CSV load failed: " + res.status);
      const text = await res.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("CSV vuoto o solo header");

      const headers = rows[0].map(h => h.trim());
      const dataset = rows.slice(1).map((r, idx) => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = r[i] ? r[i].trim() : "");
        obj._id = idx.toString();
        return obj;
      });

      const record = dataset.find(r => r._id === id);
      if (!record) {
        document.getElementById("record-details").innerHTML = `<p>Nessun record trovato per ID ${id}</p>`;
        return;
      }

      renderRecord(record);

    } catch (err) {
      document.getElementById("record-details").innerHTML = `<p>Errore caricamento record: ${err.message}</p>`;
    }
  }

  function renderRecord(record) {
    const container = document.getElementById("record-details");
    container.innerHTML = "";

    for (const key in record) {
      if (key === "_id") continue; // skip internal id
      const div = document.createElement("div");
      div.className = "record-field";
      div.innerHTML = `<span class="record-label">${key}:</span> ${record[key]}`;
      container.appendChild(div);
    }
  }

  const recordId = getQueryParam("id");
  if (recordId !== null) {
    loadRecord(recordId);
  } else {
    document.getElementById("record-details").innerHTML = "<p>ID record non specificato.</p>";
  }
})();