export interface LinkValidationResult {
  brokenLinks: any[];
  externalLinks: any[];
  totalLinks: number;
}

export function validateLinks(
  container: HTMLElement,
  routes: any[],
): LinkValidationResult;
export function generateReport(result: LinkValidationResult): string;
