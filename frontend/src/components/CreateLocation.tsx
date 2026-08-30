import { useState, useRef, useEffect, type FormEvent } from "react";
import { createLocation } from "../api/locationApi";
import type { LocationType, LocationResponse } from "../types/location";

interface Props {
  onCreated: (loc: LocationResponse) => void;
  mapPin?: { lat: number; lng: number } | null;
}

interface ImportResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export default function CreateLocation({ onCreated, mapPin }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<LocationType>("STANDARD");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync map click → form fields (only when not in file-import mode)
  useEffect(() => {
    if (mapPin && !fileData) {
      setLat(mapPin.lat.toFixed(6));
      setLng(mapPin.lng.toFixed(6));
    }
  }, [mapPin, fileData]);

  const manualFilled = name.trim() !== "" || lat.trim() !== "" || lng.trim() !== "";

  const resetForm = () => {
    setName(""); setType("STANDARD"); setLat(""); setLng("");
    setFileName(null); setFileData(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCancel = () => {
    resetForm();
    setError(null);
    setSuccess(null);
    setImportResult(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setSuccess(null);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setFileData(ev.target?.result as string);
    reader.readAsText(file, "UTF-8");
  };

  const parseCsv = (csv: string) => {
    const lines = csv.trim().split("\n").filter((l) => l.trim() !== "");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => (row[h] = values[i] ?? ""));
      return row;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setImportResult(null);
    setLoading(true);

    try {
      if (fileData) {
        const rows = parseCsv(fileData);
        if (rows.length === 0) {
          setError("File is empty or has no data rows.");
          return;
        }

        let succeeded = 0;
        const errors: string[] = [];

        for (const row of rows) {
          const rowLat = parseFloat(row["lat"]);
          const rowLng = parseFloat(row["lng"]);
          const rowType = (row["type"] ?? "").toUpperCase();

          if (!row["name"] || isNaN(rowLat) || isNaN(rowLng)) {
            errors.push(`Row "${row["name"] || "unknown"}": missing or invalid fields`);
            continue;
          }
          if (rowType !== "PREMIUM" && rowType !== "STANDARD") {
            errors.push(`Row "${row["name"]}": type must be PREMIUM or STANDARD`);
            continue;
          }

          try {
            const result = await createLocation({
              name: row["name"],
              type: rowType as LocationType,
              coordinates: { lat: rowLat, lng: rowLng },
            });
            onCreated(result);
            succeeded++;
          } catch (err: unknown) {
            errors.push(`Row "${row["name"]}": ${err instanceof Error ? err.message : "failed"}`);
          }
        }

        resetForm();
        setImportResult({ total: rows.length, succeeded, failed: errors.length, errors });
        return;
      }

      const result = await createLocation({
        name,
        type,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      });
      onCreated(result);
      resetForm();
      setSuccess(`Created: ${result.name} (${result.id})`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={styles.card}>
      <h2 id="create-location" style={styles.heading}>Create Location</h2>
      <form onSubmit={handleSubmit} style={styles.form}>

        <label style={styles.label}>
          Name
          <input
            style={{ ...styles.input, ...(fileData ? styles.inputDisabled : {}) }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={!fileData}
            disabled={!!fileData}
            placeholder="e.g. Schönbrunn Palace"
          />
        </label>

        <label style={styles.label}>
          Type
          <select
            style={{ ...styles.input, ...(fileData ? styles.inputDisabled : {}) }}
            value={type}
            onChange={(e) => setType(e.target.value as LocationType)}
            disabled={!!fileData}
          >
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </label>

        <label style={styles.label}>
          Latitude
          <input
            style={{ ...styles.input, ...(fileData ? styles.inputDisabled : {}) }}
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required={!fileData}
            disabled={!!fileData}
            placeholder="e.g. 48.184834"
          />
        </label>

        <label style={styles.label}>
          Longitude
          <input
            style={{ ...styles.input, ...(fileData ? styles.inputDisabled : {}) }}
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required={!fileData}
            disabled={!!fileData}
            placeholder="e.g. 16.31237"
          />
        </label>

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or import a file</span>
          <div style={styles.dividerLine} />
        </div>

        <label style={styles.label}>
          Import File
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ ...styles.fileInput, ...(manualFilled ? styles.inputDisabled : {}) }}
            disabled={manualFilled}
            onChange={handleFile}
          />
        </label>

        {fileName && <p style={styles.fileName}>Selected: {fileName}</p>}

        <a href="/sample-locations.csv" download style={styles.sampleLink}>
          Download sample CSV
        </a>

        <div style={styles.buttonRow}>
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? (fileData ? "Importing…" : "Creating…") : fileData ? "Import" : "Create"}
          </button>
          <button style={styles.cancelButton} type="button" onClick={handleCancel}>
            Cancel
          </button>
        </div>

      </form>

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      {importResult && (
        <div style={styles.resultBox}>
          <p style={styles.resultTitle}>Import Summary</p>
          <div style={styles.resultRow}>
            <span style={styles.resultTotal}>Total rows: {importResult.total}</span>
            <span style={styles.resultSuccess}>✓ Success: {importResult.succeeded}</span>
            <span style={styles.resultFailed}>✗ Failed: {importResult.failed}</span>
          </div>
          {importResult.errors.length > 0 && (
            <ul style={styles.errorList}>
              {importResult.errors.map((e, i) => (
                <li key={i} style={styles.errorItem}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff",
    borderRadius: 8,
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  heading: { marginTop: 0, color: "#1a1a2e" },
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  input: {
    padding: "0.5rem",
    borderRadius: 4,
    border: "1px solid #ccc",
    fontSize: "1rem",
  },
  inputDisabled: {
    background: "#f5f5f5",
    color: "#aaa",
    cursor: "not-allowed",
    border: "1px solid #e0e0e0",
  },
  fileInput: {
    fontSize: "0.9rem",
    cursor: "pointer",
    padding: "0.3rem 0",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    margin: "0.25rem 0",
  },
  dividerLine: { flex: 1, height: 1, background: "#e0e0e0" },
  dividerText: {
    fontSize: "0.8rem",
    color: "#999",
    whiteSpace: "nowrap" as const,
  },
  fileName: { fontSize: "0.82rem", color: "#00a0d2", margin: 0, fontWeight: 500 },
  sampleLink: { fontSize: "0.82rem", color: "#00a0d2", textDecoration: "none", alignSelf: "flex-start" as const },
  buttonRow: { display: "flex", gap: "0.75rem", marginTop: "0.25rem" },
  button: {
    padding: "0.6rem 1.4rem",
    background: "#00a0d2",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  cancelButton: {
    padding: "0.6rem 1.4rem",
    background: "#fff",
    color: "#555",
    border: "1px solid #ccc",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: 600,
  },
  error: { color: "#e63946", margin: "0.5rem 0 0" },
  success: { color: "#2d6a4f", margin: "0.5rem 0 0" },
  resultBox: {
    marginTop: "1rem",
    border: "1px solid #e0e0e0",
    borderRadius: 6,
    padding: "1rem",
    background: "#fafafa",
  },
  resultTitle: { margin: "0 0 0.5rem", fontWeight: 700, fontSize: "0.95rem", color: "#1a1a2e" },
  resultRow: { display: "flex", gap: "1.5rem", marginBottom: "0.5rem", flexWrap: "wrap" as const },
  resultTotal: { fontSize: "0.9rem", color: "#555" },
  resultSuccess: { fontSize: "0.9rem", color: "#2d6a4f", fontWeight: 600 },
  resultFailed: { fontSize: "0.9rem", color: "#e63946", fontWeight: 600 },
  errorList: { margin: "0.25rem 0 0", paddingLeft: "1.2rem" },
  errorItem: { fontSize: "0.82rem", color: "#e63946", marginBottom: "0.2rem" },
};
