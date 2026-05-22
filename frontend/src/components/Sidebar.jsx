import { useState } from "react";

function Sidebar({ setPage }) {
  const [openModule, setOpenModule] = useState("Planning");

  return (
    <aside className="sidebar">
      <div className="sidebar-title">ProcurementApp</div>

      <div className="sidebar-module">
        <button
          className="module-button"
          onClick={() =>
            setOpenModule(openModule === "Planning" ? "" : "Planning")
          }
        >
          <span>Planning</span>
          <span>{openModule === "Planning" ? "▾" : "▸"}</span>
        </button>

        {openModule === "Planning" && (
          <div className="module-pages">
            <button className="sidebar-link" onClick={() => setPage("planning")}>
              Dashboard
            </button>

            <button className="sidebar-link" onClick={() => setPage("import")}>
              Import BOM
            </button>

            <button className="sidebar-link" onClick={() => setPage("forecast")}>
              Forecast
            </button>

            <button className="sidebar-link" onClick={() => setPage("requirements")}>
              Requirements
            </button>

            <button className="sidebar-link" onClick={() => setPage("bom")}>
              BOM Database
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-module">
        <button
          className="module-button"
          onClick={() =>
            setOpenModule(openModule === "Purchasing" ? "" : "Purchasing")
          }
        >
          <span>Purchasing</span>
          <span>{openModule === "Purchasing" ? "▾" : "▸"}</span>
        </button>

        {openModule === "Purchasing" && (
          <div className="module-pages">
            <button className="sidebar-link" onClick={() => setPage("purchasing")}>
              Dashboard
            </button>
            <button className="sidebar-link" onClick={() => setPage("suppliers")}>
              Suppliers
            </button>
            <button className="sidebar-link" onClick={() => setPage("purchase-orders")}>
              Purchase Orders
            </button>
            <button className="sidebar-link" onClick={() => setPage("receipts")}>
              Receipts
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;