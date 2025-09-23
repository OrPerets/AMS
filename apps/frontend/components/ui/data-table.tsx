// /Users/orperetz/Documents/AMS/apps/frontend/components/ui/data-table.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { cn } from "../../lib/utils";
import { Badge } from "./badge";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterableColumn<TData> {
  id: keyof TData extends string ? keyof TData : string;
  title?: string;
  options?: FilterOption[];
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  className?: string;
  onRowClick?: (row: TData) => void;
  filterableColumns?: FilterableColumn<TData>[];
  onFiltersChange?: (filters: Record<string, string[]>) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "חיפוש...",
  className,
  onRowClick,
  filterableColumns,
  onFiltersChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnValueFilters, setColumnValueFilters] = useState<Record<string, string[]>>({});

  const resolvedFilters = useMemo(() => {
    if (!filterableColumns || filterableColumns.length === 0) {
      return [] as (FilterableColumn<TData> & { options: FilterOption[] })[];
    }

    return filterableColumns.map((filter) => {
      const columnId = String(filter.id);
      const options =
        filter.options ||
        Array.from(
          new Set(
            data.flatMap((row) => {
              const value = (row as any)[columnId];
              if (value == null) return [];
              if (Array.isArray(value)) {
                return value.map((item) => String(item));
              }
              return [String(value)];
            })
          )
        ).map((value) => ({ label: value, value }));

      return {
        ...filter,
        id: columnId,
        title: filter.title ?? columnId,
        options,
      } as FilterableColumn<TData> & { options: FilterOption[] };
    });
  }, [filterableColumns, data]);

  const filteredData = useMemo(() => {
    const hasFilters = Object.values(columnValueFilters).some((values) => values?.length);
    if (!hasFilters) {
      return data;
    }

    return data.filter((row) =>
      Object.entries(columnValueFilters).every(([columnId, selectedValues]) => {
        if (!selectedValues || selectedValues.length === 0) {
          return true;
        }
        const value = (row as any)[columnId];
        if (value == null) {
          return false;
        }
        if (Array.isArray(value)) {
          return value.some((item) => selectedValues.includes(String(item)));
        }
        return selectedValues.includes(String(value));
      })
    );
  }, [data, columnValueFilters]);

  useEffect(() => {
    onFiltersChange?.(columnValueFilters);
  }, [columnValueFilters, onFiltersChange]);

  const toggleFilterValue = (columnId: string, value: string) => {
    setColumnValueFilters((prev) => {
      const current = prev[columnId] ?? [];
      const exists = current.includes(value);
      const nextValues = exists ? current.filter((item) => item !== value) : [...current, value];
      const nextState = { ...prev, [columnId]: nextValues };
      if (nextValues.length === 0) {
        delete nextState[columnId];
      }
      return { ...nextState };
    });
  };

  const clearFilters = () => {
    setColumnValueFilters({});
  };

  const hasActiveFilters = Object.values(columnValueFilters).some((values) => values?.length);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Global Search */}
          <div className="relative">
            <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="ps-8 max-w-sm"
            />
          </div>
          
          {/* Column-specific filter */}
          {searchKey && (
            <Input
              placeholder={`סנן לפי ${searchKey}...`}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          )}
        </div>
        
        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ms-auto">
              <SlidersHorizontal className="me-2 h-4 w-4" />
              עמודות
              <ChevronDown className="ms-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      {resolvedFilters.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {resolvedFilters.map((filter) => (
              <DropdownMenu key={filter.id as string}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={
                      columnValueFilters[String(filter.id)]?.length ? "default" : "outline"
                    }
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    {filter.title}
                    {columnValueFilters[String(filter.id)]?.length ? (
                      <span className="text-xs">
                        ({columnValueFilters[String(filter.id)].length})
                      </span>
                    ) : null}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {filter.options.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.value}
                      checked={
                        columnValueFilters[String(filter.id)]?.includes(option.value) ?? false
                      }
                      onCheckedChange={() =>
                        toggleFilterValue(String(filter.id), option.value)
                      }
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="me-1 h-4 w-4" /> נקה סינונים
              </Button>
            )}
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {resolvedFilters.flatMap((filter) =>
                (columnValueFilters[String(filter.id)] ?? []).map((value) => (
                  <Badge
                    key={`${String(filter.id)}-${value}`}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <span className="font-medium">{filter.title}:</span> {value}
                    <button
                      type="button"
                      onClick={() => toggleFilterValue(String(filter.id), value)}
                      className="text-muted-foreground transition hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border data-table">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-12 px-4 text-start align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pe-0"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="p-4 align-middle [&:has([role=checkbox])]:pe-0"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    אין תוצאות.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} מתוך{" "}
          {table.getFilteredRowModel().rows.length} שורות נבחרו.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">שורות בעמוד</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            עמוד {table.getState().pagination.pageIndex + 1} מתוך{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">לעמוד הראשון</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">לעמוד הקודם</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">לעמוד הבא</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">לעמוד האחרון</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
