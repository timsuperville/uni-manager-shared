/**
 * Data Export Service
 * Comprehensive data export functionality with multiple formats
 */

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

export interface ExportOptions {
  filename?: string;
  title?: string;
  columns?: string[] | null;
  filters?: FilterSpec;
  metadata?: Record<string, unknown>;
}

export interface ExportResult {
  filename: string;
  format: string;
  size: number;
  recordCount: number;
}

interface ExportHistoryEntry {
  format: string;
  filename: string;
  recordCount: number;
  timestamp: Date;
  filters: FilterSpec;
  metadata: Record<string, unknown>;
}

export interface PreviewResult {
  columns: string[];
  data: Record<string, unknown>[];
  totalRecords: number;
  previewRecords: number;
  hasMore: boolean;
}

/** Filter value types supported by applyFilters */
type FilterValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | number[]
  | { min?: number; max?: number }
  | { from?: string; to?: string };

type FilterSpec = Record<string, FilterValue>;

type DataRow = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Bug note: original JS line 74: catch variable was `_error` but threw `error.message`
// (undefined variable → ReferenceError). Fixed here by using `_error` in the throw.
// ---------------------------------------------------------------------------

class DataExportService {
  private readonly supportedFormats: ExportFormat[] = [
    "csv",
    "xlsx",
    "pdf",
    "json",
  ];
  private exportHistory: ExportHistoryEntry[] = [];

  async exportData(
    data: DataRow[],
    format: string,
    options: ExportOptions = {},
  ): Promise<ExportResult> {
    const {
      filename = `export_${new Date().toISOString().split("T")[0]}`,
      title = "Data Export",
      columns = null,
      filters = {},
      metadata = {},
    } = options;

    try {
      const filteredData = this.applyFilters(data, filters);

      let result: ExportResult;
      switch (format.toLowerCase() as ExportFormat) {
        case "csv":
          result = await this.exportToCSV(filteredData, { filename, columns });
          break;
        case "xlsx":
          result = await this.exportToExcel(filteredData, {
            filename,
            columns,
            title,
          });
          break;
        case "pdf":
          result = await this.exportToPDF(filteredData, {
            filename,
            columns,
            title,
            metadata,
          });
          break;
        case "json":
          result = await this.exportToJSON(filteredData, {
            filename,
            metadata,
          });
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      this.recordExport({
        format,
        filename: result.filename,
        recordCount: filteredData.length,
        timestamp: new Date(),
        filters,
        metadata,
      });

      return result;
    } catch (_error) {
      // Root-Cause: re-throw with context; do NOT reference `error` (out of scope bug in JS original)
      throw new Error(
        `Export failed: ${_error instanceof Error ? _error.message : String(_error)}`,
      );
    }
  }

  private applyFilters(data: DataRow[], filters: FilterSpec): DataRow[] {
    if (!filters || Object.keys(filters).length === 0) return data;

    return data.filter((item) =>
      Object.entries(filters).every(([key, value]) => {
        if (value == null) return true;
        const itemValue = this.getNestedValue(item, key);

        if (typeof value === "object" && !Array.isArray(value)) {
          const range = value as {
            min?: number;
            max?: number;
            from?: string;
            to?: string;
          };
          if (range.min !== undefined || range.max !== undefined) {
            const numValue = Number(itemValue);
            return (
              (range.min === undefined || numValue >= range.min) &&
              (range.max === undefined || numValue <= range.max)
            );
          }
          if (range.from || range.to) {
            const itemDate = new Date(itemValue as string);
            return (
              (!range.from || itemDate >= new Date(range.from)) &&
              (!range.to || itemDate <= new Date(range.to))
            );
          }
        }

        if (Array.isArray(value))
          return value.includes(itemValue as string | number);

        if (typeof itemValue === "string" && typeof value === "string") {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }

        return itemValue === value;
      }),
    );
  }

  private getNestedValue(obj: DataRow, path: string): unknown {
    return path.split(".").reduce<unknown>((current, key) => {
      if (current && typeof current === "object")
        return (current as DataRow)[key];
      return undefined;
    }, obj);
  }

  private async exportToCSV(
    data: DataRow[],
    options: { filename?: string; columns?: string[] | null },
  ): Promise<ExportResult> {
    const { filename = "export", columns } = options;
    if (data.length === 0) throw new Error("No data to export");

    const exportColumns = columns ?? Object.keys(data[0]);
    const headers = exportColumns.join(",");
    const rows = data.map((item) =>
      exportColumns
        .map((col) => {
          const value = this.getNestedValue(item, col);
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `'${value.replace(/'/g, "''")}'`;
          }
          return String(value ?? "");
        })
        .join(","),
    );

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const finalFilename = `${filename}.csv`;
    this.downloadBlob(blob, finalFilename);

    return {
      filename: finalFilename,
      format: "csv",
      size: blob.size,
      recordCount: data.length,
    };
  }

