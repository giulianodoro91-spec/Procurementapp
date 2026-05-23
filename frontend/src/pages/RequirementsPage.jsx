import { useEffect, useState } from "react";

const API = "/api";

function RequirementsPage() {
  const [reqs, setReqs] = useState([]);

  useEffect(() => {
    fetch(`${API}/requirements`)
      .then((r) => r.json())
      .then(setReqs);
  }, []);

  const rawMaterials = reqs.filter((r) =>
    String(r.ingredientCode ?? "").toUpperCase().startsWith("S")
  );

  const packagingItems = reqs.filter(
    (r) => !String(r.ingredientCode ?? "").toUpperCase().startsWith("S")
  );

  const copyToClipboard = async () => {
    if (!reqs.length) {
      alert("No requirements to copy");
      return;
    }

    const header = ["Ingredient", "Quantity", "Unit"];
    const rows = reqs.map((r) => [r.name, r.quantity, r.unit]);

    const text = [header, ...rows].map((row) => row.join("\t")).join("\n");

    await navigator.clipboard.writeText(text);

    alert("Purchase requirements copied to clipboard");
  };

  const exportToExcel = () => {
    if (!reqs.length) {
      alert("No requirements to export");
      return;
    }

    const header = ["Ingredient", "Quantity", "Unit"];
    const rows = reqs.map((r) => [r.name, r.quantity, r.unit]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "purchase_requirements.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Purchase Requirements</h2>
          <p className="page-description">
            See the ingredient quantities you need to order based on forecasted
            production.
          </p>
        </div>

        <div className="page-actions">
          <button className="button-secondary" onClick={copyToClipboard}>Copy to Clipboard</button>
          <button className="button-primary" onClick={exportToExcel}>Export to Excel</button>
        </div>
      </div>

      <div className="table-wrap">
        <h3>Raw Materials</h3>

        <table className="data-table requirements-table">
          <thead>
  <tr>
    <th>Code</th>
    <th>Ingredient</th>
    <th>Required Qty</th>
    <th>Base Unit</th>
    <th>Purchase Qty</th>
    <th>Purchase Unit</th>
  </tr>
</thead>

<tbody>
  {rawMaterials.map((r) => {
    const purchaseQty =
      r.conversionFactor && r.conversionFactor !== 0
        ? r.quantity / r.conversionFactor
        : r.quantity;

    return (
      <tr key={r.ingredientId}>
        <td>{r.ingredientCode}</td>
        <td>{r.name}</td>

        <td>{Number(r.quantity).toFixed(1)}</td>

        <td>{r.baseUnit ?? r.unit}</td>

        <td>{Number(purchaseQty).toFixed(1)}</td>

        <td>{r.purchaseUnit}</td>
      </tr>
    );
  })}
</tbody>
        </table>

        <h3>Packaging</h3>

        <table className="data-table requirements-table">
<thead>
  <tr>
    <th>Code</th>
    <th>Ingredient</th>
    <th>Required Qty</th>
    <th>Base Unit</th>
    <th>Purchase Qty</th>
    <th>Purchase Unit</th>
  </tr>
</thead>

<tbody>
  {packagingItems.map((r) => {
    const purchaseQty =
      r.conversionFactor && r.conversionFactor !== 0
        ? r.quantity / r.conversionFactor
        : r.quantity;

    return (
      <tr key={r.ingredientId}>
        <td>{r.ingredientCode}</td>
        <td>{r.name}</td>

        <td>{Number(r.quantity).toFixed(1)}</td>

        <td>{r.baseUnit ?? r.unit}</td>

        <td>{Number(purchaseQty).toFixed(1)}</td>

        <td>{r.purchaseUnit}</td>
      </tr>
    );
  })}
</tbody>
        </table>
      </div>
    </section>
  );
}

export default RequirementsPage;