import { useEffect, useState } from "react";

const API = "/api";

function PurchaseOrdersPage() {
  const [ingredients, setIngredients] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplierId: "",
    orderDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [selectedPo, setSelectedPo] = useState(null);
    const [poLines, setPoLines] = useState([]);
const [lineForm, setLineForm] = useState({
  ingredientId: "",
  quantity: "",
  unitPrice: "",
});

const loadIngredients = async () => {
  const res = await fetch(`${API}/ingredients`);
  const data = await res.json();
  setIngredients(data);
};

  const loadPurchaseOrders = async () => {
    const res = await fetch(`${API}/purchase-orders`);
    const data = await res.json();
    setPurchaseOrders(data);
  };

  const loadSuppliers = async () => {
    const res = await fetch(`${API}/suppliers`);
    const data = await res.json();
    setSuppliers(data);
  };

  useEffect(() => {
    loadPurchaseOrders();
    loadSuppliers();
    loadIngredients();
  }, []);

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      supplierId: "",
      orderDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  };

  const createPurchaseOrder = async () => {
    if (!form.supplierId) {
      alert("Supplier is required");
      return;
    }

    if (!form.orderDate) {
      alert("Order date is required");
      return;
    }

    const res = await fetch(`${API}/purchase-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const error = await res.text();
      alert(`Error creating purchase order: ${error}`);
      return;
    }

    resetForm();
    setShowForm(false);
    await loadPurchaseOrders();
  };

  const loadPoLines = async (po) => {
  setSelectedPo(po);

  const res = await fetch(`${API}/purchase-orders/${po.id}/lines`);
  const data = await res.json();

  setPoLines(data);
};

const updateLineForm = (key, value) => {
  setLineForm((current) => ({
    ...current,
    [key]: value,
  }));
};

const resetLineForm = () => {
  setLineForm({
    ingredientId: "",
    quantity: "",
    unitPrice: "",
  });
};

const addLine = async () => {
  if (!selectedPo) return;

if (!lineForm.ingredientId) {
  alert("Ingredient is required");
  return;
}

  if (!lineForm.quantity || Number(lineForm.quantity) <= 0) {
    alert("Quantity must be greater than zero");
    return;
  }

  const res = await fetch(`${API}/purchase-orders/${selectedPo.id}/lines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lineForm),
  });

  if (!res.ok) {
    const error = await res.text();
    alert(`Error adding line: ${error}`);
    return;
  }

  resetLineForm();
  await loadPoLines(selectedPo);
  await loadPurchaseOrders();
};

const deleteLine = async (line) => {
  if (!window.confirm(`Delete line "${line.itemName}"?`)) return;

  const res = await fetch(`${API}/purchase-order-lines/${line.id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.text();
    alert(`Error deleting line: ${error}`);
    return;
  }

  await loadPoLines(selectedPo);
  await loadPurchaseOrders();
};

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Purchase Orders</h2>
          <p className="page-description">
            Create and manage purchase orders for suppliers.
          </p>
        </div>
      </div>

      <div className="section-toolbar">
        <button
          className="button-primary"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
        New Purchase Order
        </button>
      </div>

      {showForm && (
        <>
          <h3 className="section-title">New Purchase Order</h3>

          <div className="form-grid">
            <select
              value={form.supplierId}
              onChange={(e) => updateForm("supplierId", e.target.value)}
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.supplierName}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={form.orderDate}
              onChange={(e) => updateForm("orderDate", e.target.value)}
            />

            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
            />
          </div>

          <div className="page-actions">
            <button className="button-primary" onClick={createPurchaseOrder}>
              Save Purchase Order
            </button>

            <button
              className="button-secondary"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      <h3 className="section-title">Purchase Order List</h3>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Supplier</th>
              <th>Order Date</th>
              <th>Status</th>
              <th>Total</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {purchaseOrders.map((po) => (
              <tr key={po.id}>
                <td>{po.poNumber}</td>
                <td>{po.supplierName}</td>
                <td>{po.orderDate}</td>
                <td>{po.status}</td>
                <td>{Number(po.total || 0).toFixed(2)}</td>
                <td>{po.notes}</td>
                <td>
  <button className="small-button edit" onClick={() => loadPoLines(po)}>
    Open
  </button>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedPo && (
  <section className="page-card" style={{ marginTop: "24px" }}>
    <div className="page-header">
      <div>
        <h2>{selectedPo.poNumber}</h2>
        <p className="page-description">
          Supplier: {selectedPo.supplierName} | Status: {selectedPo.status}
        </p>
      </div>
    </div>

    <h3 className="section-title">Add Line</h3>

    <div className="form-grid">
<select
  value={lineForm.ingredientId}
  onChange={(e) => updateLineForm("ingredientId", e.target.value)}
>
  <option value="">Select ingredient</option>

  {ingredients.map((ingredient) => (
    <option key={ingredient.id} value={ingredient.id}>
      {ingredient.code} - {ingredient.name} ({ingredient.unit})
    </option>
  ))}
</select>

<input
  type="number"
  placeholder="Quantity *"
  value={lineForm.quantity}
  onChange={(e) => updateLineForm("quantity", e.target.value)}
/>

<input
  type="number"
  placeholder="Unit Price"
  value={lineForm.unitPrice}
  onChange={(e) => updateLineForm("unitPrice", e.target.value)}
/>
    </div>

    <div className="page-actions">
      <button className="button-primary" onClick={addLine}>
        Add Row
      </button>

      <button className="button-secondary" onClick={resetLineForm}>
        Clear
      </button>
    </div>

    <h3 className="section-title">Lines</h3>

    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Unit Price</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {poLines.map((line) => (
            <tr key={line.id}>
              <td>{line.itemCode}</td>
              <td>{line.itemName}</td>
              <td>{line.quantity}</td>
              <td>{line.unit}</td>
              <td>{Number(line.unitPrice || 0).toFixed(2)}</td>
              <td>{Number(line.lineTotal || 0).toFixed(2)}</td>
              <td>
                <button
                  className="small-button danger"
                  onClick={() => deleteLine(line)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
)}
    </section>
  );
}

export default PurchaseOrdersPage;