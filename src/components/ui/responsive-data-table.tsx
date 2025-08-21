"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { DataTableViewOptions } from "@/components/ui/data-table-view-options"
import { useMediaQuery } from "@/hooks/use-media-query"
import { cn } from "@/lib/utils"

export interface ResponsiveColumnMeta {
  hideOnMobile?: boolean
  hideOnTablet?: boolean
  essential?: boolean
  mobileComponent?: (row: any) => React.ReactNode
}

interface ResponsiveDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  globalFilter?: string
  setGlobalFilter?: (value: string) => void
  mobileCardRenderer?: (item: TData) => React.ReactNode
  enableMobileView?: boolean
}

export function ResponsiveDataTable<TData, TValue>({
  columns,
  data,
  globalFilter,
  setGlobalFilter,
  mobileCardRenderer,
  enableMobileView = true,
}: ResponsiveDataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  
  // Media queries for responsive breakpoints
  const isMobile = useMediaQuery("(max-width: 640px)")
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  // Update column visibility based on screen size
  React.useEffect(() => {
    const newVisibility: VisibilityState = {}
    
    columns.forEach((column: any) => {
      const meta = column.meta as ResponsiveColumnMeta
      const accessorKey = column.accessorKey || column.id
      
      if (!accessorKey) return
      
      // Default to visible
      let isVisible = true
      
      // Check if column should be hidden based on screen size
      if (meta?.hideOnMobile && isMobile) {
        isVisible = false
      } else if (meta?.hideOnTablet && isTablet && !isDesktop) {
        isVisible = false
      }
      
      // Essential columns are always visible
      if (meta?.essential) {
        isVisible = true
      }
      
      // enableHiding: false means always visible
      if (column.enableHiding === false) {
        isVisible = true
      }
      
      newVisibility[accessorKey] = isVisible
    })
    
    setColumnVisibility(newVisibility)
  }, [columns, isMobile, isTablet, isDesktop])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Mobile card view for very small screens
  if (enableMobileView && isMobile && mobileCardRenderer) {
    return (
      <div className="space-y-4 p-4">
        {setGlobalFilter && <DataTableViewOptions table={table} />}
        <div className="space-y-3">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <div key={row.id}>
                {mobileCardRenderer(row.original)}
              </div>
            ))
          ) : (
            <Card>
              <CardContent className="h-24 flex items-center justify-center">
                <p className="text-muted-foreground">No results.</p>
              </CardContent>
            </Card>
          )}
        </div>
        <DataTablePagination table={table} />
      </div>
    )
  }

  // Regular table view with responsive columns
  return (
    <div className="space-y-4">
      {setGlobalFilter && (
        <div className="px-4 pt-4">
          <DataTableViewOptions table={table} />
        </div>
      )}
      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        colSpan={header.colSpan}
                        className={cn(
                          "whitespace-nowrap",
                          header.column.getCanSort() && "cursor-pointer select-none"
                        )}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className="whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="px-4 pb-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}