function PlanningModulePage({ setPage }) {
  return (
    <section className="home-grid">
      <button className="module-tile" onClick={() => setPage("import")}>
        <h2>Import BOM</h2>
      </button>

      <button className="module-tile" onClick={() => setPage("forecast")}>
        <h2>Forecast</h2>
      </button>

      <button className="module-tile" onClick={() => setPage("requirements")}>
        <h2>Requirements</h2>
      </button>

      <button className="module-tile" onClick={() => setPage("bom")}>
        <h2>BOM Database</h2>
      </button>
    </section>
  );
}

export default PlanningModulePage;