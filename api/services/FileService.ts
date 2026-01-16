/**
 * File Management Service
 *
 * Comprehensive file management service providing upload, download, and
 * organization capabilities across the Uni-Manager ecosystem.
 *
 * Features:
 * - File upload with progress tracking
 * - File download and preview
 * - File organization and categorization
 * - Folder management
 * - File sharing and permissions
 * - Bulk operations
 * - Storage analytics
 */

import {
  BaseService,
  ValidationSchema,
  PaginationParams,
  PaginatedResponse,
} from "./BaseService";
import {
  FileMetadata,
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
  FileUploadRequest,
  FileSearchParams,
  FileShareRequest,
  BulkFileOperation,
  StorageAnalytics,
} from "../types";
import { ApiClient } from "../core/ApiClient";

export class FileService extends BaseService {
  constructor(client: ApiClient) {
    super(client, "/files", "FileService");
  }

  // ===============================================
  // VALIDATION SCHEMAS
  // ===============================================

  private static readonly SCHEMAS = {
    fileUpload: {
      file: { type: "object" as const, required: true },
      folderId: { type: "string" as const },
      category: { type: "string" as const },
      tags: { type: "array" as const },
      isPublic: { type: "boolean" as const },
    },

    fileId: {
      fileId: {
        type: "string" as const,
        required: true,
        minLength: 1,
      },
    },

    folderId: {
      folderId: {
        type: "string" as const,
        required: true,
        minLength: 1,
      },
    },

    createFolder: {
      name: {
        type: "string" as const,
        required: true,
        minLength: 1,
        maxLength: 255,
      },
      parentId: { type: "string" as const },
      description: { type: "string" as const, maxLength: 1000 },
      isPublic: { type: "boolean" as const },
    },

    updateFolder: {
      name: {
        type: "string" as const,
        minLength: 1,
        maxLength: 255,
      },
      description: { type: "string" as const, maxLength: 1000 },
      isPublic: { type: "boolean" as const },
    },

    bulkOperation: {
      fileIds: {
        type: "array" as const,
        required: true,
        validator: (value: any[]) =>
          value.length > 0 || "At least one file ID is required",
      },
      operation: {
        type: "string" as const,
        required: true,
        validator: (value: string) =>
          ["move", "copy", "delete", "share", "tag"].includes(value) ||
          "Invalid operation type",
      },
    },

    shareFile: {
      fileId: {
        type: "string" as const,
        required: true,
        minLength: 1,
      },
      shareWith: { type: "array" as const, required: true },
      permissions: {
        type: "string" as const,
        required: true,
        validator: (value: string) =>
          ["read", "write", "admin"].includes(value) ||
          "Invalid permission level",
      },
      expiresAt: { type: "string" as const },
    },
  } as const;

  // ===============================================
  // FILE OPERATIONS
  // ===============================================

  /**
   * Upload a file with optional metadata
   */
  async uploadFile(
    request: FileUploadRequest,
    onProgress?: (progress: ProgressEvent) => void,
  ): Promise<FileMetadata> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileUpload;
    this.validateRequest(request, schema);

    const formData = new FormData();
    formData.append("file", request.file);

    if (request.folderId) {
      formData.append("folderId", request.folderId);
    }

    if (request.category) {
      formData.append("category", request.category);
    }

    if (request.tags && request.tags.length > 0) {
      formData.append("tags", JSON.stringify(request.tags));
    }

    if (request.isPublic !== undefined) {
      formData.append("isPublic", String(request.isPublic));
    }

    if (request.description) {
      formData.append("description", request.description);
    }

