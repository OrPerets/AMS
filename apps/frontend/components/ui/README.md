# UI Components Documentation

This directory contains the enterprise-grade UI components for the AMS application. All components follow WCAG 2.1 AA accessibility guidelines and support RTL languages.

## Core Components

### Form System

#### FormField
Provides consistent form field layout with labels, descriptions, and error states.

```tsx
import { FormField } from './form-field'
import { Input } from './input'

<FormField
  label="שם משתמש"
  description="בחר שם משתמש ייחודי"
  error={errors.username}
  required
>
  <Input name="username" placeholder="הכנס שם משתמש" />
</FormField>
```

#### Enhanced Input
Supports multiple sizes, states, and icons.

```tsx
import { Input } from './input'
import { Search, Mail } from 'lucide-react'

// With icons
<Input 
  placeholder="חיפוש..." 
  startIcon={<Search className="h-4 w-4" />}
  size="lg"
/>

// With loading state
<Input 
  loading={isLoading}
  endIcon={<Mail className="h-4 w-4" />}
/>

// Error state
<Input error state="error" />
```

### Feedback Components

#### Alert
Contextual messages with proper semantics and styling.

```tsx
import { Alert, AlertTitle, AlertDescription, AlertIcon } from './alert'

<Alert variant="warning">
  <AlertIcon variant="warning" />
  <AlertTitle>אזהרה</AlertTitle>
  <AlertDescription>
    נתגלתה בעיה שדורשת תשומת לב
  </AlertDescription>
</Alert>
```

#### EmptyState
Consistent empty states across the application.

```tsx
import { EmptyState, EmptySearchResults } from './empty-state'

// Generic empty state
<EmptyState
  title="אין נתונים"
  description="לא נמצאו רשומות במערכת"
  type="empty"
  action={{
    label: "הוסף רשומה חדשה",
    onClick: () => handleAdd()
  }}
/>

// Preset for search results
<EmptySearchResults />
```

### Loading States

#### Enhanced Skeleton
Multiple variants and preset components for consistent loading states.

```tsx
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonAvatar 
} from './skeleton'

// Basic skeleton with shimmer effect
<Skeleton className="h-4 w-full" variant="shimmer" />

// Text content
<SkeletonText lines={3} />

// Table loading
<SkeletonTable rows={5} columns={4} />
```

### Error Handling

#### ErrorBoundary
Graceful error handling with user-friendly fallbacks.

```tsx
import { ErrorBoundary, CompactErrorFallback } from './error-boundary'

<ErrorBoundary fallback={CompactErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

## Data Display

### Enhanced Badge
Status-aware badges with semantic colors.

```tsx
import { Badge } from './badge'

<Badge variant="success">הושלם</Badge>
<Badge variant="warning">ממתין</Badge>
<Badge variant="destructive">שגיאה</Badge>

// Status-specific variants
<Badge variant="open">פתוח</Badge>
<Badge variant="in-progress">בתהליך</Badge>
<Badge variant="resolved">נפתר</Badge>
```

### DataTable
Enhanced with better empty states, filters, and accessibility.

```tsx
import { DataTable } from './data-table'
import { columns } from './columns' // Your column definitions

<DataTable
  columns={columns}
  data={data}
  searchPlaceholder="חיפוש..."
  filterableColumns={[
    { id: 'status', title: 'סטטוס' },
    { id: 'priority', title: 'עדיפות' }
  ]}
  onRowClick={handleRowClick}
/>
```

## Design Tokens

The components use the following design tokens defined in `globals.css`:

- **Colors**: Primary, success, warning, destructive, info
- **Spacing**: Consistent spacing scale with RTL support
- **Typography**: Hebrew-first with fallbacks
- **Shadows**: Elevation system (1-4 levels)
- **Animations**: Respects `prefers-reduced-motion`

## Accessibility Features

All components include:

- ✅ Proper semantic HTML
- ✅ ARIA attributes where needed
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader support
- ✅ High contrast ratios
- ✅ RTL language support

## RTL Support

Components are designed RTL-first:
- Text direction automatically adjusts
- Icons and layouts flip appropriately
- Spacing uses logical properties (`margin-inline-start`, etc.)

## Performance

- Components use `React.forwardRef` for proper ref forwarding
- Variants use `class-variance-authority` for efficient class generation
- Animations respect user preferences
- Images and icons are optimized for fast loading
