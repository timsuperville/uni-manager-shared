/**
 * Utility to export data to CSV
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 */
export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? "";
          const stringValue =
            typeof value === "string" ? value : JSON.stringify(value);
          // Escape quotes and wrap in quotes if contains comma
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
