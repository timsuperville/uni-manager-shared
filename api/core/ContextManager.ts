export class GlobalContextManager {
  private static instance: GlobalContextManager;
  private activeApp: string | null = null;
  private activeTenantId: string | null = null;
  private impersonatorId: string | null = null;
  private listeners: Set<() => void> = new Set();

  private constructor() {}

  public static getInstance(): GlobalContextManager {
    if (!GlobalContextManager.instance) {
      GlobalContextManager.instance = new GlobalContextManager();
    }
    return GlobalContextManager.instance;
  }

  public setActiveApp(app: string | null): void {
    this.activeApp = app;
    this.notifyListeners();
  }

  public getActiveApp(): string | null {
    return this.activeApp;
  }

  public setActiveTenantId(tenantId: string | null): void {
    this.activeTenantId = tenantId;
    this.notifyListeners();
  }

  public getActiveTenantId(): string | null {
    return this.activeTenantId;
  }

  public setImpersonatorId(impersonatorId: string | null): void {
    this.impersonatorId = impersonatorId;
    this.notifyListeners();
  }

  public getImpersonatorId(): string | null {
    return this.impersonatorId;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  public getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.activeApp) {
      headers["X-Active-App"] = this.activeApp;
    }
    if (this.activeTenantId) {
      headers["X-Tenant-ID"] = this.activeTenantId;
    }
    if (this.impersonatorId) {
      headers["X-Impersonator-Id"] = this.impersonatorId;
    }
    return headers;
  }
}

export const contextManager = GlobalContextManager.getInstance();
