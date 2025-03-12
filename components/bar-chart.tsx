"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ImportData {
  id: number;
  date: string;
  year: number;
  month: number;
  supplier: string;
  importer: string;
  origin: string;
  export: string;
  product_description: string;
  manufacturer: string;
  total_value_usd: number;
  quantity: number;
  quantity_unit: string;
  price: number;
  price_unit: string;
  incoterm: string;
  hs_code: number;
  destination: string;
  importer_code: string;
  port: string;
  product: string;
  insert_date: string;
}

interface BarChartProps {
  data: ImportData[];
  filters: {
    product: string;
    importers: string[];
    destination: string;
    year: number;
  };
}

// Aggregates quantity data by month with filters
const aggregateQuantityByMonth = (
  data: ImportData[],
  filters: { product?: string; importers?: string[]; destination?: string; year?: number }
) => {
  console.log("Aggregating quantity data with filters:", filters);
  
  // Apply non-importer filters first
  let filteredData = data.filter((item) => {
    const productMatch = (filters.product === "all" || item.product === filters.product);
    const destinationMatch = (filters.destination === "all" || item.destination === filters.destination);
    const yearMatch = (filters.year === 0 || item.year === filters.year);
    return productMatch && destinationMatch && yearMatch;
  });
  
  // Get all unique months from the filtered data
  const allMonths = new Set(
    filteredData.map(item => `${item.year}-${String(item.month).padStart(2, "0")}`)
  );
  const sortedMonths = Array.from(allMonths).sort();

  // If no importers selected, aggregate all together
  if (!filters.importers || filters.importers.length === 0) {
    const monthlyData: { [key: string]: { month: string; total_quantity: number } } = {};
    
    // Initialize all months with zero
    sortedMonths.forEach(month => {
      monthlyData[month] = { month, total_quantity: 0 };
    });

    // Aggregate quantities
    filteredData.forEach((item) => {
      const monthKey = `${item.year}-${String(item.month).padStart(2, "0")}`;
      monthlyData[monthKey].total_quantity += item.quantity;
    });

    const result = Object.values(monthlyData)
      .map(({ month, total_quantity }) => ({
        month,
        total: total_quantity
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log("Aggregated quantity data (no importers):", {
      monthKeys: Object.keys(monthlyData),
      resultLength: result.length,
      sampleResult: result[0]
    });

    return result;
  }

  // Initialize data structure for all months and importers
  const result = sortedMonths.map(month => {
    const dataPoint: { [key: string]: any } = { month };
    filters.importers?.forEach(importer => {
      dataPoint[importer] = 0;
    });
    return dataPoint;
  });

  // Aggregate data by importer
  filteredData.forEach((item) => {
    if (filters.importers?.includes(item.importer)) {
      const monthKey = `${item.year}-${String(item.month).padStart(2, "0")}`;
      const monthData = result.find(d => d.month === monthKey);
      if (monthData) {
        monthData[item.importer] = (monthData[item.importer] || 0) + item.quantity;
      }
    }
  });

  console.log("Aggregated quantity data (with importers):", {
    resultLength: result.length,
    sampleResult: result[0],
    importers: filters.importers
  });

  return result;
};

export function QuantityBarChart({ data, filters }: BarChartProps) {
  const chartData = aggregateQuantityByMonth(data, filters);
  console.log("Bar Chart Data:", {
    rawDataLength: data.length,
    transformedData: chartData,
    firstFewItems: chartData.slice(0, 3),
    filters
  });

  // Generate chart config based on selected importers
  const chartConfig = {
    ...(filters.importers.length === 0 ? {
      total: {
        label: "Total Quantity",
        color: "#2563eb",
      }
    } : filters.importers.reduce((acc, importer, index) => {
      const colors = ["#2563eb", "#16a34a", "#dc2626", "#9333ea", "#ea580c"];
      acc[importer] = {
        label: importer,
        color: colors[index % colors.length],
      };
      return acc;
    }, {} as ChartConfig))
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="border-b py-2">
        <CardTitle className="text-base">Quantity Trends</CardTitle>
        <CardDescription className="text-xs">Total quantity by month</CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        <div className="w-full">
          <ChartContainer config={chartConfig}>
            <BarChart
              data={chartData}
              margin={{ left: 24, right: 24, top: 4, bottom: 4 }}
              height={140}
              width={800}
              barGap={0}
              maxBarSize={25}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={true}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(5)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent />}
              />
              {filters.importers.length === 0 ? (
                <Bar
                  dataKey="total"
                  fill={chartConfig.total.color}
                  radius={[4, 4, 0, 0]}
                />
              ) : (
                filters.importers.map((importer) => (
                  <Bar
                    key={importer}
                    dataKey={importer}
                    fill={chartConfig[importer].color}
                    stackId="a"
                    radius={filters.importers.indexOf(importer) === filters.importers.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))
              )}
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-1 text-xs border-t p-2">
        <div className="flex flex-wrap gap-2">
          {Object.entries(chartConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
} 