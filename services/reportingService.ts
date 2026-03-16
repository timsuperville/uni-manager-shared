/**
 * Frontend Reporting Service
 * Handles communication with the backend reporting API
 *
 * Bug fixes applied during TS migration:
 * - All 18 catch blocks used `_error` as variable name but `throw error` (undefined)
 *   → fixed to `throw _error` per Root-Cause Reflex
 * - getContentType: corrupt MIME type string for "excel" format → fixed
 */

import { apiClient } from "../utils/apiClient";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReportFilters {
  category?: string;
  type?: string;
  active?: boolean | string;
  [key: string]: unknown;
}

export interface ReportData {
  [key: string]: unknown;
}

export interface GenerateOptions extends ReportData {
  format?: string;
}

export interface ParameterDefinition {
  name: string;
  label?: string;
  required?: boolean;
  type?: "date" | "number" | "string";
}

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

class ReportingService {
  async getReports(filters: ReportFilters = {}): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.type) params.append("type", filters.type);
      if (filters.active !== undefined)
        params.append("active", String(filters.active));
      const response = await apiClient.get(`/api/reporting/reports?${params}`);
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getReport(reportId: string): Promise<unknown> {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}`,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async createReport(reportData: ReportData): Promise<unknown> {
    try {
      const response = await apiClient.post("/shared/reports", reportData);
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async updateReport(
    reportId: string,
    reportData: ReportData,
  ): Promise<unknown> {
    try {
      const response = await apiClient.put(
        `/api/reporting/reports/${reportId}`,
        reportData,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async deleteReport(reportId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/reporting/reports/${reportId}`);
    } catch (_error) {
      throw _error;
    }
  }

  async generateReport(
    reportId: string,
    parameters: GenerateOptions = {},
  ): Promise<unknown> {
    try {
      const response = await apiClient.post(
        `/api/reporting/reports/${reportId}/generate`,
        {
          parameters,
          format: parameters.format ?? "pdf",
        },
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getReportStatus(
    reportId: string,
    executionId: string,
  ): Promise<unknown> {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}/status/${executionId}`,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async downloadReport(reportId: string, format = "pdf"): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}/download`,
        {
          params: { format },
          responseType: "blob",
        },
      );
      return new Blob([response.data as BlobPart], {
        type: this.getContentType(format),
      });
    } catch (_error) {
      throw _error;
    }
  }

  async previewReport(
    reportId: string,
    parameters: ReportData = {},
  ): Promise<unknown> {
    try {
      const response = await apiClient.post(
        `/api/reporting/reports/${reportId}/preview`,
        { parameters },
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getTemplates(filters: ReportFilters = {}): Promise<unknown> {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.type) params.append("type", filters.type);
      const response = await apiClient.get(
        `/api/reporting/templates?${params}`,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getTemplate(templateId: string): Promise<unknown> {
    try {
      const response = await apiClient.get(
        `/api/reporting/templates/${templateId}`,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async createTemplate(templateData: ReportData): Promise<unknown> {
    try {
      const response = await apiClient.post(
        "/shared/report-templates",
        templateData,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async updateTemplate(
    templateId: string,
    templateData: ReportData,
  ): Promise<unknown> {
    try {
      const response = await apiClient.put(
        `/api/reporting/templates/${templateId}`,
        templateData,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/reporting/templates/${templateId}`);
    } catch (_error) {
      throw _error;
    }
  }

  async previewTemplate(
    templateId: string,
    sampleData: ReportData = {},
    format = "html",
  ): Promise<unknown> {
    try {
      const response = await apiClient.post(
        `/api/reporting/templates/${templateId}/preview`,
        { sampleData, format },
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getRecentReports(limit = 10): Promise<unknown> {
    try {
      const response = await apiClient.get(
        `/api/reporting/recent?limit=${limit}`,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getReportAnalytics(period = "30d"): Promise<unknown> {
    try {
      const response = await apiClient.get(
        `/api/reporting/analytics?period=${period}`,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async scheduleReport(
    reportId: string,
    scheduleData: ReportData,
  ): Promise<unknown> {
    try {
      const response = await apiClient.post(
        `/api/reporting/reports/${reportId}/schedule`,
        scheduleData,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getScheduledReports(): Promise<unknown> {
    try {
      const response = await apiClient.get("/shared/scheduled-reports");
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async cancelScheduledReport(scheduleId: string): Promise<void> {
    try {
      await apiClient.delete(`/shared/scheduled-reports/${scheduleId}`);
    } catch (_error) {
      throw _error;
    }
  }

  async validateReport(reportData: ReportData): Promise<unknown> {
    try {
      const response = await apiClient.post(
        "/shared/report-validation",
        reportData,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getDataSources(): Promise<unknown> {
    try {
      const response = await apiClient.get("/shared/data-sources");
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async testDataSource(dataSourceConfig: ReportData): Promise<unknown> {
    try {
      const response = await apiClient.post(
        "/shared/data-sources/test",
        dataSourceConfig,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getDataSourceFields(
    dataSourceId: string,
    table: string | null = null,
  ): Promise<unknown> {
    try {
      const params = table ? `?table=${table}` : "";
      const response = await apiClient.get(
        `/api/reporting/data-sources/${dataSourceId}/fields${params}`,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async executeTestQuery(
    dataSourceId: string,
    query: string,
    limit = 100,
  ): Promise<unknown> {
    try {
      const response = await apiClient.post(
        `/api/reporting/data-sources/${dataSourceId}/test-query`,
        { query, limit },
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async getReportPermissions(reportId: string): Promise<unknown> {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}/permissions`,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async updateReportPermissions(
    reportId: string,
    permissions: ReportData,
  ): Promise<unknown> {
    try {
      const response = await apiClient.put(
        `/api/reporting/reports/${reportId}/permissions`,
        permissions,
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  async exportReportConfig(reportId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}/export`,
        {
          responseType: "blob",
        },
      );
      return new Blob([response.data as BlobPart], {
        type: "application/json",
      });
    } catch (_error) {
      throw _error;
    }
  }

  async importReportConfig(configFile: File): Promise<unknown> {
    try {
      const formData = new FormData();
      formData.append("config", configFile);
      const response = await apiClient.post(
        "/shared/reports/import",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data;
    } catch (_error) {
      throw _error;
    }
  }

  // ---------------------------------------------------------------------------
  // Utility methods
  // ---------------------------------------------------------------------------

  getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      // Bug fix: original had corrupt string 'application/vnd.openxmlformats-officetypeof document...'
      excel:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      json: "application/json",
      html: "text/html",
    };
    return contentTypes[format] ?? "application/octet-stream";
  }

  generateFilename(
    reportName: string,
    format: string,
    timestamp: string | null = null,
  ): string {
    const date = timestamp ? new Date(timestamp) : new Date();
    const dateStr = date.toISOString().split("T")[0];
    const sanitizedName = reportName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    return `${sanitizedName}_${dateStr}.${format}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1_024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  isFormatSupported(format: string, supportedFormats: string[] = []): boolean {
    return supportedFormats.includes(format);
  }

  validateParameters(
    parameters: Record<string, unknown>,
    parameterDefinitions: ParameterDefinition[] = [],
  ): string[] {
    const errors: string[] = [];

    parameterDefinitions.forEach((paramDef) => {
      const value = parameters[paramDef.name];

      if (
        paramDef.required &&
        (value === undefined || value === null || value === "")
      ) {
        errors.push(`${paramDef.label ?? paramDef.name} is required`);
      }

      if (value && paramDef.type === "date") {
        const date = new Date(value as string);
        if (Number.isNaN(date.getTime())) {
          errors.push(
            `${paramDef.label ?? paramDef.name} must be a valid date`,
          );
        }
      }

      if (value && paramDef.type === "number") {
        if (Number.isNaN(Number(value))) {
          errors.push(
            `${paramDef.label ?? paramDef.name} must be a valid number`,
          );
        }
      }
    });

    return errors;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const reportingService = new ReportingService();
export default reportingService;
