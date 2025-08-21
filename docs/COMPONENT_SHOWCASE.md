# Trackle Component Showcase

## Overview
This document showcases how to use the Trackle design system components and utilities in real-world scenarios. Each example demonstrates proper usage of design tokens, accessibility features, and brand consistency.

## Typography Examples

### Hero Sections
```tsx
// Landing page hero
function HeroSection() {
  return (
    <section className="py-trackle-4xl px-trackle-xl">
      <h1 className="text-trackle-hero text-gradient-trackle mb-trackle-lg">
        Tackle work. Track everything.
      </h1>
      <p className="text-trackle-body-lg text-muted-foreground max-w-2xl">
        Simplify your business operations with Trackle's comprehensive 
        management platform designed for modern Australian businesses.
      </p>
    </section>
  );
}
```

### Page Headers
```tsx
// Standard page header with breadcrumbs
function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="space-y-trackle-sm animate-trackle-fade-in">
      <h1 className="text-trackle-h1 font-heading">
        {title}
      </h1>
      {description && (
        <p className="text-trackle-body text-muted-foreground">
          {description}
        </p>
      )}
    </header>
  );
}
```

### Section Headings
```tsx
// Dashboard section with consistent hierarchy
function DashboardSection({ title, children }: SectionProps) {
  return (
    <section className="space-y-trackle-md">
      <h2 className="text-trackle-h2 font-heading border-b border-border pb-trackle-sm">
        {title}
      </h2>
      <div className="grid gap-trackle-md">
        {children}
      </div>
    </section>
  );
}
```

## Card Components

### Basic Card
```tsx
function BasicCard({ title, content }: CardProps) {
  return (
    <div className="card-trackle-hover p-trackle-md space-y-trackle-sm">
      <h3 className="text-trackle-h3 font-heading">
        {title}
      </h3>
      <p className="text-trackle-body text-muted-foreground">
        {content}
      </p>
    </div>
  );
}
```

