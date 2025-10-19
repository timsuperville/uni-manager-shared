/**
 * Frontend Reporting Service
 * Handles communication with the backend reporting API
 */

import { apiClient } from '../utils/apiClient';

class ReportingService {
  /**
   * Get all reports
   */
  async getReports(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);
      if (filters.active !== undefined) params.append('active', filters.active);

      const response = await apiClient.get(`/api/reporting/reports?${params}`);
      return response.data;
    } catch (_error) {
      // console.error('Error fetching reports:', error);
      throw error;
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReport(reportId) {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}`,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error fetching report:', error);
      throw error;
    }
  }

  /**
   * Create a new report
   */
  async createReport(reportData) {
    try {
      const response = await apiClient.post(
        '/shared/reports',
        reportData,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error creating report:', error);
      throw error;
    }
  }

  /**
   * Update an existing report
   */
  async updateReport(reportId, reportData) {
    try {
      const response = await apiClient.put(
        `/api/reporting/reports/${reportId}`,
        reportData,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error updating report:', error);
      throw error;
    }
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId) {
    try {
      await apiClient.delete(`/api/reporting/reports/${reportId}`);
    } catch (_error) {
      // console.error('Error deleting report:', error);
      throw error;
    }
  }

  /**
   * Generate a report
   */
  async generateReport(reportId, parameters = {}) {
    try {
      const response = await apiClient.post(
        `/api/reporting/reports/${reportId}/generate`,
        {
          parameters,
          format: parameters.format || 'pdf',
        },
      );
      return response.data;
    } catch (_error) {
      // console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Get report generation status
   */
  async getReportStatus(reportId, executionId) {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}/status/${executionId}`,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error getting report status:', error);
      throw error;
    }
  }

  /**
   * Download a generated report
   */
  async downloadReport(reportId, format = 'pdf') {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}/download`,
        {
          params: { format },
          responseType: 'blob',
        },
      );

      // Create blob from response
      const blob = new Blob([response.data], {
        type: this.getContentType(format),
      });

      return blob;
    } catch (_error) {
      // console.error('Error downloading report:', error);
      throw error;
    }
  }

  /**
   * Preview a report
   */
  async previewReport(reportId, parameters = {}) {
    try {
      const response = await apiClient.post(
        `/api/reporting/reports/${reportId}/preview`,
        {
          parameters,
        },
      );
      return response.data;
    } catch (_error) {
      // console.error('Error previewing report:', error);
      throw error;
    }
  }

  /**
   * Get report templates
   */
  async getTemplates(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.category) params.append('category', filters.category);
      if (filters.type) params.append('type', filters.type);

      const response = await apiClient.get(
        `/api/reporting/templates?${params}`,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId) {
    try {
      const response = await apiClient.get(
        `/api/reporting/templates/${templateId}`,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error fetching template:', error);
      throw error;
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData) {
    try {
      const response = await apiClient.post(
        '/shared/report-templates',
        templateData,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId, templateData) {
    try {
      const response = await apiClient.put(
        `/api/reporting/templates/${templateId}`,
        templateData,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId) {
    try {
      await apiClient.delete(`/api/reporting/templates/${templateId}`);
    } catch (_error) {
      // console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Preview a template with sample data
   */
  async previewTemplate(templateId, sampleData = {}, format = 'html') {
    try {
      const response = await apiClient.post(
        `/api/reporting/templates/${templateId}/preview`,
        {
          sampleData,
          format,
        },
      );
      return response.data;
    } catch (_error) {
      // console.error('Error previewing template:', error);
      throw error;
    }
  }

  /**
   * Get recent report executions
   */
  async getRecentReports(limit = 10) {
    try {
      const response = await apiClient.get(
        `/api/reporting/recent?limit=${limit}`,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error fetching recent reports:', error);
      throw error;
    }
  }

  /**
   * Get report analytics and metrics
   */
  async getReportAnalytics(period = '30d') {
    try {
      const response = await apiClient.get(
        `/api/reporting/analytics?period=${period}`,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error fetching report analytics:', error);
      throw error;
    }
  }

  /**
   * Schedule a report
   */
  async scheduleReport(reportId, scheduleData) {
    try {
      const response = await apiClient.post(
        `/api/reporting/reports/${reportId}/schedule`,
        scheduleData,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error scheduling report:', error);
      throw error;
    }
  }

  /**
   * Get scheduled reports
   */
  async getScheduledReports() {
    try {
      const response = await apiClient.get('/shared/scheduled-reports');
      return response.data;
    } catch (_error) {
      // console.error('Error fetching scheduled reports:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled report
   */
  async cancelScheduledReport(scheduleId) {
    try {
      await apiClient.delete(`/shared/scheduled-reports/${scheduleId}`);
    } catch (_error) {
      // console.error('Error canceling scheduled report:', error);
      throw error;
    }
  }

  /**
   * Validate report configuration
   */
  async validateReport(reportData) {
    try {
      const response = await apiClient.post(
        '/shared/report-validation',
        reportData,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error validating report:', error);
      throw error;
    }
  }

  /**
   * Get data sources for report creation
   */
  async getDataSources() {
    try {
      const response = await apiClient.get('/shared/data-sources');
      return response.data;
    } catch (_error) {
      // console.error('Error fetching data sources:', error);
      throw error;
    }
  }

  /**
   * Test data source connection
   */
  async testDataSource(dataSourceConfig) {
    try {
      const response = await apiClient.post(
        '/shared/data-sources/test',
        dataSourceConfig,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error testing data source:', error);
      throw error;
    }
  }

  /**
   * Get available fields for a data source
   */
  async getDataSourceFields(dataSourceId, table = null) {
    try {
      const params = table ? `?table=${table}` : '';
      const response = await apiClient.get(
        `/api/reporting/data-sources/${dataSourceId}/fields${params}`,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error fetching data source fields:', error);
      throw error;
    }
  }

  /**
   * Execute a test query
   */
  async executeTestQuery(dataSourceId, query, limit = 100) {
    try {
      const response = await apiClient.post(
        `/api/reporting/data-sources/${dataSourceId}/test-query`,
        {
          query,
          limit,
        },
      );
      return response.data;
    } catch (_error) {
      // console.error('Error executing test query:', error);
      throw error;
    }
  }

  /**
   * Get report permissions for current user
   */
  async getReportPermissions(reportId) {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}/permissions`,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error fetching report permissions:', error);
      throw error;
    }
  }

  /**
   * Update report permissions
   */
  async updateReportPermissions(reportId, permissions) {
    try {
      const response = await apiClient.put(
        `/api/reporting/reports/${reportId}/permissions`,
        permissions,
      );
      return response.data;
    } catch (_error) {
      // console.error('Error updating report permissions:', error);
      throw error;
    }
  }

  /**
   * Export report configuration
   */
  async exportReportConfig(reportId) {
    try {
      const response = await apiClient.get(
        `/api/reporting/reports/${reportId}/export`,
        {
          responseType: 'blob',
        },
      );
      return new Blob([response.data], { type: 'application/json' });
    } catch (_error) {
      // console.error('Error exporting report config:', error);
      throw error;
    }
  }

  /**
   * Import report configuration
   */
  async importReportConfig(configFile) {
    try {
      const formData = new FormData();
      formData.append('config', configFile);

      const response = await apiClient.post(
        '/shared/reports/import',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      return response.data;
    } catch (_error) {
      // console.error('Error importing report config:', error);
      throw error;
    }
  }

  /**
   * Get content type for download format
   */
  getContentType(format) {
    const contentTypes = {
      pdf: 'application/pdf',
      excel:
        'application/vnd.openxmlformats-officetypeof document !== "undefined" && document.spreadsheetml.sheet',
      csv: 'text/csv',
      json: 'application/json',
      html: 'text/html',
    };
    return contentTypes[format] || 'application/octet-stream';
  }

  /**
   * Generate report filename
   */
  generateFilename(reportName, format, timestamp = null) {
    const date = timestamp ? new Date(timestamp) : new Date();
    const dateStr = date.toISOString().split('T')[0];
    const sanitizedName = reportName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    return `${sanitizedName}_${dateStr}.${format}`;
  }

  /**
   * Format report size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if format is supported
   */
  isFormatSupported(format, supportedFormats = []) {
    return supportedFormats.includes(format);
  }

  /**
   * Validate report parameters
   */
  validateParameters(parameters, parameterDefinitions = []) {
    const errors = [];

    parameterDefinitions.forEach((paramDef) => {
      const value = parameters[paramDef.name];

      if (
        paramDef.required &&
        (value === undefined || value === null || value === '')
      ) {
        errors.push(`${paramDef.label || paramDef.name} is required`);
      }

      if (value && paramDef.type === 'date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push(
            `${paramDef.label || paramDef.name} must be a valid date`,
          );
        }
      }

      if (value && paramDef.type === 'number') {
        if (isNaN(Number(value))) {
          errors.push(
            `${paramDef.label || paramDef.name} must be a valid number`,
          );
        }
      }
    });

    return errors;
  }
}

// Create and export a singleton instance
const reportingService = new ReportingService();
export default reportingService;
