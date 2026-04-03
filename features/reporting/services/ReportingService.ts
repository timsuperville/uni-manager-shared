import { BaseService } from "../../../api/services/BaseService";
import { ApiClient } from "../../../api/core/ApiClient";
import { ApiError } from "../../../api/core/ErrorHandler";
import {
  ReportFilters,
  ReportData,
  GenerateOptions,
  ParameterDefinition,
} from "../../../api/types";

export class ReportingService extends BaseService {
  constructor(client: ApiClient) {
    // Keep internal path clean, we'll supply full relative paths from the base /api
    super(client, "", "ReportingService");
  }

  async getReports(filters: ReportFilters = {}): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.type) params.append("type", filters.type);
    if (filters.active !== undefined)
      params.append("active", String(filters.active));
    return this.get<unknown>(`/reporting/reports?${params.toString()}`);
  }

  async getReport(reportId: string): Promise<unknown> {
    return this.get<unknown>(`/reporting/reports/${reportId}`);
  }

  async createReport(reportData: ReportData): Promise<unknown> {
    return this.post<unknown>("/shared/reports", reportData);
  }

  async updateReport(
    reportId: string,
    reportData: ReportData,
  ): Promise<unknown> {
    return this.put<unknown>(`/reporting/reports/${reportId}`, reportData);
  }

  async deleteReport(reportId: string): Promise<void> {
    return this.delete<void>(`/reporting/reports/${reportId}`);
  }

  async generateReport(
    reportId: string,
    parameters: GenerateOptions = {},
  ): Promise<unknown> {
    return this.post<unknown>(`/reporting/reports/${reportId}/generate`, {
      parameters,
      format: parameters.format ?? "pdf",
    });
  }

  async getReportStatus(
    reportId: string,
    executionId: string,
  ): Promise<unknown> {
    return this.get<unknown>(
      `/reporting/reports/${reportId}/status/${executionId}`,
    );
  }

  async downloadReport(reportId: string, format = "pdf"): Promise<Blob> {
    try {
      const blob = await this.client.download(
        `/reporting/reports/${reportId}/download`,
        { params: { format } },
      );
      return new Blob([blob], {
        type: this.getContentType(format),
      });
    } catch (error) {
      this.handleError(error as ApiError, "downloadReport");
      throw error;
    }
  }

  async previewReport(
    reportId: string,
    parameters: ReportData = {},
  ): Promise<unknown> {
    return this.post<unknown>(`/reporting/reports/${reportId}/preview`, {
      parameters,
    });
  }

  async getTemplates(filters: ReportFilters = {}): Promise<unknown> {
    const params = new URLSearchParams();
    if (filters.category) params.append("category", filters.category);
    if (filters.type) params.append("type", filters.type);
    return this.get<unknown>(`/reporting/templates?${params.toString()}`);
  }

  async getTemplate(templateId: string): Promise<unknown> {
    return this.get<unknown>(`/reporting/templates/${templateId}`);
  }

  async createTemplate(templateData: ReportData): Promise<unknown> {
    return this.post<unknown>("/shared/report-templates", templateData);
  }

  async updateTemplate(
    templateId: string,
    templateData: ReportData,
  ): Promise<unknown> {
    return this.put<unknown>(
      `/reporting/templates/${templateId}`,
      templateData,
    );
  }

  async deleteTemplate(templateId: string): Promise<void> {
    return this.delete<void>(`/reporting/templates/${templateId}`);
  }

  async previewTemplate(
    templateId: string,
    sampleData: ReportData = {},
    format = "html",
  ): Promise<unknown> {
    return this.post<unknown>(`/reporting/templates/${templateId}/preview`, {
      sampleData,
      format,
    });
  }

  async getRecentReports(limit = 10): Promise<unknown> {
    return this.get<unknown>(`/reporting/recent?limit=${limit}`);
  }

  async getReportAnalytics(period = "30d"): Promise<unknown> {
    return this.get<unknown>(`/reporting/analytics?period=${period}`);
  }

  async scheduleReport(
    reportId: string,
    scheduleData: ReportData,
  ): Promise<unknown> {
    return this.post<unknown>(
      `/reporting/reports/${reportId}/schedule`,
      scheduleData,
    );
  }

  async getScheduledReports(): Promise<unknown> {
    return this.get<unknown>("/shared/scheduled-reports");
  }

  async cancelScheduledReport(scheduleId: string): Promise<void> {
    return this.delete<void>(`/shared/scheduled-reports/${scheduleId}`);
  }

  async validateReport(reportData: ReportData): Promise<unknown> {
    return this.post<unknown>("/shared/report-validation", reportData);
  }

  async getDataSources(): Promise<unknown> {
    return this.get<unknown>("/shared/data-sources");
  }

  async testDataSource(dataSourceConfig: ReportData): Promise<unknown> {
    return this.post<unknown>("/shared/data-sources/test", dataSourceConfig);
  }

  async getDataSourceFields(
    dataSourceId: string,
    table: string | null = null,
  ): Promise<unknown> {
    const params = table ? `?table=${table}` : "";
    return this.get<unknown>(
      `/reporting/data-sources/${dataSourceId}/fields${params}`,
    );
  }

  async executeTestQuery(
    dataSourceId: string,
    query: string,
    limit = 100,
  ): Promise<unknown> {
    return this.post<unknown>(
      `/reporting/data-sources/${dataSourceId}/test-query`,
      { query, limit },
    );
  }

  async getReportPermissions(reportId: string): Promise<unknown> {
    return this.get<unknown>(`/reporting/reports/${reportId}/permissions`);
  }

  async updateReportPermissions(
    reportId: string,
    permissions: ReportData,
  ): Promise<unknown> {
    return this.put<unknown>(
      `/reporting/reports/${reportId}/permissions`,
      permissions,
    );
  }

  async exportReportConfig(reportId: string): Promise<Blob> {
    try {
      const blob = await this.client.download(
        `/reporting/reports/${reportId}/export`,
      );
      return new Blob([blob], {
        type: "application/json",
      });
    } catch (error) {
      this.handleError(error as ApiError, "exportReportConfig");
      throw error;
    }
  }

  async importReportConfig(configFile: File): Promise<unknown> {
    try {
      const formData = new FormData();
      formData.append("config", configFile);
      const response = await this.client.post(
        "/shared/reports/import",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data;
    } catch (error) {
      this.handleError(error as ApiError, "importReportConfig");
      throw error;
    }
  }

  getContentType(format: string): string {
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
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
