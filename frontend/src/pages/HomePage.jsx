function HomePage({ setPage }) {
  return (
    <section className="home-grid">
      <button
        className="module-tile"
        onClick={() => setPage("planning")}
      >
        <h2>Planning</h2>

        <p>
          BOM import, forecast planning and purchase requirements.
        </p>
      </button>

      <button
        className="module-tile"
        onClick={() => setPage("purchasing")}
      >
        <h2>Purchasing</h2>

        <p>
          Suppliers, purchase orders and order tracking.
        </p>
      </button>
    </section>
  );
}

export default HomePage;