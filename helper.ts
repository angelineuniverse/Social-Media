import fs from 'fs';

export const resSuccess = (response: any, msg: string, data: any) => {
    return response.json({
        message: msg ?? '',
        data: data ?? ''
    })
}
export const resFailure = (response: any, msg: string, code: number) => {
    return response.status(code).json({
        message: msg ?? '',
    })
}
export const whiteListImage: Array<String> = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
];

export const whiteListVideo: Array<String> = [
    'video/mp4',
    'video/mpeg',
    'video/MPV',
    'video/AV1',
];

export function parseDateString(dateStr: string): Date {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day); // Month dimulai dari 0 (Jan = 0)
}
export type CsvFormatValueCallback<DataItem> = (
  value: any,
  dataItem: DataItem
) => string;

export interface CsvColumn<DataItem = Record<string, unknown>> {
  key: string;
  title: string;
  formatValue?: CsvFormatValueCallback<DataItem>;
}
export function exportToCSV<DataItem = Record<string, unknown>>(
  data: DataItem[],
  columns: CsvColumn<DataItem>[],
  fileName: string
): void {
  if (data.length === 0) {
    throw new Error("Data is empty. Cannot export CSV.");
  }

  // 1. Handle null/undefined values
  const nullToEmptyReplacer = (_key: string, value: unknown) => {
    return value === null ? "" : value;
  };

  // 2. Prepare each data row
  const prepareDataItem = (item: DataItem) => {
    return columns.map(column => {
      let value;
      const key = column.key as keyof DataItem;

      try {
        value = item[key] ?? "-";

        if (typeof column.formatValue === "function") {
          value = column.formatValue(value, item);
          }
        if (column.key === "contact") {
          value = `' ${value}`; // Tambahkan apostrof untuk force Excel sebagai text
        }
      } catch {
        value = "-";
      }

      // Stringify with proper escaping for CSV
      return JSON.stringify(value, nullToEmptyReplacer)
        .replace(/^"|"$/g, '') // Remove outer quotes from JSON.stringify
        .replace(/"/g, '""');   // Escape existing quotes
    });
  };

  // 3. Build CSV content
  const headingsRow = columns.map(column => `"${column.title}"`).join("|");
  const contentRows = data.map(item => prepareDataItem(item).join("|"));
  const csvContent = "\uFEFF" + [headingsRow, ...contentRows].join("\r\n"); // BOM + CRLF

  // 4. Write to file
  fs.writeFileSync(fileName, csvContent, 'utf-8');
}