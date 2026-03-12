"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BarChart3,
  Download,
  FileWarning,
  Filter,
  LineChart as LineChartIcon,
  Layers,
  Upload,
  Table2,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  RadialBar,
  RadialBarChart,
  Scatter,
  ScatterChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileUpload } from "@/components/dashboard/file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  aggregateValues,
  exportRowsToCsv,
  formatDateBucket,
  formatValue,
  parseSpreadsheet,
  toDate,
  toNumber,
  type Aggregation,
  type ParsedRow,
} from "@/lib/data-utils";
import { useDashboardStore } from "@/store/dashboard-store";

const AGGREGATION_OPTIONS: Aggregation[] = ["sum", "avg", "count", "min", "max"];
const CHART_COLORS = ["#22d3ee", "#f59e0b", "#fb7185", "#34d399", "#a78bfa", "#f97316", "#818cf8", "#2dd4bf"];

function hashText(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function categoryColor(value: string): React.CSSProperties {
  const hue = hashText(value) % 360;
  return {
    backgroundColor: `hsla(${hue}, 72%, 32%, 0.45)`,
    borderColor: `hsla(${hue}, 82%, 58%, 0.75)`,
    color: `hsl(${hue}, 88%, 82%)`,
  };
}

function sortRows(
  rows: ParsedRow[],
  sortBy: string | undefined,
  sortDirection: "asc" | "desc",
) {
  if (!sortBy) return rows;

  return [...rows].sort((left, right) => {
    const leftValue = left[sortBy];
    const rightValue = right[sortBy];

    const leftDate = toDate(leftValue);
    const rightDate = toDate(rightValue);

    if (leftDate && rightDate) {
      return sortDirection === "asc"
        ? leftDate.getTime() - rightDate.getTime()
        : rightDate.getTime() - leftDate.getTime();
    }

    const leftNumber = toNumber(leftValue);
    const rightNumber = toNumber(rightValue);

    if (leftNumber !== null && rightNumber !== null) {
      return sortDirection === "asc"
        ? leftNumber - rightNumber
        : rightNumber - leftNumber;
    }

    const leftText = formatValue(leftValue).toLowerCase();
    const rightText = formatValue(rightValue).toLowerCase();

    if (leftText === rightText) return 0;
    if (sortDirection === "asc") return leftText > rightText ? 1 : -1;
    return leftText < rightText ? 1 : -1;
  });
}

export function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const {
    sheets,
    activeSheet,
    rows,
    columns,
    fileName,
    dimension,
    measure,
    dateColumn,
    aggregation,
    lineGranularity,
    globalSearch,
    columnFilters,
    dateRange,
    currentPage,
    pageSize,
    sortBy,
    sortDirection,
    visibleColumns,
    parseError,
    setData,
    setActiveSheet,
    setParseError,
    setDimension,
    setMeasure,
    setDateColumn,
    setAggregation,
    setLineGranularity,
    setGlobalSearch,
    setColumnFilter,
    setDateRange,
    clearFilters,
    setPage,
    setSort,
    setVisibleColumns,
  } = useDashboardStore();

  const numericColumns = useMemo(
    () => columns.filter((column) => column.type === "number"),
    [columns],
  );

  const dimensionColumns = useMemo(
    () => columns.filter((column) => column.type === "string"),
    [columns],
  );

  const dateColumns = useMemo(
    () => columns.filter((column) => column.type === "date"),
    [columns],
  );

  const columnTypeMap = useMemo(
    () =>
      Object.fromEntries(columns.map((column) => [column.name, column.type])) as Record<
        string,
        "string" | "number" | "date"
      >,
    [columns],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (globalSearch) {
        const needle = globalSearch.toLowerCase();
        const hasHit = Object.values(row).some((value) =>
          formatValue(value).toLowerCase().includes(needle),
        );
        if (!hasHit) return false;
      }

      for (const [column, filter] of Object.entries(columnFilters)) {
        if (!filter) continue;
        const value = formatValue(row[column]).toLowerCase();
        if (!value.includes(filter.toLowerCase())) return false;
      }

      if ((dateRange.from || dateRange.to) && dateColumn) {
        const value = toDate(row[dateColumn]);
        if (!value) return false;

        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          if (value < fromDate) return false;
        }

        if (dateRange.to) {
          const toDateValue = new Date(dateRange.to);
          toDateValue.setHours(23, 59, 59, 999);
          if (value > toDateValue) return false;
        }
      }

      return true;
    });
  }, [rows, globalSearch, columnFilters, dateRange, dateColumn]);

  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortBy, sortDirection),
    [filteredRows, sortBy, sortDirection],
  );

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [safePage, pageSize, sortedRows]);

  const activeColumns = useMemo(() => {
    if (!visibleColumns.length) return columns.map((column) => column.name);
    return visibleColumns;
  }, [columns, visibleColumns]);

  const kpiAggregationValue = useMemo(() => {
    if (!measure) return 0;

    const values = filteredRows
      .map((row) => toNumber(row[measure]))
      .filter((value): value is number => value !== null);

    return aggregateValues(values, aggregation);
  }, [filteredRows, measure, aggregation]);

  const distinctDimensionCount = useMemo(() => {
    if (!dimension) return 0;
    return new Set(filteredRows.map((row) => formatValue(row[dimension]))).size;
  }, [filteredRows, dimension]);

  const barData = useMemo(() => {
    if (!dimension || !measure) return [] as Array<{ name: string; value: number }>;

    const grouped = new Map<string, number[]>();

    filteredRows.forEach((row) => {
      const key = formatValue(row[dimension]);
      if (!grouped.has(key)) grouped.set(key, []);

      if (aggregation === "count") {
        grouped.get(key)?.push(1);
      } else {
        const numeric = toNumber(row[measure]);
        if (numeric !== null) grouped.get(key)?.push(numeric);
      }
    });

    return Array.from(grouped.entries())
      .map(([name, values]) => ({
        name,
        value: aggregateValues(values, aggregation),
      }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 40);
  }, [filteredRows, dimension, measure, aggregation]);

  const pieData = useMemo(() => barData.slice(0, 10), [barData]);

  const radialData = useMemo(
    () =>
      pieData.map((item, index) => ({
        ...item,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      })),
    [pieData],
  );

  const lineData = useMemo(() => {
    if (!dateColumn || !measure) return [] as Array<{ name: string; value: number }>;

    const buckets = new Map<string, number[]>();

    filteredRows.forEach((row) => {
      const parsedDate = toDate(row[dateColumn]);
      if (!parsedDate) return;

      const bucket = formatDateBucket(parsedDate, lineGranularity);
      if (!buckets.has(bucket)) buckets.set(bucket, []);

      if (aggregation === "count") {
        buckets.get(bucket)?.push(1);
      } else {
        const numeric = toNumber(row[measure]);
        if (numeric !== null) buckets.get(bucket)?.push(numeric);
      }
    });

    return Array.from(buckets.entries())
      .map(([name, values]) => ({
        name,
        value: aggregateValues(values, aggregation),
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [filteredRows, dateColumn, measure, lineGranularity, aggregation]);

  const histogramData = useMemo(() => {
    if (!measure) return [] as Array<{ name: string; value: number }>;

    const values = filteredRows
      .map((row) => toNumber(row[measure]))
      .filter((value): value is number => value !== null);

    if (values.length < 2) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
      return [{ name: `${min.toFixed(2)}`, value: values.length }];
    }

    const bins = 8;
    const size = (max - min) / bins;
    const buckets = Array.from({ length: bins }, (_, index) => ({
      min: min + size * index,
      max: min + size * (index + 1),
      count: 0,
    }));

    values.forEach((value) => {
      const bucketIndex = Math.min(bins - 1, Math.floor((value - min) / size));
      buckets[bucketIndex].count += 1;
    });

    return buckets.map((bucket) => ({
      name: `${bucket.min.toFixed(1)}-${bucket.max.toFixed(1)}`,
      value: bucket.count,
    }));
  }, [filteredRows, measure]);

  const scatterAxes = useMemo(() => {
    if (numericColumns.length < 2) return undefined;

    if (measure) {
      const secondary = numericColumns.find((column) => column.name !== measure);
      if (secondary) {
        return {
          x: measure,
          y: secondary.name,
        };
      }
    }

    return {
      x: numericColumns[0].name,
      y: numericColumns[1].name,
    };
  }, [numericColumns, measure]);

  const scatterData = useMemo(() => {
    if (!scatterAxes) return [] as Array<{ x: number; y: number }>;

    return filteredRows
      .map((row) => {
        const x = toNumber(row[scatterAxes.x]);
        const y = toNumber(row[scatterAxes.y]);
        if (x === null || y === null) return null;
        return { x, y };
      })
      .filter((point): point is { x: number; y: number } => point !== null)
      .slice(0, 500);
  }, [filteredRows, scatterAxes]);

  const handleUpload = async (file: File) => {
    try {
      setLoading(true);
      const result = await parseSpreadsheet(file);
      setData(result);
      setShowUploadPanel(false);
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Failed to parse file.");
    } finally {
      setLoading(false);
    }
  };

  const showDashboard = sheets.length > 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(14,116,144,0.35),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(217,119,6,0.22),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(30,58,138,0.24),transparent_40%)]" />
      <div className="relative mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 md:px-8 md:py-8">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <Badge className="bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-300/40">
            Insurance Analytics Studio
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Upload Excel. Get instant insights.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            Interactive KPI cards, charts, and a filterable data grid with persisted
            controls and CSV export.
          </p>
          {showDashboard ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <Badge variant="outline" className="border-cyan-300/40 text-cyan-200">
                <Layers className="mr-1 h-3 w-3" />
                {sheets.length} sheet{sheets.length > 1 ? "s" : ""} loaded
              </Badge>
              <span className="text-slate-400">Current: {activeSheet ?? "-"}</span>
            </div>
          ) : null}
        </motion.header>

        {!showDashboard || showUploadPanel ? (
          <FileUpload loading={loading} onUpload={handleUpload} />
        ) : (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setShowUploadPanel(true)}
            >
              <Upload className="h-4 w-4" />
              Upload another file
            </Button>
          </div>
        )}

        {parseError ? (
          <Card className="border-red-400/40 bg-red-500/10">
            <CardContent className="flex items-start gap-3 p-4 text-red-100">
              <FileWarning className="mt-0.5 h-4 w-4" />
              <p className="text-sm">{parseError}</p>
            </CardContent>
          </Card>
        ) : null}

        {!showDashboard ? (
          <Card className="border-border/60 bg-card/50">
            <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 p-8 text-center">
              <Activity className="h-10 w-10 text-cyan-300" />
              <h2 className="text-xl font-semibold">No dataset loaded yet</h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Upload a file to unlock schema inference, charting, advanced filters,
                and a responsive analytics table.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <motion.section
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              <Card className="border-cyan-300/30 bg-cyan-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-cyan-100/80">Total rows</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{rows.length.toLocaleString()}</CardContent>
              </Card>

              <Card className="border-emerald-300/30 bg-emerald-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-emerald-100/80">Numeric columns</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{numericColumns.length}</CardContent>
              </Card>

              <Card className="border-amber-300/30 bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-amber-100/80">Distinct dimension values</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{distinctDimensionCount.toLocaleString()}</CardContent>
              </Card>

              <Card className="border-violet-300/30 bg-violet-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-violet-100/80">{aggregation}({measure ?? "measure"})</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">{kpiAggregationValue.toLocaleString()}</CardContent>
              </Card>
            </motion.section>

            <Card className="border-border/70 bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Schema controls</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Worksheet</p>
                  <Select
                    value={activeSheet ?? null}
                    onValueChange={(value) => {
                      if (value) setActiveSheet(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sheet" />
                    </SelectTrigger>
                    <SelectContent>
                      {sheets.map((sheet) => (
                        <SelectItem key={sheet.name} value={sheet.name}>
                          {sheet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Dimension</p>
                  <Select
                    value={dimension ?? null}
                    onValueChange={(value) => setDimension(value ?? undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select dimension" />
                    </SelectTrigger>
                    <SelectContent>
                      {dimensionColumns.map((column) => (
                        <SelectItem key={column.name} value={column.name}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Measure</p>
                  <Select
                    value={measure ?? null}
                    onValueChange={(value) => setMeasure(value ?? undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select measure" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map((column) => (
                        <SelectItem key={column.name} value={column.name}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Aggregation</p>
                  <Select
                    value={aggregation}
                    onValueChange={(value) => {
                      if (value) setAggregation(value as Aggregation);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select aggregation" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGGREGATION_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Date column</p>
                  <Select
                    value={dateColumn ?? "none"}
                    onValueChange={(value) =>
                      setDateColumn(value && value !== "none" ? value : undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {dateColumns.map((column) => (
                        <SelectItem key={column.name} value={column.name}>
                          {column.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Line granularity</p>
                  <Select
                    value={lineGranularity}
                    onValueChange={(value) => {
                      if (value) {
                        setLineGranularity(value as "day" | "week" | "month");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                      <SelectItem value="month">Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Global search</p>
                    <Input
                      value={globalSearch}
                      onChange={(event) => setGlobalSearch(event.target.value)}
                      placeholder="Search across all fields..."
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Date from</p>
                    <Input
                      type="date"
                      value={dateRange.from ?? ""}
                      onChange={(event) =>
                        setDateRange({
                          from: event.target.value || undefined,
                          to: dateRange.to,
                        })
                      }
                      disabled={!dateColumn}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Date to</p>
                    <Input
                      type="date"
                      value={dateRange.to ?? ""}
                      onChange={(event) =>
                        setDateRange({
                          from: dateRange.from,
                          to: event.target.value || undefined,
                        })
                      }
                      disabled={!dateColumn}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  {columns.slice(0, 8).map((column) => (
                    <div className="space-y-2" key={column.name}>
                      <p className="truncate text-xs text-muted-foreground">{column.name}</p>
                      <Input
                        value={columnFilters[column.name] ?? ""}
                        onChange={(event) =>
                          setColumnFilter(column.name, event.target.value)
                        }
                        placeholder="Contains..."
                      />
                    </div>
                  ))}
                </div>

                <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
              </CardContent>
            </Card>

            <Tabs defaultValue="charts" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="charts" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <Table2 className="h-4 w-4" />
                  Data table
                </TabsTrigger>
              </TabsList>

              <TabsContent value="charts" className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-base">Bar chart</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                          <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
                          <YAxis tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#22d3ee" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-base">Pie chart (Top 10)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} innerRadius={45}>
                            {pieData.map((_, index) => (
                              <Cell key={`pie-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-base">Radial category share</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart innerRadius="18%" outerRadius="88%" data={radialData} startAngle={180} endAngle={-180}>
                          <RadialBar dataKey="value" cornerRadius={8} />
                          <Legend />
                          <Tooltip />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-base">Distribution histogram</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={histogramData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                          <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                          <YAxis tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#34d399" radius={[5, 5, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {dateColumn ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <Card className="bg-card/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <LineChartIcon className="h-4 w-4" />
                          Line trend by {lineGranularity}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                            <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/50">
                      <CardHeader>
                        <CardTitle className="text-base">Area trend by {lineGranularity}</CardTitle>
                      </CardHeader>
                      <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                            <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="#818cf8" fill="#818cf855" strokeWidth={2.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}

                {scatterAxes && scatterData.length ? (
                  <Card className="bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Scatter correlation: {scatterAxes.x} vs {scatterAxes.y}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" stroke="#33415555" />
                          <XAxis type="number" dataKey="x" name={scatterAxes.x} tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                          <YAxis type="number" dataKey="y" name={scatterAxes.y} tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                          <Scatter data={scatterData} fill="#22d3ee" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : null}
              </TabsContent>

              <TabsContent value="table" className="space-y-3">
                <Card className="bg-card/50">
                  <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-base">
                      {fileName || "Dataset"}
                      {activeSheet ? ` - ${activeSheet}` : ""}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground">
                          <Filter className="h-4 w-4" />
                          Columns
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-80 w-64 overflow-auto">
                          <DropdownMenuLabel>Show / Hide columns</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {columns.map((column) => (
                            <DropdownMenuCheckboxItem
                              key={column.name}
                              checked={activeColumns.includes(column.name)}
                              onCheckedChange={(checked) => {
                                const enabled = Boolean(checked);
                                if (enabled) {
                                  setVisibleColumns(Array.from(new Set([...activeColumns, column.name])));
                                  return;
                                }

                                const next = activeColumns.filter((name) => name !== column.name);
                                if (next.length > 0) setVisibleColumns(next);
                              }}
                            >
                              {column.name}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={() =>
                          exportRowsToCsv(
                            sortedRows,
                            activeColumns,
                            `${fileName || "dataset"}-${activeSheet || "sheet"}`,
                          )
                        }
                      >
                        <Download className="h-4 w-4" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="overflow-x-auto rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {activeColumns.map((column) => (
                              <TableHead key={column}>
                                <button
                                  type="button"
                                  onClick={() => setSort(column)}
                                  className="inline-flex items-center gap-1 text-left"
                                >
                                  <span className="max-w-44 truncate">{column}</span>
                                  {sortBy === column ? (
                                    sortDirection === "asc" ? (
                                      <ArrowUpWideNarrow className="h-3.5 w-3.5" />
                                    ) : (
                                      <ArrowDownWideNarrow className="h-3.5 w-3.5" />
                                    )
                                  ) : null}
                                </button>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedRows.length ? (
                            pagedRows.map((row, rowIndex) => (
                              <TableRow key={`row-${rowIndex}`}>
                                {activeColumns.map((column) => (
                                  <TableCell key={`${rowIndex}-${column}`} className="max-w-56 truncate">
                                    {columnTypeMap[column] === "string" && formatValue(row[column]) !== "-" ? (
                                      <span
                                        className="inline-flex max-w-52 truncate rounded-full border px-2 py-0.5 text-xs font-medium"
                                        style={categoryColor(formatValue(row[column]))}
                                      >
                                        {formatValue(row[column])}
                                      </span>
                                    ) : (
                                      formatValue(row[column])
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={activeColumns.length || 1} className="h-20 text-center text-muted-foreground">
                                No rows match the current filters.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                      <span>
                        Showing {(safePage - 1) * pageSize + (pagedRows.length ? 1 : 0)}-
                        {(safePage - 1) * pageSize + pagedRows.length} of {sortedRows.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(1, safePage - 1))}
                          disabled={safePage <= 1}
                        >
                          Previous
                        </Button>
                        <span className="px-1">
                          Page {safePage} / {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                          disabled={safePage >= totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </main>
  );
}
