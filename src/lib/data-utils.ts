import * as XLSX from "xlsx";

export type ColumnType = "string" | "number" | "date";
export type Aggregation = "sum" | "avg" | "count" | "min" | "max";
export type TimeGranularity = "day" | "week" | "month";

export type ParsedRow = Record<string, string | number | Date | null>;

export type ColumnSchema = {
  name: string;
  type: ColumnType;
  distinctCount: number;
  nonNullCount: number;
};

export type ParsedSheet = {
  name: string;
  rows: ParsedRow[];
  columns: ColumnSchema[];
  suggestedDimension?: string;
  suggestedMeasure?: string;
  suggestedDate?: string;
};

export type ParseResult = {
  sheets: ParsedSheet[];
  activeSheet: string;
  fileName: string;
};

const NUMBER_REGEX = /^-?\d+(\.\d+)?$/;
const DATE_HINT_REGEX = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;

function normalizeValue(value: unknown): string | number | Date | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  const text = String(value).trim();
  if (!text) return null;

  if (NUMBER_REGEX.test(text)) {
    const numeric = Number(text);
    if (Number.isFinite(numeric)) return numeric;
  }

  if (DATE_HINT_REGEX.test(text)) {
    const timestamp = Date.parse(text);
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp);
    }
  }

  return text;
}

function inferType(values: Array<string | number | Date | null>): ColumnType {
  const nonNull = values.filter((value) => value !== null);
  if (!nonNull.length) return "string";

  let numericCount = 0;
  let dateCount = 0;

  nonNull.forEach((value) => {
    if (typeof value === "number") numericCount += 1;
    if (value instanceof Date) dateCount += 1;
  });

  const ratioNumber = numericCount / nonNull.length;
  const ratioDate = dateCount / nonNull.length;

  if (ratioNumber >= 0.8) return "number";
  if (ratioDate >= 0.7) return "date";
  return "string";
}

function inferSchema(rows: ParsedRow[]): ColumnSchema[] {
  const headers = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  );

  return headers.map((header) => {
    const values = rows.map((row) => row[header] ?? null);
    const nonNullValues = values.filter((value) => value !== null);
    const distinctCount = new Set(
      nonNullValues.map((value) =>
        value instanceof Date ? value.toISOString() : String(value),
      ),
    ).size;

    return {
      name: header,
      type: inferType(values),
      distinctCount,
      nonNullCount: nonNullValues.length,
    };
  });
}

function suggestColumns(columns: ColumnSchema[]) {
  const measure = columns.find((column) => column.type === "number")?.name;
  const dimension =
    columns.find((column) => column.type === "string")?.name ?? columns[0]?.name;
  const date = columns.find((column) => column.type === "date")?.name;

  return {
    suggestedDimension: dimension,
    suggestedMeasure: measure,
    suggestedDate: date,
  };
}

export async function parseSpreadsheet(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    raw: true,
  });

  if (!workbook.SheetNames.length) {
    throw new Error("No sheet found in the uploaded file.");
  }

  const sheets: ParsedSheet[] = workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
    });

    const rows: ParsedRow[] = rawRows.map((row) => {
      const transformed: ParsedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        transformed[key] = normalizeValue(value);
      });
      return transformed;
    });

    const columns = inferSchema(rows);

    return {
      name: sheetName,
      rows,
      columns,
      ...suggestColumns(columns),
    };
  });

  const firstSheetName = sheets[0]?.name;
  if (!firstSheetName) {
    throw new Error("Workbook could not be parsed.");
  }

  return {
    sheets,
    activeSheet: firstSheetName,
    fileName: file.name,
  };
}

export function aggregateValues(
  values: number[],
  aggregation: Aggregation,
): number {
  if (aggregation === "count") return values.length;
  if (!values.length) return 0;

  if (aggregation === "sum") {
    return values.reduce((acc, value) => acc + value, 0);
  }

  if (aggregation === "avg") {
    return values.reduce((acc, value) => acc + value, 0) / values.length;
  }

  if (aggregation === "min") {
    return Math.min(...values);
  }

  return Math.max(...values);
}

export function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

export function toDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp)) return new Date(timestamp);
  }
  return null;
}

function weekStart(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + diff);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export function formatDateBucket(
  date: Date,
  granularity: TimeGranularity,
): string {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  if (granularity === "day") {
    return utc.toISOString().slice(0, 10);
  }

  if (granularity === "month") {
    return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  const start = weekStart(utc);
  return `${start.toISOString().slice(0, 10)} (W)`;
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
}

export function exportRowsToCsv(rows: ParsedRow[], visibleColumns: string[], fileName: string) {
  const normalized = rows.map((row) => {
    const out: Record<string, string | number | null> = {};
    visibleColumns.forEach((column) => {
      const value = row[column];
      out[column] = value instanceof Date ? value.toISOString().slice(0, 10) : (value as string | number | null) ?? null;
    });
    return out;
  });

  const sheet = XLSX.utils.json_to_sheet(normalized);
  const csv = XLSX.utils.sheet_to_csv(sheet);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName.replace(/\.[^/.]+$/, "") || "dashboard-export"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