    return this.upload<FileMetadata>(this.baseEndpoint + "/upload", formData, {
      onUploadProgress: (progress: ProgressEvent) => {
        onProgress?.(progress);

        // Emit global progress event
        typeof window !== "undefined" &&
          window.dispatchEvent(
            new CustomEvent("file-upload-progress", {
              detail: { progress, fileName: request.file.name },
            }),
          );
      },
    });
  }

  /**
   * Get file metadata by ID
   */
  async getFile(fileId: string): Promise<FileMetadata> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    return this.get<FileMetadata>(this.buildIdEndpoint(fileId));
  }

  /**
   * Download a file
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    return this.download(this.buildIdEndpoint(fileId, "/download"));
  }

  /**
   * Get file preview URL
   */
  async getFilePreviewUrl(fileId: string): Promise<{ previewUrl: string }> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    return this.get<{ previewUrl: string }>(
      this.buildIdEndpoint(fileId, "/preview"),
    );
  }

  /**
   * Update file metadata
   */
  async updateFile(
    fileId: string,
    updates: Partial<
      Pick<
        FileMetadata,
        "name" | "description" | "tags" | "category" | "isPublic"
      >
    >,
  ): Promise<FileMetadata> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    return this.patch<FileMetadata>(this.buildIdEndpoint(fileId), updates);
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    return this.delete<{ success: boolean }>(this.buildIdEndpoint(fileId));
  }

  /**
   * Search files with advanced filtering
   */
  async searchFiles(
    searchParams: FileSearchParams = {},
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<FileMetadata>> {
    const queryParams: Record<string, string> = {};

    // Build search parameters
    if (searchParams.query) {
      queryParams.q = searchParams.query;
    }

    if (searchParams.category) {
      queryParams.category = searchParams.category;
    }

    if (searchParams.tags && searchParams.tags.length > 0) {
      queryParams.tags = searchParams.tags.join(",");
    }

    if (searchParams.folderId) {
      queryParams.folderId = searchParams.folderId;
    }

    if (searchParams.mimeType) {
      queryParams.mimeType = searchParams.mimeType;
    }

    if (searchParams.sizeMin !== undefined) {
      queryParams.sizeMin = String(searchParams.sizeMin);
    }

    if (searchParams.sizeMax !== undefined) {
      queryParams.sizeMax = String(searchParams.sizeMax);
    }

    if (searchParams.createdAfter) {
      queryParams.createdAfter = searchParams.createdAfter;
    }

    if (searchParams.createdBefore) {
      queryParams.createdBefore = searchParams.createdBefore;
    }

    if (searchParams.isPublic !== undefined) {
      queryParams.isPublic = String(searchParams.isPublic);
    }

    // Add pagination parameters
    const paginationParams = this.buildPaginationParams(pagination);
    const allParams = { ...queryParams, ...paginationParams };

    const queryString =
      Object.keys(allParams).length > 0
        ? new URLSearchParams(allParams).toString()
        : "";

    const endpoint = queryString
      ? `${this.baseEndpoint}/search?${queryString}`
      : `${this.baseEndpoint}/search`;

    return this.get<PaginatedResponse<FileMetadata>>(endpoint);
  }

  // ===============================================
  // FOLDER OPERATIONS
  // ===============================================

  /**
   * Create a new folder
   */
  async createFolder(folderData: CreateFolderRequest): Promise<Folder> {
    const schema: ValidationSchema = FileService.SCHEMAS.createFolder;
    this.validateRequest(folderData, schema);

    return this.post<Folder>(this.baseEndpoint + "/folders", folderData);
  }

  /**
   * Get folder details with contents
   */
  async getFolder(
    folderId: string,
    pagination?: PaginationParams,
  ): Promise<Folder & { files: PaginatedResponse<FileMetadata> }> {
    const schema: ValidationSchema = FileService.SCHEMAS.folderId;
    this.validateRequest({ folderId }, schema);

    const paginationParams = this.buildPaginationParams(pagination);
    const queryString =
      Object.keys(paginationParams).length > 0
        ? new URLSearchParams(paginationParams).toString()
        : "";

    const endpoint = queryString
      ? this.buildIdEndpoint(folderId, `/folders?${queryString}`)
      : this.buildIdEndpoint(folderId, "/folders");

    return this.get<Folder & { files: PaginatedResponse<FileMetadata> }>(
      endpoint,
    );
  }

  /**
   * Update folder metadata
   */
  async updateFolder(
    folderId: string,
    updates: UpdateFolderRequest,
  ): Promise<Folder> {
    const schema: ValidationSchema = FileService.SCHEMAS.folderId;
    this.validateRequest({ folderId }, schema);

    const updateSchema: ValidationSchema = FileService.SCHEMAS.updateFolder;
    this.validateRequest(updates, updateSchema);

    return this.patch<Folder>(
      this.buildIdEndpoint(folderId, "/folders"),
      updates,
    );
  }

  /**
   * Delete a folder (and optionally its contents)
   */
  async deleteFolder(
    folderId: string,
    options: { recursive?: boolean } = {},
  ): Promise<{ success: boolean; deletedFiles: number }> {
    const schema: ValidationSchema = FileService.SCHEMAS.folderId;
    this.validateRequest({ folderId }, schema);

    const queryParams: Record<string, string> = {};
    if (options.recursive) {
      queryParams.recursive = "true";
    }

    const queryString =
      Object.keys(queryParams).length > 0
        ? new URLSearchParams(queryParams).toString()
        : "";

    const endpoint = queryString
      ? this.buildIdEndpoint(folderId, `/folders?${queryString}`)
      : this.buildIdEndpoint(folderId, "/folders");

    return this.delete<{ success: boolean; deletedFiles: number }>(endpoint);
  }

  /**
   * Get folder tree structure
   */
  async getFolderTree(rootFolderId?: string): Promise<Folder[]> {
    const queryParams: Record<string, string> = {};
    if (rootFolderId) {
      queryParams.rootId = rootFolderId;
    }

    const queryString =
      Object.keys(queryParams).length > 0
        ? new URLSearchParams(queryParams).toString()
        : "";

    const endpoint = queryString
      ? `${this.baseEndpoint}/folders/tree?${queryString}`
      : `${this.baseEndpoint}/folders/tree`;

    return this.get<Folder[]>(endpoint);
  }

  // ===============================================
  // SHARING AND PERMISSIONS
  // ===============================================

  /**
   * Share a file with users or generate shareable link
   */
  async shareFile(shareRequest: FileShareRequest): Promise<{
    shareId: string;
    shareUrl?: string;
    expiresAt?: string;
  }> {
    const schema: ValidationSchema = FileService.SCHEMAS.shareFile;
    this.validateRequest(shareRequest, schema);

    return this.post<{
      shareId: string;
      shareUrl?: string;
      expiresAt?: string;
    }>(this.buildIdEndpoint(shareRequest.fileId, "/share"), shareRequest);
  }

  /**
   * Get file shares for a file
   */
  async getFileShares(fileId: string): Promise<{
    shares: Array<{
      id: string;
      sharedWith: string[];
      permissions: string;
      createdAt: string;
      expiresAt?: string;
    }>;
  }> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    return this.get<{
      shares: Array<{
        id: string;
        sharedWith: string[];
        permissions: string;
        createdAt: string;
        expiresAt?: string;
      }>;
    }>(this.buildIdEndpoint(fileId, "/shares"));
  }

  /**
   * Revoke file share
   */
  async revokeFileShare(
    fileId: string,
    shareId: string,
  ): Promise<{ success: boolean }> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    return this.delete<{ success: boolean }>(
      this.buildIdEndpoint(fileId, `/shares/${shareId}`),
    );
  }

  // ===============================================
  // BULK OPERATIONS
  // ===============================================

  /**
   * Perform bulk operations on multiple files
   */
  async bulkFileOperation(operation: BulkFileOperation): Promise<{
    successful: string[];
    failed: Array<{ fileId: string; error: string }>;
  }> {
    const schema: ValidationSchema = FileService.SCHEMAS.bulkOperation;
    this.validateRequest(operation, schema);

    return this.post<{
      successful: string[];
      failed: Array<{ fileId: string; error: string }>;
    }>(this.baseEndpoint + "/bulk", operation);
  }

  /**
   * Move multiple files to a new folder
   */
  async moveFiles(
    fileIds: string[],
    targetFolderId: string,
  ): Promise<{
    successful: string[];
    failed: Array<{ fileId: string; error: string }>;
  }> {
    return this.bulkFileOperation({
      fileIds,
      operation: "move",
      targetFolderId,
    });
  }

  /**
   * Copy multiple files to a new folder
   */
  async copyFiles(
    fileIds: string[],
    targetFolderId: string,
  ): Promise<{
    successful: string[];
    failed: Array<{ fileId: string; error: string }>;
  }> {
    return this.bulkFileOperation({
      fileIds,
      operation: "copy",
      targetFolderId,
    });
  }

  /**
   * Delete multiple files
   */
  async deleteFiles(fileIds: string[]): Promise<{
    successful: string[];
    failed: Array<{ fileId: string; error: string }>;
  }> {
    return this.bulkFileOperation({
      fileIds,
      operation: "delete",
    });
  }

  /**
   * Add tags to multiple files
   */
  async tagFiles(
    fileIds: string[],
    tags: string[],
  ): Promise<{
    successful: string[];
    failed: Array<{ fileId: string; error: string }>;
  }> {
    return this.bulkFileOperation({
      fileIds,
      operation: "tag",
      tags,
    });
  }

  // ===============================================
  // ANALYTICS AND UTILITIES
  // ===============================================

  /**
   * Get storage analytics and usage statistics
   */
  async getStorageAnalytics(folderId?: string): Promise<StorageAnalytics> {
    const queryParams: Record<string, string> = {};
    if (folderId) {
      queryParams.folderId = folderId;
    }

    const queryString =
      Object.keys(queryParams).length > 0
        ? new URLSearchParams(queryParams).toString()
        : "";

    const endpoint = queryString
      ? `${this.baseEndpoint}/analytics?${queryString}`
      : `${this.baseEndpoint}/analytics`;

    return this.get<StorageAnalytics>(endpoint);
  }

  /**
   * Get recently accessed files
   */
  async getRecentFiles(limit: number = 10): Promise<FileMetadata[]> {
    const queryParams = { limit: String(limit) };
    const queryString = new URLSearchParams(queryParams).toString();

    return this.get<FileMetadata[]>(
      `${this.baseEndpoint}/recent?${queryString}`,
    );
  }

  /**
   * Get file activity history
   */
  async getFileActivity(
    fileId: string,
    pagination?: PaginationParams,
  ): Promise<
    PaginatedResponse<{
      id: string;
      action: string;
      userId: string;
      userName: string;
      timestamp: string;
      details?: any;
    }>
  > {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    const paginationParams = this.buildPaginationParams(pagination);
    const queryString =
      Object.keys(paginationParams).length > 0
        ? new URLSearchParams(paginationParams).toString()
        : "";

    const endpoint = queryString
      ? this.buildIdEndpoint(fileId, `/activity?${queryString}`)
      : this.buildIdEndpoint(fileId, "/activity");

    return this.get<
      PaginatedResponse<{
        id: string;
        action: string;
        userId: string;
        userName: string;
        timestamp: string;
        details?: any;
      }>
    >(endpoint);
  }

  /**
   * Generate file thumbnail
   */
  async generateThumbnail(
    fileId: string,
    options: { width?: number; height?: number; quality?: number } = {},
  ): Promise<{ thumbnailUrl: string }> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    const queryParams: Record<string, string> = {};
    if (options.width) queryParams.width = String(options.width);
    if (options.height) queryParams.height = String(options.height);
    if (options.quality) queryParams.quality = String(options.quality);

    const queryString =
      Object.keys(queryParams).length > 0
        ? new URLSearchParams(queryParams).toString()
        : "";

    const endpoint = queryString
      ? this.buildIdEndpoint(fileId, `/thumbnail?${queryString}`)
      : this.buildIdEndpoint(fileId, "/thumbnail");

    return this.post<{ thumbnailUrl: string }>(endpoint, {});
  }

  /**
   * Get file versions (if versioning is enabled)
   */
  async getFileVersions(
    fileId: string,
    pagination?: PaginationParams,
  ): Promise<PaginatedResponse<FileMetadata>> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    const paginationParams = this.buildPaginationParams(pagination);
    const queryString =
      Object.keys(paginationParams).length > 0
        ? new URLSearchParams(paginationParams).toString()
        : "";

    const endpoint = queryString
      ? this.buildIdEndpoint(fileId, `/versions?${queryString}`)
      : this.buildIdEndpoint(fileId, "/versions");

    return this.get<PaginatedResponse<FileMetadata>>(endpoint);
  }

  /**
   * Restore file version
   */
  async restoreFileVersion(
    fileId: string,
    versionId: string,
  ): Promise<FileMetadata> {
    const schema: ValidationSchema = FileService.SCHEMAS.fileId;
    this.validateRequest({ fileId }, schema);

    return this.post<FileMetadata>(
      this.buildIdEndpoint(fileId, `/versions/${versionId}/restore`),
      {},
    );
  }
}

export default FileService;
