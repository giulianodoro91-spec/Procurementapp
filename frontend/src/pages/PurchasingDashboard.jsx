function PurchasingDashboard({ setPage }) {
  return (
    <section className="home-grid">
      <button className="module-tile" onClick={() => setPage("suppliers")}>
        <h2>Suppliers</h2>
        <p>Manage supplier master data.</p>
      </button>

      <button className="module-tile" onClick={() => setPage("purchase-orders")}>
        <h2>Purchase Orders</h2>
        <p>Create and manage purchase orders.</p>
      </button>

      <button className="module-tile" onClick={() => setPage("receipts")}>
        <h2>Receipts</h2>
        <p>Track received goods and order status.</p>
      </button>
    </section>
  );
}

export default PurchasingDashboard;