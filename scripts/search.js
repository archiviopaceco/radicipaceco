// search.js - full-featured Paceco marriages search

// Global dataset
let marriages = [];

// Load CSV on page load
async function loadCSV(url) {
    const response = await fetch(url);
    const text = await response.text();
    marriages = csvToObjects(text);
    console.log("Loaded", marriages.length, "records");
}

// Convert CSV text to objects
function csvToObjects(csvText) {
    const lines = csvText.split("\n").filter(l => l.trim() !== "");
    const headers = lines[0].split(",").map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(",");
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] ? values[i].trim() : "";
        });
        return obj;
    });
}

// Main search function
function searchMarriages(filters) {
    // filters: object containing any combination of fields
    return marriages.filter(m => {
        for (let key in filters) {
            if (!filters[key]) continue; // skip empty filters

            const value = filters[key].toString().toLowerCase();

            // Special handling for dates
            if (key === "yearFrom" || key === "yearTo") continue;
            if (key === "Data") {
                const year = parseInt(m["Data"].split("-")[0]) || null;
                if (filters.yearFrom && year < filters.yearFrom) return false;
                if (filters.yearTo && year > filters.yearTo) return false;
                continue;
            }

            // Match if the field exists in the CSV
            if (!m[key]) continue;

            // Simple substring match, case-insensitive
            if (!m[key].toLowerCase().includes(value)) return false;
        }
        return true;
    });
}

// Render results table
function renderResults(results, containerId = "results") {
    const container = document.getElementById(containerId);
    container.innerHTML = ""; // clear old results

    if (!results.length) {
        container.innerHTML = "<p>No matches found.</p>";
        return;
    }

    const table = document.createElement("table");
    table.classList.add("results-table");

    // Define columns to show in table
    const columns = [
        {header:"Date", key:"Data"},
        {header:"Groom", key:"Sposo primo nome/i", key2:"Sposo cognome"},
        {header:"Bride", key:"Sposa primo nome/i", key2:"Sposa cognome"},
        {header:"Groom Father", key:"Padre Sposo primo nome/i", key2:"Cognome Padre Sposo"},
        {header:"Bride Father", key:"Padre Sposa primo nome/i", key2:"Cognome Padre Sposa"},
        {header:"Location", key:"Luogo di Matrimonio Genitori Sposo"},
        {header:"Source/Page", key:"Registro URL", key2:"Pagina/e"},
        {header:"Comment", key:"Commenti"}
    ];

    // Header row
    const headerRow = document.createElement("tr");
    columns.forEach(c => {
        const th = document.createElement("th");
        th.textContent = c.header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Rows
    results.forEach(m => {
        const row = document.createElement("tr");
        columns.forEach(c => {
            const td = document.createElement("td");
            if (c.key2) td.textContent = `${m[c.key] || ""} ${m[c.key2] || ""}`.trim();
            else td.textContent = m[c.key] || "";
            row.appendChild(td);
        });
        table.appendChild(row);
    });

    container.appendChild(table);
}

// Hook search form
document.addEventListener("DOMContentLoaded", () => {
    loadCSV("data/marriages.csv");

    const form = document.getElementById("searchForm");
    form.addEventListener("submit", e => {
        e.preventDefault();
        const filters = {};

        // Collect all input fields from the form
        [...form.elements].forEach(el => {
            if (el.name) {
                filters[el.name] = el.value;
            }
        });

        // Convert year inputs to numbers
        if (filters.yearFrom) filters.yearFrom = parseInt(filters.yearFrom);
        if (filters.yearTo) filters.yearTo = parseInt(filters.yearTo);

        const results = searchMarriages(filters);
        renderResults(results);
    });
});