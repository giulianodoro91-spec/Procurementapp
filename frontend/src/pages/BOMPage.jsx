import { useEffect, useState } from "react";

const API = "/api";

function BOMPage() {
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBom = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/bom`);
      const data = await res.json();
      setRows(data);
    } catch (err) {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBom();
  }, []);

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>BOM Database</h2>
          <p className="page-description">
            Preview the current BOM rows stored in the database.
          </p>
        </div>
      </div>

      <div className="page-actions">
        <button onClick={fetchBom}>Refresh</button>

        <button
          className="secondary"
          onClick={async () => {
            if (!window.confirm("Clear BOM rows? This cannot be undone.")) return;

            try {
              const res = await fetch(`${API}/bom/clear`, { method: "POST" });
              if (!res.ok) throw new Error(await res.text());
              await fetchBom();
            } catch (err) {
              alert("Error clearing BOM: " + err.message);
            }
          }}
        >
          Clear BOM
        </button>

        <button
          className="danger"
          onClick={async () => {
            if (
              !window.confirm(
                "Clear entire DB (products, ingredients, forecast, BOM)? This is destructive."
              )
            )
              return;

            try {
              const res = await fetch(`${API}/bom/clear?full=true`, {
                method: "POST",
              });

              if (!res.ok) throw new Error(await res.text());

              await fetchBom();
            } catch (err) {
              alert("Error clearing DB: " + err.message);
            }
          }}
        >
          Clear All Data
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {!loading &&
        rows &&
        (rows.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>productCode</th>
                <th>productName</th>
                <th>ingredientCode</th>
                <th>ingredientName</th>
                <th>quantity</th>
                <th>unit</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td>{row.productCode}</td>
                  <td>{row.productName}</td>
                  <td>{row.ingredientCode}</td>
                  <td>{row.ingredientName}</td>
                  <td>{row.quantity}</td>
                  <td>{row.ingredientUnit ?? row.unit ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No BOM rows found</div>
        ))}
    </section>
  );
}

export default BOMPage;