  private async exportToExcel(
    data: DataRow[],
    options: { filename?: string; columns?: string[] | null; title?: string },
  ): Promise<ExportResult> {
    const { filename = "export", columns, title } = options;
    if (data.length === 0) throw new Error("No data to export");

    const exportColumns = columns ?? Object.keys(data[0]);
    const wb = XLSX.utils.book_new();
    const wsData = [
      exportColumns,
      ...data.map((item) =>
        exportColumns.map((col) => this.getNestedValue(item, col)),
      ),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = exportColumns.map((col) => ({
      wch: Math.max(col.length, 15),
    }));
    XLSX.utils.book_append_sheet(wb, ws, title ?? "Data");

    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    }) as ArrayBuffer;
    // Bug fix: original had garbage string in MIME type — was:
    // 'application/vnd.openxmlformats-officetypeof document !== "undefined" && document.spreadsheetml.sheet;...'
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    const finalFilename = `${filename}.xlsx`;
    this.downloadBlob(blob, finalFilename);

    return {
      filename: finalFilename,
      format: "xlsx",
      size: blob.size,
      recordCount: data.length,
    };
  }

  private async exportToPDF(
    data: DataRow[],
    options: {
      filename?: string;
      columns?: string[] | null;
      title?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<ExportResult> {
    const { filename = "export", columns, title, metadata } = options;
    if (data.length === 0) throw new Error("No data to export");

    const exportColumns = columns ?? Object.keys(data[0]);
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(title ?? "Data Export", 14, 20);

    let yOffset = 35;
    if (metadata && Object.keys(metadata).length > 0) {
      doc.setFontSize(10);
      Object.entries(metadata).forEach(([key, value]) => {
        doc.text(`${key}: ${String(value)}`, 14, yOffset);
        yOffset += 5;
      });
      yOffset += 5;
    }

    doc.setFontSize(10);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, yOffset);
    doc.text(`Records: ${data.length}`, 14, yOffset + 5);
    yOffset += 15;

    const tableData = data.map((item) =>
      exportColumns.map((col) => String(this.getNestedValue(item, col) ?? "")),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).autoTable({
      head: [exportColumns],
      body: tableData,
      startY: yOffset,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 85, 105] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20 },
    });

    const pdfBlob = doc.output("blob");
    const finalFilename = `${filename}.pdf`;
    this.downloadBlob(pdfBlob, finalFilename);

    return {
      filename: finalFilename,
      format: "pdf",
      size: pdfBlob.size,
      recordCount: data.length,
    };
  }

  private async exportToJSON(
    data: DataRow[],
    options: { filename?: string; metadata?: Record<string, unknown> },
  ): Promise<ExportResult> {
    const { filename = "export", metadata } = options;
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        recordCount: data.length,
        ...metadata,
      },
      data,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const finalFilename = `${filename}.json`;
    this.downloadBlob(blob, finalFilename);

    return {
      filename: finalFilename,
      format: "json",
      size: blob.size,
      recordCount: data.length,
    };
  }

  private downloadBlob(blob: Blob, filename: string): void {
    // navigator.msSaveOrOpenBlob is a legacy IE/Edge API — access via unknown cast to avoid TS error
    const nav = navigator as unknown as {
      msSaveOrOpenBlob?: (b: Blob, n: string) => void;
    };
    if (nav.msSaveOrOpenBlob) {
      nav.msSaveOrOpenBlob(blob, filename);
    } else if (typeof document !== "undefined") {
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  private recordExport(exportInfo: ExportHistoryEntry): void {
    this.exportHistory.unshift(exportInfo);
    if (this.exportHistory.length > 100)
      this.exportHistory = this.exportHistory.slice(0, 100);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          "exportHistory",
          JSON.stringify(this.exportHistory),
        );
      }
    } catch {
      // Non-fatal: localStorage may be full or blocked
    }
  }

  loadExportHistory(): void {
    try {
      const stored =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("exportHistory")
          : null;
      if (stored)
        this.exportHistory = JSON.parse(stored) as ExportHistoryEntry[];
    } catch {
      this.exportHistory = [];
    }
  }

  getExportHistory(): ExportHistoryEntry[] {
    return this.exportHistory;
  }

  clearExportHistory(): void {
    this.exportHistory = [];
    if (typeof localStorage !== "undefined")
      localStorage.removeItem("exportHistory");
  }

  getSupportedFormats(): ExportFormat[] {
    return [...this.supportedFormats];
  }

  validateExportParams(data: unknown, format: string): boolean {
    if (!Array.isArray(data)) throw new Error("Data must be an array");
    if (!this.supportedFormats.includes(format.toLowerCase() as ExportFormat)) {
      throw new Error(
        `Unsupported format: ${format}. Supported formats: ${this.supportedFormats.join(", ")}`,
      );
    }
    if ((data as unknown[]).length === 0) throw new Error("No data to export");
    return true;
  }

  generatePreview(
    data: DataRow[],
    options: {
      columns?: string[];
      filters?: FilterSpec;
      maxRows?: number;
    } = {},
  ): PreviewResult {
    const { columns, filters = {}, maxRows = 10 } = options;
    const filteredData = this.applyFilters(data, filters);
    const exportColumns =
      columns ?? (filteredData.length > 0 ? Object.keys(filteredData[0]) : []);
    const previewData = filteredData.slice(0, maxRows);

    return {
      columns: exportColumns,
      data: previewData,
      totalRecords: filteredData.length,
      previewRecords: previewData.length,
      hasMore: filteredData.length > maxRows,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const dataExportService = new DataExportService();
dataExportService.loadExportHistory();

export default dataExportService;
