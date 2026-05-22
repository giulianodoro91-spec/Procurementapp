import { useEffect, useState } from "react";

const API = "/api";

function ForecastPage({ rows, setRows }) {
  const [products, setProducts] = useState([]);
  const [activeSuggestion, setActiveSuggestion] = useState({
    row: null,
    index: -1,
  });

  useEffect(() => {
    fetch(`${API}/products`)
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  const updateRow = (i, key, val) => {
    const copy = [...rows];

    copy[i] = {
      ...copy[i],
      [key]: val,
    };

    if (key === "productName") {
      copy[i].productId = "";
      setActiveSuggestion({ row: i, index: 0 });
    }

    setRows(copy);
  };

  const chooseProduct = (i, product) => {
    const copy = [...rows];

    copy[i] = {
      ...copy[i],
      productId: String(product.id),
      productName: product.name,
    };

    setRows(copy);
    setActiveSuggestion({ row: null, index: -1 });
  };

  const visibleProducts = (search) => {
    if (!search?.trim()) return [];

    const term = search.trim().toLowerCase();

    return products
      .filter((p) => p.name.toLowerCase().includes(term))
      .slice(0, 8);
  };

  const handleKeyDown = (event, i, suggestions) => {
    if (!suggestions.length) return;

    const { key } = event;

    if (key === "ArrowDown") {
      event.preventDefault();

      const next =
        activeSuggestion.row === i
          ? Math.min(activeSuggestion.index + 1, suggestions.length - 1)
          : 0;

      setActiveSuggestion({ row: i, index: next });
    } else if (key === "ArrowUp") {
      event.preventDefault();

      if (activeSuggestion.row !== i) return;

      const prev = Math.max(activeSuggestion.index - 1, 0);

      setActiveSuggestion({ row: i, index: prev });
    } else if (key === "Enter") {
      if (activeSuggestion.row === i && activeSuggestion.index >= 0) {
        event.preventDefault();
        chooseProduct(i, suggestions[activeSuggestion.index]);
      }
    } else if (key === "Escape") {
      setActiveSuggestion({ row: null, index: -1 });
    }
  };

  const addRow = () =>
    setRows((r) => [...r, { productId: "", productName: "", quantity: "" }]);

  const clearForecast = () =>
    setRows([{ productId: "", productName: "", quantity: "" }]);

  const save = async () => {
    const payload = rows.map((r) => ({
      productId: Number(r.productId),
      quantity: Number(r.quantity),
    }));

    const res = await fetch(`${API}/forecast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.text();
      alert(`Error saving forecast: ${error}`);
      return;
    }

    alert("Saved");
  };

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Production Forecast</h2>
          <p className="page-description">
            Select products and estimated quantities to generate purchase
            requirements.
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => {
              const suggestions = visibleProducts(r.productName);

              return (
                <tr key={i}>
                  <td>
                    <div className="product-search">
                      <input
                        value={r.productName}
                        onChange={(e) =>
                          updateRow(i, "productName", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, i, suggestions)}
                        placeholder="Type product name"
                        autoComplete="off"
                      />

                      {suggestions.length > 0 && r.productName && !r.productId && (
                        <ul className="suggestions">
                          {suggestions.map((product, index) => (
                            <li
                              key={product.id}
                              onClick={() => chooseProduct(i, product)}
                              className={
                                activeSuggestion.row === i &&
                                activeSuggestion.index === index
                                  ? "active"
                                  : ""
                              }
                            >
                              {product.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </td>

                  <td>
                    <input
                      value={r.quantity}
                      onChange={(e) =>
                        updateRow(i, "quantity", e.target.value)
                      }
                      type="number"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="page-actions">
          <button className="button-secondary" onClick={addRow}>Add row</button>
          <button className="button-primary" onClick={save}>Save forecast</button>
          <button className="button-danger" onClick={clearForecast}>
            Clear forecast
          </button>
        </div>
      </div>
    </section>
  );
}

export default ForecastPage;