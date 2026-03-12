import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Aggregation,
  ColumnSchema,
  ParsedSheet,
  ParsedRow,
  TimeGranularity,
} from "@/lib/data-utils";

type SortDirection = "asc" | "desc";

type DashboardState = {
  sheets: ParsedSheet[];
  activeSheet?: string;
  rows: ParsedRow[];
  columns: ColumnSchema[];
  fileName: string;
  dimension?: string;
  measure?: string;
  dateColumn?: string;
  aggregation: Aggregation;
  lineGranularity: TimeGranularity;
  globalSearch: string;
  columnFilters: Record<string, string>;
  dateRange: {
    from?: string;
    to?: string;
  };
  currentPage: number;
  pageSize: number;
  sortBy?: string;
  sortDirection: SortDirection;
  visibleColumns: string[];
  parseError?: string;
  setData: (payload: {
    sheets: ParsedSheet[];
    activeSheet: string;
    fileName: string;
  }) => void;
  setActiveSheet: (sheetName: string) => void;
  setParseError: (error?: string) => void;
  setDimension: (value?: string) => void;
  setMeasure: (value?: string) => void;
  setDateColumn: (value?: string) => void;
  setAggregation: (value: Aggregation) => void;
  setLineGranularity: (value: TimeGranularity) => void;
  setGlobalSearch: (value: string) => void;
  setColumnFilter: (column: string, value: string) => void;
  setDateRange: (range: { from?: string; to?: string }) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  setSort: (column: string) => void;
  setVisibleColumns: (columns: string[]) => void;
  reset: () => void;
};

const initialState = {
  sheets: [],
  activeSheet: undefined,
  rows: [],
  columns: [],
  fileName: "",
  dimension: undefined,
  measure: undefined,
  dateColumn: undefined,
  aggregation: "sum" as Aggregation,
  lineGranularity: "month" as TimeGranularity,
  globalSearch: "",
  columnFilters: {},
  dateRange: {},
  currentPage: 1,
  pageSize: 12,
  sortBy: undefined,
  sortDirection: "asc" as SortDirection,
  visibleColumns: [],
  parseError: undefined,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      ...initialState,
      setData: ({ sheets, activeSheet, fileName }) =>
        set((state) => {
          const selected =
            sheets.find((sheet) => sheet.name === activeSheet) ?? sheets[0];

          const columns = selected?.columns ?? [];

          return {
            sheets,
            activeSheet: selected?.name,
            rows: selected?.rows ?? [],
            columns,
            fileName,
            parseError: undefined,
            dimension:
              selected?.suggestedDimension ??
              state.dimension ??
              columns.find((column) => column.type === "string")?.name ??
              columns[0]?.name,
            measure:
              selected?.suggestedMeasure ??
              state.measure ??
              columns.find((column) => column.type === "number")?.name,
            dateColumn:
              selected?.suggestedDate ??
              state.dateColumn ??
              columns.find((column) => column.type === "date")?.name,
            visibleColumns: columns.map((column) => column.name),
            currentPage: 1,
            columnFilters: {},
            globalSearch: "",
            dateRange: {},
          };
        }),
      setActiveSheet: (sheetName) =>
        set((state) => {
          const selected = state.sheets.find((sheet) => sheet.name === sheetName);
          if (!selected) return {};

          const columns = selected.columns;

          return {
            activeSheet: selected.name,
            rows: selected.rows,
            columns,
            dimension:
              selected.suggestedDimension ??
              columns.find((column) => column.type === "string")?.name ??
              columns[0]?.name,
            measure:
              selected.suggestedMeasure ??
              columns.find((column) => column.type === "number")?.name,
            dateColumn:
              selected.suggestedDate ??
              columns.find((column) => column.type === "date")?.name,
            visibleColumns: columns.map((column) => column.name),
            currentPage: 1,
            sortBy: undefined,
            sortDirection: "asc",
            columnFilters: {},
            globalSearch: "",
            dateRange: {},
          };
        }),
      setParseError: (error) => set({ parseError: error }),
      setDimension: (value) => set({ dimension: value, currentPage: 1 }),
      setMeasure: (value) => set({ measure: value, currentPage: 1 }),
      setDateColumn: (value) => set({ dateColumn: value, currentPage: 1 }),
      setAggregation: (value) => set({ aggregation: value }),
      setLineGranularity: (value) => set({ lineGranularity: value }),
      setGlobalSearch: (value) => set({ globalSearch: value, currentPage: 1 }),
      setColumnFilter: (column, value) =>
        set((state) => ({
          columnFilters: {
            ...state.columnFilters,
            [column]: value,
          },
          currentPage: 1,
        })),
      setDateRange: (range) => set({ dateRange: range, currentPage: 1 }),
      clearFilters: () => set({ columnFilters: {}, globalSearch: "", dateRange: {}, currentPage: 1 }),
      setPage: (page) => set({ currentPage: page }),
      setSort: (column) =>
        set((state) => {
          if (state.sortBy === column) {
            return {
              sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
            };
          }

          return {
            sortBy: column,
            sortDirection: "asc",
          };
        }),
      setVisibleColumns: (columns) => set({ visibleColumns: columns }),
      reset: () => set(initialState),
    }),
    {
      name: "insurance-dashboard-ui-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activeSheet: state.activeSheet,
        dimension: state.dimension,
        measure: state.measure,
        dateColumn: state.dateColumn,
        aggregation: state.aggregation,
        lineGranularity: state.lineGranularity,
        pageSize: state.pageSize,
        visibleColumns: state.visibleColumns,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
        globalSearch: state.globalSearch,
        columnFilters: state.columnFilters,
        dateRange: state.dateRange,
      }),
    },
  ),
);
