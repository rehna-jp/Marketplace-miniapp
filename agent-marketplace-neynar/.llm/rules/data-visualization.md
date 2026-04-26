# Data Visualization - Charts, Analytics, Dashboards, Metrics

## Prerequisites

**MUST LOAD FIRST:** `.llm/rules/core-coding-standards.md`

<use-case>
Data visualization and analytics features including charts, graphs, statistics displays, dashboards, and metrics
</use-case>

<when-to-load>
Load this file when the user requests:
- Charts or graphs (line, bar, pie, etc.)
- Analytics dashboards
- Statistics or metrics display
- Leaderboards with numerical data
- Performance tracking displays
- Data comparison views
- Trend visualization
- Real-time data displays
</when-to-load>

<mobile-first-philosophy>
**CRITICAL**: Mobile mini apps have severe size constraints (424x695px). Complex charts and visualizations that work on desktop often fail on mobile.

**Golden Rules for Mobile Data Visualization**:

1. **Prefer simple stat cards over complex charts**
2. **Maximum 4 metrics in a 2x2 grid**
3. **If charts are needed, keep them extremely simple**
4. **Reduce data points for mobile (max 6-8 visible points)**
5. **Avoid multi-axis charts - too complex for mobile**
6. **Use progress bars and simple bars over line/area charts**
7. **Touch-friendly interactions only**
   </mobile-first-philosophy>

<recommended-approach>
**For mobile mini apps, prioritize simplicity**:

✅ **Recommended**:

- 2x2 grid of stat cards
- Simple horizontal/vertical bars
- Progress indicators
- Percentage displays
- Compact number formatting

❌ **Avoid**:

- Complex multi-line charts
- Charts with >8 data points
- Multi-axis charts
- Interactive hover states (no hover on mobile)
- Dense data tables
- Pie charts with >4 slices
  </recommended-approach>

<sdk-components>
<ui-components>
Essential UI components from `@neynar/ui`:

**Layout**:

- `Card`, `CardHeader`, `CardContent` - For stat cards and metric displays
- `Stack` - For organizing metrics
- `Container` - For page containers

**Typography**:

- `H2`, `H3` - For metric values (large, prominent)
- `P` - For labels and descriptions
- `Small` - For metadata and context

**Display**:

- `Badge` - For status indicators and tags
- `Progress` - For progress bars (if available)

**Feedback**:

- `Skeleton` - Loading states for metrics
- `EmptyState` - No data available states
  </ui-components>

<api-hooks>
Relevant data hooks (depending on data source):

**Price Data** (if needed):

- `useCoinGeckoMarketChart` - Historical price data
- `useCoinGeckoPrice` - Current prices

**Social Data** (if needed):

- `useNeynarUserBulk` - User statistics
- `useNeynarFeedFollowing` - Feed data for analysis

**Custom Data**:

- Create custom API endpoints for app-specific analytics
- Use React Query for data fetching
  </api-hooks>
  </sdk-components>

<mobile-patterns>
<pattern name="Stats Grid (Recommended)">
**Structure**: 2x2 grid of stat cards - the best mobile approach

```typescript
import { Card, CardContent, H3, Small } from '@neynar/ui';

type Stat = {
  id: string;
  label: string;
  value: string | number;
  change?: string;
};

function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
      {stats.slice(0, 4).map(stat => (
        <Card key={stat.id}>
          <CardContent className="p-4 text-center">
            <H3>{stat.value}</H3>
            <Small color="muted">{stat.label}</Small>
            {stat.change && (
              <Small color={stat.change.startsWith('+') ? 'default' : 'destructive'}>
                {stat.change}
              </Small>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Usage
<StatsGrid
  stats={[
    { id: '1', label: 'Total Users', value: '1,234', change: '+12%' },
    { id: '2', label: 'Active Today', value: '567', change: '+5%' },
    { id: '3', label: 'Total Posts', value: '8,901', change: '+23%' },
    { id: '4', label: 'Engagement', value: '45%', change: '-3%' },
  ]}
/>
```

**Why This Works**:

- No chart library needed
- Fast rendering
- Easy to read on small screens
- Touch-friendly
- Works with any data
  </pattern>

<pattern name="Simple Horizontal Bars">
**Structure**: CSS-based horizontal bars (no library needed)

```typescript
import { Stack, Card, CardContent, P, Small } from '@neynar/ui';

type BarData = {
  label: string;
  value: number;
  maxValue: number;
};

function HorizontalBars({ data }: { data: BarData[] }) {
  return (
    <Stack direction="vertical" spacing={3}>
      {data.map((item, idx) => {
        const percentage = (item.value / item.maxValue) * 100;

        return (
          <Card key={idx}>
            <CardContent className="p-3">
              <Stack direction="vertical" spacing={2}>
                <Stack direction="horizontal" spacing={2} className="justify-between">
                  <P className="truncate">{item.label}</P>
                  <Small>{item.value}</Small>
                </Stack>

                {/* Simple CSS bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

// Usage
<HorizontalBars
  data={[
    { label: 'React', value: 85, maxValue: 100 },
    { label: 'TypeScript', value: 72, maxValue: 100 },
    { label: 'Next.js', value: 68, maxValue: 100 },
    { label: 'Tailwind', value: 91, maxValue: 100 },
  ]}
/>
```