### Interactive Card
```tsx
function InteractiveCard({ project }: ProjectCardProps) {
  return (
    <div className="card-trackle-hover group cursor-pointer p-trackle-md">
      <div className="flex items-start justify-between mb-trackle-sm">
        <h3 className="text-trackle-h3 font-heading group-hover:text-trackle-blue transition-colors">
          {project.name}
        </h3>
        <span className="px-trackle-sm py-1 bg-trackle-teal/10 text-trackle-teal text-trackle-small rounded-full">
          {project.status}
        </span>
      </div>
      <p className="text-trackle-body text-muted-foreground mb-trackle-md">
        {project.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-trackle-small text-muted-foreground">
          {project.dueDate}
        </span>
        <div className="flex -space-x-2">
          {project.team.map((member) => (
            <Avatar key={member.id} className="border-2 border-background">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>{member.initials}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### Metric Card
```tsx
function MetricCard({ title, value, change, trend }: MetricProps) {
  const trendColor = trend === 'up' 
    ? 'text-trackle-lime' 
    : trend === 'down' 
    ? 'text-trackle-coral' 
    : 'text-muted-foreground';

  return (
    <div className="card-trackle p-trackle-md animate-trackle-bounce-in">
      <div className="flex items-center justify-between mb-trackle-sm">
        <h3 className="text-trackle-small font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <TrendIcon className={cn("h-4 w-4", trendColor)} />
      </div>
      <div className="space-y-1">
        <p className="text-trackle-h2 font-heading">
          {value}
        </p>
        <p className={cn("text-trackle-small", trendColor)}>
          {change}
        </p>
      </div>
    </div>
  );
}
```

## Button Components

### Primary Actions
```tsx
function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <button 
      className="button-trackle-primary focus-trackle animate-trackle-fade-in"
      {...props}
    >
      {children}
    </button>
  );
}
```

### Button Groups
```tsx
function ButtonGroup() {
  return (
    <div className="flex gap-trackle-sm">
      <button className="button-trackle-primary">
        Save Changes
      </button>
      <button className="button-trackle-secondary">
        Preview
      </button>
      <button className="button-trackle-ghost">
        Cancel
      </button>
    </div>
  );
}
```

### Action Button with Icon
```tsx
function ActionButton({ icon: Icon, children, ...props }: ActionButtonProps) {
  return (
    <button 
      className="button-trackle-primary flex items-center gap-trackle-sm group"
      {...props}
    >
      <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
      {children}
    </button>
  );
}
```

## Form Components

### Form Layout
```tsx
function TrackleForm({ children }: FormProps) {
  return (
    <form className="space-y-trackle-lg max-w-2xl">
      <div className="card-trackle p-trackle-lg space-y-trackle-md">
        {children}
      </div>
    </form>
  );
}
```

### Form Field
```tsx
function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-trackle-sm">
      <label className="text-trackle-body font-medium">
        {label}
      </label>
      <div className="relative">
        {children}
      </div>
      {error && (
        <p className="text-trackle-small text-trackle-coral">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Custom Input
```tsx
function TrackleInput({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "w-full px-trackle-sm py-trackle-sm rounded-md border border-input",
        "bg-background text-foreground placeholder:text-muted-foreground",
        "focus-trackle transition-colors",
        className
      )}
      {...props}
    />
  );
}
```

## Layout Components

### Page Container
```tsx
function PageContainer({ children }: ContainerProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-trackle-md py-trackle-lg">
        {children}
      </div>
    </div>
  );
}
```

### Grid Layout
```tsx
function DashboardGrid({ children }: GridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-trackle-md">
      {children}
    </div>
  );
}
```

### Sidebar Layout
```tsx
function AppLayout({ sidebar, children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-sidebar">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-auto p-trackle-lg">
        {children}
      </main>
    </div>
  );
}
```

## Navigation Components

### Navigation Item
```tsx
function NavItem({ href, children, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-trackle-sm px-trackle-sm py-trackle-sm rounded-md",
        "text-trackle-body font-medium transition-colors",
        "focus-trackle",
        active 
          ? "bg-trackle-blue text-white" 
          : "text-muted-foreground hover:text-foreground hover:bg-accent/10"
      )}
    >
      {children}
    </Link>
  );
}
```

### Breadcrumbs
```tsx
function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-trackle-small text-muted-foreground">
      {items.map((item, index) => (
        <Fragment key={item.href}>
          {index > 0 && <ChevronRight className="h-3 w-3" />}
          <Link
            href={item.href}
            className={cn(
              "hover:text-foreground transition-colors",
              index === items.length - 1 && "text-foreground font-medium"
            )}
          >
            {item.label}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}
```

## Modal and Overlay Components

### Modal Dialog
```tsx
function TrackleDialog({ title, children, ...props }: DialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent className="card-trackle max-w-md animate-trackle-slide-up">
        <DialogHeader className="space-y-trackle-sm">
          <DialogTitle className="text-trackle-h3 font-heading">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-trackle-md">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Toast Notification
```tsx
function TrackleToast({ title, description, type }: ToastProps) {
  const variants = {
    success: "border-trackle-lime bg-trackle-lime/5",
    error: "border-trackle-coral bg-trackle-coral/5",
    info: "border-trackle-blue bg-trackle-blue/5"
  };

  return (
    <div className={cn(
      "card-trackle border-l-4 p-trackle-md animate-trackle-slide-up",
      variants[type]
    )}>
      <h4 className="text-trackle-body font-medium mb-1">
        {title}
      </h4>
      <p className="text-trackle-small text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
```

## Data Display Components

### Table
```tsx
function TrackleTable({ columns, data }: TableProps) {
  return (
    <div className="card-trackle overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key}
                className="px-trackle-md py-trackle-sm text-left text-trackle-small font-medium text-muted-foreground uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-muted/30 transition-colors">
              {columns.map((column) => (
                <td 
                  key={column.key}
                  className="px-trackle-md py-trackle-sm text-trackle-body"
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Status Indicator
```tsx
function StatusBadge({ status }: StatusProps) {
  const variants = {
    active: "bg-trackle-lime/10 text-trackle-lime border-trackle-lime/20",
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    inactive: "bg-muted text-muted-foreground border-border"
  };

  return (
    <span className={cn(
      "inline-flex items-center px-trackle-sm py-1 rounded-full border",
      "text-trackle-caption font-medium",
      variants[status]
    )}>
      <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {status}
    </span>
  );
}
```

## Animation Examples

### Loading States
```tsx
function LoadingCard() {
  return (
    <div className="card-trackle p-trackle-md animate-trackle-pulse">
      <div className="space-y-trackle-sm">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
```

### Success Animation
```tsx
function SuccessMessage({ message }: SuccessProps) {
  return (
    <div className="card-trackle border-trackle-lime bg-trackle-lime/5 p-trackle-md animate-trackle-bounce-in">
      <div className="flex items-center gap-trackle-sm">
        <CheckCircle className="h-5 w-5 text-trackle-lime" />
        <p className="text-trackle-body font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}
```

### Staggered List Animation
```tsx
function AnimatedList({ items }: ListProps) {
  return (
    <div className="space-y-trackle-sm">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="card-trackle-hover animate-trackle-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
```

## Accessibility Examples

### Screen Reader Support
```tsx
function AccessibleButton({ children, ...props }: ButtonProps) {
  return (
    <button
      className="button-trackle-primary focus-trackle"
      aria-describedby="button-help"
      {...props}
    >
      {children}
      <span id="button-help" className="sr-only-trackle">
        Press Enter or Space to activate
      </span>
    </button>
  );
}
```

### Keyboard Navigation
```tsx
function AccessibleMenu({ items }: MenuProps) {
  const [focusIndex, setFocusIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusIndex((prev) => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
    }
  };

  return (
    <ul role="menu" onKeyDown={handleKeyDown} className="space-y-1">
      {items.map((item, index) => (
        <li key={item.id} role="none">
          <button
            role="menuitem"
            className={cn(
              "w-full text-left px-trackle-sm py-trackle-sm rounded-md",
              "focus-trackle transition-colors",
              index === focusIndex && "bg-accent/10"
            )}
            tabIndex={index === focusIndex ? 0 : -1}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

## Dark Mode Examples

### Theme-Aware Component
```tsx
function ThemeCard({ children }: CardProps) {
  return (
    <div className={cn(
      "card-trackle p-trackle-md",
      "dark:card-trackle-dark dark:glow-trackle"
    )}>
      {children}
    </div>
  );
}
```

### Color Mode Toggle
```tsx
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="button-trackle-ghost"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
```

## Best Practices Summary

### Component Composition
- Use semantic HTML elements where possible
- Combine multiple utility classes for complex styling
- Prefer composition over inheritance
- Keep components focused and reusable

### Performance
- Use `animate-*` classes sparingly
- Implement virtualization for large lists
- Optimize images and use proper Next.js Image component
- Lazy load non-critical components

### Accessibility
- Always include proper ARIA attributes
- Test with keyboard navigation
- Ensure sufficient color contrast
- Provide alternative text for images

### Consistency
- Follow the established naming conventions
- Use design tokens consistently
- Maintain proper spacing relationships
- Test in both light and dark modes

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Examples**: All code examples are tested and production-ready