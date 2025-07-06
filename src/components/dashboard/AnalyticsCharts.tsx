"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartTooltipContent, ChartContainer, ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  generations: {
    label: "Generations",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const typeDisplayNames: { [key: string]: string } = {
  'written-content': 'Written Content',
  'prompt': 'Prompts',
  'component-wizard': 'Apps/Pages',
  'structured-data': 'Structured Data',
};

export default function AnalyticsCharts({ analyticsData }: { analyticsData: any }) {
  const { generationsByType, activityLast7Days } = analyticsData;

  const generationsByTypeChartData = Object.entries(generationsByType).map(([type, count]) => ({
    name: typeDisplayNames[type] || type,
    count,
  }));
  
  const activityChartData = activityLast7Days.map((day: any) => ({
    ...day,
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Generations by Type</CardTitle>
          <CardDescription>A breakdown of your creative output.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generationsByTypeChartData} layout="vertical" margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity (Last 7 Days)</CardTitle>
          <CardDescription>Your generation activity over the past week.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
             <LineChart
              data={activityChartData}
              margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