**Why This Works**:

- Pure CSS, no libraries
- Simple and performant
- Easy to understand
- Touch-friendly
- Responsive
  </pattern>

<pattern name="Metric Comparison (2-column)">
**Structure**: Side-by-side comparison cards

```typescript
import { Card, CardContent, H2, P, Small, Badge } from '@neynar/ui';

type Comparison = {
  label: string;
  current: number;
  previous: number;
};

function MetricComparison({ comparison }: { comparison: Comparison }) {
  const change = comparison.current - comparison.previous;
  const changePercent = ((change / comparison.previous) * 100).toFixed(1);
  const isIncrease = change > 0;

  return (
    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
      <Card>
        <CardContent className="p-4 text-center">
          <Small color="muted">Current</Small>
          <H2>{comparison.current}</H2>
          <P>{comparison.label}</P>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Small color="muted">Previous</Small>
          <H2>{comparison.previous}</H2>
          <Badge variant={isIncrease ? 'default' : 'destructive'}>
            {isIncrease ? '+' : ''}{changePercent}%
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Why This Works**:

- Clear comparison
- Maximum grid-cols-2
- Color-coded change
- Simple and readable
  </pattern>

<pattern name="Compact Data Table (If Absolutely Needed)">
**Structure**: Very simple 2-column table for small datasets

```typescript
import { Card, CardContent, Stack, P, Small } from '@neynar/ui';

type TableRow = {
  label: string;
  value: string;
};

