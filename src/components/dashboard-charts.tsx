"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { status: "Planning", count: 3 },
  { status: "In Progress", count: 5 },
  { status: "On Hold", count: 1 },
  { status: "Completed", count: 2 },
  { status: "Cancelled", count: 1 },
]

const chartConfig = {
  count: {
    label: "Projects",
    color: "hsl(var(--primary))",
  },
}

export function ProjectStatusChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="status" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false}/>
          <Tooltip cursor={false} content={<ChartTooltipContent />} />
          <Legend />
          <Bar dataKey="count" fill="var(--color-count)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
