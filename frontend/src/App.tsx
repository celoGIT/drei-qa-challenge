import { useState } from "react";
import MainPage from "./components/MainPage";
import LocationsPage from "./components/LocationsPage";

type Page = "create" | "locations";

export default function App() {
  const [page, setPage] = useState<Page>("create");

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ ...styles.logoWrap, cursor: "pointer" }} onClick={() => setPage("create")}>
          <div style={styles.logoTextWrap}>
            <span style={styles.logoTitle}>Drei</span>
            <span style={styles.logoSubtitle}>Location Service</span>
          </div>
        </div>

        <nav style={styles.nav}>
          <button
            style={page === "create" ? styles.navActive : styles.navItem}
            onClick={() => setPage("create")}
          >
            Map
          </button>
          <button
            style={page === "locations" ? styles.navActive : styles.navItem}
            onClick={() => setPage("locations")}
          >
            Locations
          </button>
          <a
            href="/swagger-ui/index.html"
            target="_blank"
            rel="noreferrer"
            style={styles.navItem}
          >
            API Docs ↗
          </a>
        </nav>
      </header>

      <main style={{ ...styles.main, maxWidth: page === "create" ? 1280 : 900 }}>
        {page === "create" && <MainPage />}
        {page === "locations" && <LocationsPage onNavigateCreate={() => setPage("create")} />}
      </main>

      <footer style={styles.footer}>
        Location Service Sample App. Not an official Drei product.
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    background: "#fff",
    color: "#000",
    padding: "0.75rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  logoTextWrap: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.1,
  },
  logoTitle: {
    fontSize: "1.2rem",
    fontWeight: 900,
    color: "#00a0d2",
    background: "transparent",
    letterSpacing: "0.02em",
    fontFamily: "Arial Black, Arial, sans-serif",
    lineHeight: 1.2,
  },
  logoSubtitle: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#00a0d2",
    letterSpacing: "0.25em",
    textTransform: "uppercase" as const,
    fontFamily: "system-ui, sans-serif",
    marginTop: "0.1rem",
  },
  nav: {
    display: "flex",
    gap: "0.25rem",
  },
  navItem: {
    background: "transparent",
    color: "#000",
    border: "none",
    borderRadius: 4,
    padding: "0.45rem 1.1rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    textDecoration: "none",
    display: "inline-block",
  },
  navActive: {
    background: "#00a0d2",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "0.45rem 1.1rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 700,
  },
  main: {
    margin: "2rem auto",
    padding: "0 1.5rem",
  },
  footer: {
    textAlign: "center" as const,
    padding: "1.25rem",
    fontSize: "0.78rem",
    color: "#888",
    borderTop: "1px solid #ddd",
    marginTop: "2rem",
  },
};