function CompactTable({ rows }: { rows: TableRow[] }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Stack direction="vertical" spacing={2}>
          {rows.slice(0, 6).map((row, idx) => (
            <Stack
              key={idx}
              direction="horizontal"
              spacing={2}
              className="justify-between border-b pb-2 last:border-0"
            >
              <Small className="truncate">{row.label}</Small>
              <P>{row.value}</P>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

// Usage
<CompactTable
  rows={[
    { label: 'Total Revenue', value: '$12,345' },
    { label: 'Total Users', value: '1,234' },
    { label: 'Active Users', value: '567' },
    { label: 'Conversion Rate', value: '3.2%' },
  ]}
/>
```

**Critical Rules**:

- Maximum 6 rows (any more requires scrolling)
- Only 2 columns (label + value)
- Truncate long labels
- Keep values short and formatted
  </pattern>

<pattern name="Progress Indicators">
**Structure**: Circular or linear progress for goals/completion

```typescript
import { Card, CardContent, H3, P, Small } from '@neynar/ui';

type ProgressMetric = {
  label: string;
  current: number;
  goal: number;
};

function ProgressCard({ metric }: { metric: ProgressMetric }) {
  const percentage = Math.min((metric.current / metric.goal) * 100, 100);

  return (
    <Card>
      <CardContent className="p-4">
        <Stack direction="vertical" spacing={3}>
          <P>{metric.label}</P>

          {/* Circular progress (CSS only) */}
          <div className="relative w-24 h-24 mx-auto">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
                className="text-primary transition-all"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <H3>{percentage.toFixed(0)}%</H3>
            </div>
          </div>

          <Small color="muted" className="text-center">
            {metric.current} / {metric.goal}
          </Small>
        </Stack>
      </CardContent>
    </Card>
  );
}
```

**Why This Works**:

- No library needed (pure SVG + CSS)
- Visually engaging
- Good for goals/targets
- Mobile-friendly
  </pattern>
  </mobile-patterns>

<critical-rules>
<rule name="Maximum 2-Column Grid">
Never exceed `grid-cols-2` for metric displays:

```typescript
// ✅ CORRECT
<div className="grid grid-cols-2 gap-4">

// ❌ WRONG - Too many columns for 424px width
<div className="grid grid-cols-3 gap-2">
```

</rule>

<rule name="Limit Data Points (Max 6-8)">
For any chart/visualization, show maximum 6-8 data points on mobile:

```typescript
// ✅ CORRECT - Limit data for mobile
const mobileData = fullData.slice(0, 6);

// ❌ WRONG - Too many points to read on mobile
<BarChart data={fullData} /> // 50+ points
```

</rule>

<rule name="Prefer Cards Over Charts">
For most use cases, stat cards are better than charts on mobile:

```typescript
// ✅ CORRECT - Simple stat cards
<StatsGrid stats={metrics} />

// ❌ AVOID - Complex chart library on mobile
<ResponsiveLineChart data={data} /> // Hard to read, slow
```

</rule>

<rule name="Use Compact Number Formatting">
Large numbers should be abbreviated:

```typescript
// ✅ CORRECT
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

formatNumber(1234567); // "1.2M"
formatNumber(1234); // "1.2K"

// ❌ WRONG - Too long for mobile
<H3>1,234,567</H3> // Takes up too much space
```

</rule>

<rule name="Center-Align Stat Cards">
Stat cards should be center-aligned for readability:

```typescript
// ✅ CORRECT
<CardContent className="p-4 text-center">
  <H3>{value}</H3>
  <Small>{label}</Small>
</CardContent>

// ❌ WRONG - Left-aligned stat cards harder to scan
<CardContent className="p-4">
  <H3>{value}</H3>
  <Small>{label}</Small>
</CardContent>
```

</rule>

<rule name="Avoid Complex Visualizations">
These are too complex for 424px mobile screens:
- Multi-axis charts
- Stacked area charts with >3 layers
- Pie charts with >4 slices
- Scatter plots with >20 points
- Network graphs
- Heat maps
- 3D charts
- Interactive zoom/pan charts

Use simple alternatives instead.
</rule>
</critical-rules>

<common-mistakes>
<mistake>
**Using heavy chart libraries on mobile** → Use CSS-based visualizations (bars, progress)
</mistake>

<mistake>
**Showing too many data points** → Limit to 6-8 visible points maximum
</mistake>

<mistake>
**More than 2-column grid** → Maximum `grid-cols-2`
</mistake>

<mistake>
**Complex multi-axis charts** → Use simple single-metric displays
</mistake>

<mistake>
**Not formatting large numbers** → Use K/M abbreviations
</mistake>

<mistake>
**Dense data tables** → Maximum 6 rows, 2 columns
</mistake>

<mistake>
**Hover interactions** → No hover on mobile, use touch-friendly alternatives
</mistake>

<mistake>
**Small text in charts** → Use large, readable typography (H2, H3)
</mistake>
</common-mistakes>

<number-formatting>
```typescript
// Utility for compact number formatting
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

// Utility for percentage formatting
export function formatPercentage(value: number, decimals: number = 1): string {
return `${value.toFixed(decimals)}%`;
}

// Utility for currency formatting
export function formatCurrency(amount: number): string {
return new Intl.NumberFormat('en-US', {
style: 'currency',
currency: 'USD',
minimumFractionDigits: 0,
maximumFractionDigits: 2,
}).format(amount);
}

// Usage
formatCompactNumber(1234567); // "1.2M"
formatPercentage(12.345); // "12.3%"
formatCurrency(1234.56); // "$1,235"

````
</number-formatting>

<complete-example>
```typescript
// Complete example: Analytics dashboard for mobile
'use client';

import {
  Container,
  Stack,
  Card,
  CardContent,
  H2,
  H3,
  P,
  Small,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@neynar/ui';

type DashboardMetrics = {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  engagement: number;
  userGrowth: number;
  postGrowth: number;
};

function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export default function AnalyticsDashboard() {
  // Mock data - replace with real API calls
  const metrics: DashboardMetrics = {
    totalUsers: 12345,
    activeUsers: 5678,
    totalPosts: 89012,
    engagement: 45,
    userGrowth: 12,
    postGrowth: 23,
  };

  return (
    <Container className="mt-6">
      <Stack direction="vertical" spacing={6}>
        <H2>Analytics Dashboard</H2>

        {/* Main Metrics - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
          <Card>
            <CardContent className="p-4 text-center">
              <H3>{formatCompactNumber(metrics.totalUsers)}</H3>
              <Small color="muted">Total Users</Small>
              <Badge>+{metrics.userGrowth}%</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <H3>{formatCompactNumber(metrics.activeUsers)}</H3>
              <Small color="muted">Active Today</Small>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <H3>{formatCompactNumber(metrics.totalPosts)}</H3>
              <Small color="muted">Total Posts</Small>
              <Badge>+{metrics.postGrowth}%</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <H3>{metrics.engagement}%</H3>
              <Small color="muted">Engagement</Small>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Views */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="growth">Growth</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardContent className="p-6">
                <P>Overview content with simple visualizations</P>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="growth">
            <Card>
              <CardContent className="p-6">
                <P>Growth metrics with horizontal bars</P>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardContent className="p-6">
                <P>Activity data with compact table</P>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Stack>
    </Container>
  );
}
````

</complete-example>

---

**Summary**: Mobile data visualization requires extreme simplicity. Prefer 2x2 stat card grids over complex charts, use CSS-based bars instead of chart libraries, limit data points to 6-8 maximum, format numbers compactly, and always prioritize readability on 424px screens. Complex visualizations that work on desktop will fail on mobile - keep it simple.
