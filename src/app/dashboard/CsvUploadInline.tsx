"use client";

import { useState, useRef } from "react";
import s from "./shared.module.css";
import { EXPECTED_HEADERS } from "@/lib/constants";

interface ParsedRow { [key: string]: string; }

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ""; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function parseCSVPreview(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: ParsedRow[] = [];
  for (let i = 1; i < Math.min(lines.length, 51); i++) {
    const values = splitCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    const row: ParsedRow = {};
    headers.forEach((h, idx) => { row[h] = values[idx].trim(); });
    rows.push(row);
  }
  return { headers, rows };
}

function validateColumns(csvHeaders: string[], table: string): { valid: boolean; missing: string[]; unexpected: string[] } {
  const expected = EXPECTED_HEADERS[table];
  if (!expected) return { valid: true, missing: [], unexpected: [] };
  const normalizedExpected = expected.map((h) => h.toLowerCase().trim());
  const normalizedCsv = csvHeaders.map((h) => h.toLowerCase().trim());
  const missing = expected.filter((h) => !normalizedCsv.includes(h.toLowerCase().trim()));
  const unexpected = csvHeaders.filter((h) => !normalizedExpected.includes(h.toLowerCase().trim()));
  const matchCount = expected.length - missing.length;
  const valid = matchCount >= Math.ceil(expected.length * 0.5) && missing.length <= 2;
  return { valid, missing, unexpected };
}

interface Props {
  table: string;
  label: string;
  onSuccess: () => void;
}

export default function CsvUploadInline({ table, label, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ headers: string[]; rows: ParsedRow[] } | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; imported?: number; total?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState<{ missing: string[]; unexpected: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const expectedHeaders = EXPECTED_HEADERS[table] || [];

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setMismatch(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setError(null);
    setMismatch(null);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setError("Please select a .csv file");
      return;
    }
    setFile(f);
    const text = await f.text();
    const parsed = parseCSVPreview(text);
    if (parsed.rows.length === 0) {
      setError("No data rows found in the CSV");
      setPreview(null);
      return;
    }
    const validation = validateColumns(parsed.headers, table);
    if (!validation.valid) {
      setMismatch({ missing: validation.missing, unexpected: validation.unexpected });
    }
    setPreview(parsed);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("table", table);
      formData.append("clearExisting", clearExisting.toString());
      const res = await fetch("/api/csv-import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
      } else {
        setResult(data);
        onSuccess();
      }
    } catch {
      setError("Network error during upload");
    } finally {
      setUploading(false);
    }
  };

  if (!open) {
    return (
      <button className="btn btn-secondary" onClick={() => setOpen(true)} title={`Upload CSV for ${label}`}>
        📤 Upload CSV
      </button>
    );
  }

  const totalRows = preview ? preview.rows.length : 0;

  return (
    <div className={s.modalOverlay} onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          width: "94vw",
          maxWidth: 1100,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>📤 Upload CSV &mdash; {label}</h2>
          <button className={s.modalClose} onClick={handleClose}>✕</button>
        </div>

        {/* Body - scrollable */}
        <div style={{ padding: "28px 28px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Expected columns */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>Expected Columns</div>
            <div className={s.tagList} style={{ gap: 8 }}>
              {expectedHeaders.map((h) => (
                <span key={h} className={s.tag} style={{ padding: "4px 12px", fontSize: 13 }}>{h}</span>
              ))}
            </div>
          </div>

          {/* File input */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: 10 }}>Select CSV File</div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ width: "100%" }}
            />
          </div>

          {/* Column mismatch warning */}
          {mismatch && (
            <div style={{ background: "rgba(255,165,0,0.08)", border: "1px solid rgba(255,165,0,0.35)", borderRadius: "var(--radius-md)", padding: "16px 20px", color: "#ffa500" }}>
              <strong style={{ fontSize: 15 }}>⚠️ Column Mismatch</strong>
              {mismatch.missing.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)", marginRight: 6 }}>Missing:</span>
                  {mismatch.missing.map((h) => <span key={h} style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "2px 10px", borderRadius: 10, fontSize: 12, marginLeft: 4 }}>{h}</span>)}
                </div>
              )}
              {mismatch.unexpected.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)", marginRight: 6 }}>Unexpected:</span>
                  {mismatch.unexpected.map((h) => <span key={h} style={{ background: "rgba(255,165,0,0.15)", color: "#ffa500", padding: "2px 10px", borderRadius: 10, fontSize: 12, marginLeft: 4 }}>{h}</span>)}
                </div>
              )}
            </div>
          )}

          {/* Preview table */}
          {preview && !mismatch && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <span className={`${s.badge} ${s.badgeBlue}`} style={{ padding: "4px 12px", fontSize: 13 }}>{totalRows} rows detected</span>
                <span className={`${s.badge} ${s.badgeGreen}`} style={{ padding: "4px 12px", fontSize: 13 }}>{preview.headers.length} columns</span>
              </div>
              <div style={{ overflow: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", maxHeight: 400 }}>
                <table className={s.table} style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px 14px" }}>#</th>
                      {preview.headers.map((h) => <th key={h} style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 8).map((row, i) => (
                      <tr key={i}>
                        <td className={s.cellMuted} style={{ padding: "10px 14px" }}>{i + 1}</td>
                        {preview.headers.map((h) => (
                          <td key={h} style={{ padding: "10px 14px" }}>
                            <div style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row[h] || "—"}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalRows > 8 && <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>Showing first 8 of {totalRows} rows</p>}
            </div>
          )}

          {/* Error / Success */}
          {error && <div className={s.errorBanner}>⚠️ {error}</div>}
          {result?.success && (
            <div className={s.successBanner}>
              ✅ Imported {result.imported} of {result.total} rows into <strong>{label}</strong>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "16px 28px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", marginRight: "auto", cursor: "pointer", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>
            <input type="checkbox" checked={clearExisting} onChange={(e) => setClearExisting(e.target.checked)} />
            Clear existing records before import
          </label>
          <button className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={uploading || !preview || !!mismatch}
          >
            {uploading ? "Importing..." : mismatch ? "⚠️ Mismatch" : `Import ${totalRows} Rows`}
          </button>
        </div>
      </div>
    </div>
  );
}
