/**
 * Data Export Service
 * Comprehensive data export functionality with multiple formats
 */

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

class DataExportService {
  constructor() {
    this.supportedFormats = ["csv", "xlsx", "pdf", "json"];
    this.exportHistory = [];
  }

  // Export data in specified format
  async exportData(data, format, options = {}) {
    const {
      filename = `export_${new Date().toISOString().split("T")[0]}`,
      title = "Data Export",
      columns = null,
      filters = {},
      metadata = {},
    } = options;

    try {
      // Apply filters if provided
      const filteredData = this.applyFilters(data, filters);

      // Process data based on format
      let result;
      switch (format.toLowerCase()) {
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

      // Record export in history
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
      // console.error('Export failed:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  }

  // Apply filters to data
  applyFilters(data, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;

        const itemValue = this.getNestedValue(item, key);

        if (typeof value === "object" && value !== null) {
          // Handle range filters
          if (value.min !== undefined || value.max !== undefined) {
            const numValue = Number(itemValue);
            return (
              (value.min === undefined || numValue >= value.min) &&
              (value.max === undefined || numValue <= value.max)
            );
          }

          // Handle date range filters
          if (value.from || value.to) {
            const itemDate = new Date(itemValue);
            return (
              (!value.from || itemDate >= new Date(value.from)) &&
              (!value.to || itemDate <= new Date(value.to))
            );
          }

          // Handle array filters
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
        }

        // Handle string filters
        if (typeof itemValue === "string" && typeof value === "string") {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }

        return itemValue === value;
      });
    });
  }

  // Get nested object value by key path
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  // Export to CSV format
  async exportToCSV(data, options = {}) {
    const { filename, columns } = options;

    if (data.length === 0) {
      throw new Error("No data to export");
    }

    // Prepare columns
    const exportColumns = columns || Object.keys(data[0]);

    // Create CSV content
    const headers = exportColumns.join(",");
    const rows = data.map((item) =>
      exportColumns
        .map((col) => {
          const value = this.getNestedValue(item, col);
          // Escape commas and quotes in CSV
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `'${value.replace(/'/g, "''")}'`;
          }
          return value || "";
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

  // Export to Excel format
  async exportToExcel(data, options = {}) {
    const { filename, columns, title } = options;

    if (data.length === 0) {
      throw new Error("No data to export");
    }

    // Prepare columns
    const exportColumns = columns || Object.keys(data[0]);

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Prepare data for worksheet
    const wsData = [
      exportColumns, // Headers
      ...data.map((item) =>
        exportColumns.map((col) => this.getNestedValue(item, col)),
      ),
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = exportColumns.map((col) => ({
      wch: Math.max(col.length, 15),
    }));
    ws["!cols"] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, title || "Data");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officetypeof document !== "undefined" && document.spreadsheetml.sheet;charset=UTF-8',
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

  // Export to PDF format
  async exportToPDF(data, options = {}) {
    const { filename, columns, title, metadata } = options;

    if (data.length === 0) {
      throw new Error("No data to export");
    }

    // Prepare columns
    const exportColumns = columns || Object.keys(data[0]);

    // Create PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title || "Data Export", 14, 20);

    // Add metadata
    let yOffset = 35;
    if (metadata && Object.keys(metadata).length > 0) {
      doc.setFontSize(10);
      Object.entries(metadata).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 14, yOffset);
        yOffset += 5;
      });
      yOffset += 5;
    }

    // Add export info
    doc.setFontSize(10);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 14, yOffset);
    doc.text(`Records: ${data.length}`, 14, yOffset + 5);
    yOffset += 15;

    // Prepare table data
    const tableHeaders = exportColumns;
    const tableData = data.map((item) =>
      exportColumns.map((col) => {
        const value = this.getNestedValue(item, col);
        return value?.toString() || "";
      }),
    );

    // Add table
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: yOffset,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 85, 105] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 20 },
    });

    // Save PDF
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

  // Export to JSON format
  async exportToJSON(data, options = {}) {
    const { filename, metadata } = options;

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

  // Download blob as file
  downloadBlob(blob, filename) {
    if (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      navigator.msSaveOrOpenBlob
    ) {
      // IE/Edge
      typeof window !== "undefined" &&
        typeof navigator !== "undefined" &&
        navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      // Other browsers
      const link =
        typeof document !== "undefined" && document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      typeof document !== "undefined" && document.body.appendChild(link);
      link.click();
      typeof document !== "undefined" && document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  // Record export in history
  recordExport(exportInfo) {
    this.exportHistory.unshift(exportInfo);

    // Keep only last 100 exports
    if (this.exportHistory.length > 100) {
      this.exportHistory = this.exportHistory.slice(0, 100);
    }

    // Save to localStorage
    try {
      typeof localStorage !== "undefined" &&
        localStorage.setItem(
          "exportHistory",
          JSON.stringify(this.exportHistory),
        );
    } catch (_error) {
      // console.warn('Failed to save export history:', error);
    }
  }

  // Load export history from localStorage
  loadExportHistory() {
    try {
      const stored =
        typeof localStorage !== "undefined" &&
        localStorage.getItem("exportHistory");
      if (stored) {
        this.exportHistory = JSON.parse(stored);
      }
    } catch (_error) {
      // console.warn('Failed to load export history:', error);
      this.exportHistory = [];
    }
  }

  // Get export history
  getExportHistory() {
    return this.exportHistory;
  }

  // Clear export history
  clearExportHistory() {
    this.exportHistory = [];
    typeof localStorage !== "undefined" &&
      localStorage.removeItem("exportHistory");
  }

  // Get supported formats
  getSupportedFormats() {
    return [...this.supportedFormats];
  }

  // Validate export parameters
  validateExportParams(data, format) {
    if (!Array.isArray(data)) {
      throw new Error("Data must be an array");
    }

    if (!this.supportedFormats.includes(format.toLowerCase())) {
      throw new Error(
        `Unsupported format: ${format}. Supported formats: ${this.supportedFormats.join(", ")}`,
      );
    }

    if (data.length === 0) {
      throw new Error("No data to export");
    }

    return true;
  }

  // Generate export preview
  generatePreview(data, options = {}) {
    const { columns, filters = {}, maxRows = 10 } = options;

    // Apply filters
    const filteredData = this.applyFilters(data, filters);

    // Prepare columns
    const exportColumns =
      columns || (filteredData.length > 0 ? Object.keys(filteredData[0]) : []);

    // Get preview data
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

// Create singleton instance
const dataExportService = new DataExportService();

// Load export history on initialization
dataExportService.loadExportHistory();

export default dataExportService;
