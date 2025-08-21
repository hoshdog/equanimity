# Responsive Design Guidelines

## Overview
This document outlines the responsive design patterns and best practices implemented in the Equanimity application to ensure optimal user experience across all device sizes.

## Problem Statement
The quotes dashboard was experiencing horizontal scroll issues due to displaying too many table columns (10+ columns) without responsive handling. This created poor user experience on smaller screens and tablets.

## Solution Architecture

### 1. ResponsiveDataTable Component
A new enhanced data table component was created at `src/components/ui/responsive-data-table.tsx` that provides:

- **Automatic column visibility management** based on screen size
- **Mobile card view** for very small screens
- **Responsive breakpoint detection** using media queries
- **Column priority system** for intelligent hiding/showing

### 2. Responsive Breakpoints
```typescript
// Standard breakpoints used throughout the application
const breakpoints = {
  mobile: "(max-width: 640px)",     // < 640px
  tablet: "(max-width: 1024px)",    // 640px - 1024px
  desktop: "(min-width: 1024px)"    // > 1024px
}
```

### 3. Column Priority System

#### Column Metadata Structure
```typescript
interface ResponsiveColumnMeta {
  hideOnMobile?: boolean    // Hide column on mobile devices
  hideOnTablet?: boolean    // Hide column on tablets
  essential?: boolean       // Always visible regardless of screen size
  mobileComponent?: (row: any) => React.ReactNode  // Custom mobile renderer
}
```

#### Priority Classifications
- **Essential Columns** (Always Visible):
  - Primary identifiers (ID, Number, Name)
  - Critical status information
  - Key financial data (Total Amount)
  - Action buttons

- **Important Columns** (Hidden on Mobile):
  - Secondary information (Customer, Project)
  - Date fields (Created, Due Date)
  - Additional context

- **Optional Columns** (Hidden on Mobile & Tablet):
  - Analytical data (Likelihood, Profit)
  - Detailed timestamps
  - Extended metadata

## Implementation Patterns

### 1. Basic Responsive Table Setup
```typescript
import { ResponsiveDataTable } from '@/components/ui/responsive-data-table';

const columns: ColumnDef<DataType>[] = [
  {
    accessorKey: "id",
    header: "ID",
    enableHiding: false, // Always visible
    meta: {
      essential: true
    } as ResponsiveColumnMeta
  },
  {
    accessorKey: "details",
    header: "Details",
    meta: {
      hideOnMobile: true  // Hidden on mobile
    } as ResponsiveColumnMeta
  },
  {
    accessorKey: "analytics",
    header: "Analytics",
    meta: {
      hideOnMobile: true,
      hideOnTablet: true  // Hidden on mobile and tablet
    } as ResponsiveColumnMeta
  }
];

// Usage
<ResponsiveDataTable 
  columns={columns} 
  data={data}
  mobileCardRenderer={mobileCardRenderer}
  enableMobileView={true}
/>
```

### 2. Mobile Card View Implementation
```typescript
const mobileCardRenderer = (item: DataType) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex justify-between">
        <h3>{item.title}</h3>
        <Badge>{item.status}</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <p>{item.description}</p>
      <div className="text-right font-bold">
        ${item.amount}
      </div>
    </CardContent>
  </Card>
);
```

### 3. Responsive Column Cells
```typescript
// Use truncation for long text
cell: ({ row }) => (
  <div className="max-w-[200px] truncate" title={row.original.name}>
    {row.original.name}
  </div>
)

// Use whitespace-nowrap for dates/numbers
cell: ({ row }) => (
  <span className="whitespace-nowrap">
    {format(row.original.date, 'MMM d, yyyy')}
  </span>
)

// Compact formats for mobile
cell: ({ row }) => (
  <span className="whitespace-nowrap">
    {/* Full format on desktop, compact on mobile */}
    <span className="hidden sm:inline">
      {format(row.original.date, 'MMMM d, yyyy')}
    </span>
    <span className="sm:hidden">
      {format(row.original.date, 'MMM d')}
    </span>
  </span>
)
```

## Best Practices

### 1. Container Management
```css
/* Prevent horizontal scroll at page level */
.page-container {
  max-width: 100%;
  overflow-x: hidden;
}

/* Allow scroll within table container only */
.table-container {
  overflow-x: auto;
  overflow-y: hidden;
}
```

