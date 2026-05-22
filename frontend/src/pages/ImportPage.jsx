import { useState } from "react";

const API = "/api";

function ImportTable({ rows }) {
  if (!rows?.length) return null;

  const allKeys = rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set());

  const headers = Array.from(allKeys);

  return (
    <table className="data-table">
      <thead>
        <tr>{headers.map((key) => <th key={key}>{key}</th>)}</tr>
      </thead>

      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {headers.map((key) => (
              <td key={key}>{row[key] ?? ""}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ImportPage() {
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("Uploading...");
    setError("");
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API}/bom/upload`, {
        method: "POST",
        body: fd,
      });

      const text = await res.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Invalid JSON response: ${text}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `${res.status} ${res.statusText}`);
      }

      setResult(data);
      setStatus(
        `Imported ${data.imported?.length ?? 0} row(s). Skipped ${
          data.skipped?.length ?? 0
        }.`
      );
    } catch (err) {
      setError(err.message);
      setStatus("Upload failed");
    }
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Import BOM</h2>
          <p className="page-description">
            Upload an Excel BOM file and load it into the database.
          </p>
        </div>
      </div>

      <div className="page-actions">
        <label className="file-input">
          <span>Select Excel file</span>
          <input type="file" accept=".xls,.xlsx" onChange={handleFile} />
        </label>

        <div className="status-text">{status}</div>
      </div>

      {error && <div className="error-card">{error}</div>}

      {result && (
        <div>
          <p>Parsed rows: {result.parsed}</p>
          <p>Imported: {result.imported?.length ?? 0}</p>
          <p>Skipped: {result.skipped?.length ?? 0}</p>

          {result.imported?.length > 0 && (
            <div>
              <h3>Imported rows</h3>
              <ImportTable rows={result.imported} />
            </div>
          )}

          {result.skipped?.length > 0 && (
            <div>
              <h3>Skipped rows</h3>
              <ImportTable rows={result.skipped} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ImportPage;