import { useEffect, useState } from "react";

const API = "/api";

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({
    supplierCode: "",
    supplierName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    notes: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadSuppliers = async () => {
    const res = await fetch(`${API}/suppliers`);
    const data = await res.json();
    setSuppliers(data);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

const saveSupplier = async () => {
  if (!form.supplierName.trim()) {
    alert("Supplier name is required");
    return;
  }

  const url = editingId
    ? `${API}/suppliers/${editingId}`
    : `${API}/suppliers`;

  const method = editingId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(form),
  });

  if (!res.ok) {
    const error = await res.text();
    alert(`Error saving supplier: ${error}`);
    return;
  }

  setForm({
    supplierCode: "",
    supplierName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    notes: "",
  });

setEditingId(null);
setShowForm(false);
await loadSuppliers();
};

const editSupplier = (supplier) => {
  setEditingId(supplier.id);
  setShowForm(true);

  setForm({
    supplierCode: supplier.supplierCode ?? "",
    supplierName: supplier.supplierName ?? "",
    contactPerson: supplier.contactPerson ?? "",
    email: supplier.email ?? "",
    phone: supplier.phone ?? "",
    address: supplier.address ?? "",
    city: supplier.city ?? "",
    country: supplier.country ?? "",
    notes: supplier.notes ?? "",
  });
};

const cancelEdit = () => {
  setEditingId(null);
  setShowForm(false);

  setForm({
    supplierCode: "",
    supplierName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    notes: "",
  });
};

const deleteSupplier = async (supplier) => {
  if (!window.confirm(`Delete supplier "${supplier.supplierName}"?`)) return;

  const res = await fetch(`${API}/suppliers/${supplier.id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.text();
    alert(`Error deleting supplier: ${error}`);
    return;
  }

  await loadSuppliers();
};

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h2>Suppliers</h2>
          <p className="page-description">
            Manage supplier master data for the purchasing module.
          </p>
        </div>
      </div>
{showForm && (
  <>
<h3 className="section-title">
  Add Supplier Form
</h3>
      <div className="form-grid">
        <input
          placeholder="Supplier Code"
          value={form.supplierCode}
          onChange={(e) => updateForm("supplierCode", e.target.value)}
        />

        <input
          placeholder="Supplier Name *"
          value={form.supplierName}
          onChange={(e) => updateForm("supplierName", e.target.value)}
        />

        <input
          placeholder="Contact Person"
          value={form.contactPerson}
          onChange={(e) => updateForm("contactPerson", e.target.value)}
        />

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => updateForm("email", e.target.value)}
        />

        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => updateForm("phone", e.target.value)}
        />

        <input
          placeholder="City"
          value={form.city}
          onChange={(e) => updateForm("city", e.target.value)}
        />

        <input
          placeholder="Country"
          value={form.country}
          onChange={(e) => updateForm("country", e.target.value)}
        />

        <input
          placeholder="Address"
          value={form.address}
          onChange={(e) => updateForm("address", e.target.value)}
        />

        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => updateForm("notes", e.target.value)}
        />
      </div>

      <div className="page-actions">
        <button className="button-primary" onClick={saveSupplier}>
  {editingId ? "Update Supplier" : "Save Supplier"}
</button>

{editingId && (
  <button className="secondary" onClick={cancelEdit}>
    Cancel Edit
  </button>
)}
      </div>
  </>
)}
<div className="section-toolbar">

  <button
    className="button-primary"
    onClick={() => {
      setEditingId(null);

      setShowForm(true);

      setForm({
        supplierCode: "",
        supplierName: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        notes: "",
      });
    }}
  >
  New Supplier
  </button>

</div>
      <h3>Supplier List</h3>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Supplier Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th>City</th>
              <th>Country</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.supplierCode}</td>
                <td>{supplier.supplierName}</td>
                <td>{supplier.contactPerson}</td>
                <td>{supplier.email}</td>
                <td>{supplier.phone}</td>
                <td>{supplier.city}</td>
                <td>{supplier.country}</td>
                <td>
  <button className="small-button edit" onClick={() => editSupplier(supplier)}>
    Edit
  </button>

  <button className="small-button danger" onClick={() => deleteSupplier(supplier)}>
    Delete
  </button>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SuppliersPage;