### 2. Responsive Padding
```tsx
// Use responsive padding classes
<div className="p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>
```

### 3. Flexible Layouts
```tsx
// Stack on mobile, side-by-side on desktop
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
  <h2>Title</h2>
  <Button>Action</Button>
</div>
```

### 4. Grid Responsiveness
```tsx
// Responsive grid columns
<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
  {/* Cards */}
</div>
```

## Testing Guidelines

### Breakpoint Testing
Test the application at these specific viewport widths:
- **320px** - Minimum mobile (iPhone SE)
- **375px** - Standard mobile (iPhone)
- **640px** - Breakpoint boundary (mobile/tablet)
- **768px** - Tablet portrait
- **1024px** - Breakpoint boundary (tablet/desktop)
- **1280px** - Standard desktop
- **1920px** - Full HD desktop

### Column Visibility Testing
Verify that:
1. Essential columns are always visible
2. Important columns hide appropriately on mobile
3. Optional columns hide on both mobile and tablet
4. No horizontal scroll appears at any breakpoint
5. Mobile card view activates below 640px

### Performance Testing
- Ensure smooth transitions between breakpoints
- Verify no layout shifts during responsive changes
- Test scroll performance on mobile devices
- Validate touch interactions on mobile

## Migration Guide

### Converting Existing DataTables
1. **Import ResponsiveDataTable** instead of DataTable
2. **Add column metadata** for responsive behavior
3. **Create mobile card renderer** for optimal mobile UX
4. **Test across breakpoints** to verify behavior

### Example Migration
```typescript
// Before
import { DataTable } from '@/components/ui/data-table';
<DataTable columns={columns} data={data} />

// After
import { ResponsiveDataTable } from '@/components/ui/responsive-data-table';
<ResponsiveDataTable 
  columns={columns} 
  data={data}
  mobileCardRenderer={mobileCardRenderer}
  enableMobileView={true}
/>
```

## Component Reference

### ResponsiveDataTable Props
```typescript
interface ResponsiveDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]    // Column definitions with meta
  data: TData[]                           // Table data
  globalFilter?: string                   // Global search filter
  setGlobalFilter?: (value: string) => void
  mobileCardRenderer?: (item: TData) => React.ReactNode  // Mobile card view
  enableMobileView?: boolean              // Enable mobile card view (default: true)
}
```

### ResponsiveColumnMeta Interface
```typescript
interface ResponsiveColumnMeta {
  hideOnMobile?: boolean      // Hide column on mobile (<640px)
  hideOnTablet?: boolean      // Hide column on tablet (<1024px)
  essential?: boolean         // Always visible
  mobileComponent?: (row: any) => React.ReactNode  // Custom mobile renderer
}
```

## Common Issues & Solutions

### Issue: Horizontal Scroll Still Appears
**Solution**: Check for:
- Fixed width elements in cells
- Long unbreakable text (use `truncate` or `break-words`)
- Missing `overflow-hidden` on parent containers
- Absolute positioned elements extending beyond viewport

### Issue: Columns Not Hiding on Mobile
**Solution**: Ensure:
- Column meta is properly typed with `as ResponsiveColumnMeta`
- Media queries are correctly set in useMediaQuery hook
- Column has proper accessorKey or id for visibility tracking

### Issue: Mobile Card View Not Showing
**Solution**: Verify:
- `enableMobileView` prop is set to true
- `mobileCardRenderer` function is provided
- Screen width is below 640px threshold

## Future Enhancements

### Planned Features
1. **User-configurable column visibility** - Allow users to choose visible columns
2. **Persistent column preferences** - Save user's column choices
3. **Advanced mobile gestures** - Swipe actions for mobile cards
4. **Virtual scrolling** - For large datasets
5. **Responsive column widths** - Dynamic width allocation based on content

### Performance Optimizations
1. **Lazy loading** for off-screen columns
2. **Memoization** of mobile card renderers
3. **Debounced resize handlers** for smoother transitions
4. **CSS-only responsive hiding** where possible

## Conclusion
The responsive design system ensures that the Equanimity application provides an optimal user experience across all device sizes. By implementing intelligent column management, mobile-specific views, and responsive layouts, we've eliminated horizontal scroll issues while maintaining full functionality.

---

*Last Updated: December 2024*
*Version: 1.0*
*Status: Production Ready*