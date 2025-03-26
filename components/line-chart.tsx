"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { X } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filters } from "@/components/filters";

// Define TypeScript interface
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

interface LineChartProps {
  data: ImportData[];
  filters: {
    product: string;
    importers: string[];
    destination: string;
    year: number;
  };
  onFilterChange: (filterType: "product" | "destination" | "year" | "importers", value: string | string[] | number) => void;
  uniqueProducts: string[];
  uniqueImporters: string[];
  uniqueDestinations: string[];
  uniqueYears: number[];
  showFilters?: boolean;
  showChart?: boolean;
}

// Aggregates data by month with optional filters
const aggregatePriceByMonth = (
  data: ImportData[],
  filters: { product?: string; importers?: string[]; destination?: string; year?: number }
) => {
  console.log("Aggregating price data with filters:", filters);
  
  // Apply non-importer filters first
  const filteredData = data.filter((item) => {
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
    const monthlyData: { [key: string]: { month: string; total_value: number; total_quantity: number } } = {};
    
    // Initialize all months with zero
    sortedMonths.forEach(month => {
      monthlyData[month] = { month, total_value: 0, total_quantity: 0 };
    });

    // Aggregate values and quantities
    filteredData.forEach((item) => {
      const monthKey = `${item.year}-${String(item.month).padStart(2, "0")}`;
      monthlyData[monthKey].total_value += item.total_value_usd;
      monthlyData[monthKey].total_quantity += item.quantity;
    });

    const result = Object.values(monthlyData)
      .map(({ month, total_value, total_quantity }) => ({
        month,
        total: total_quantity > 0 ? total_value / total_quantity : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log("Aggregated price data (no importers):", {
      monthKeys: Object.keys(monthlyData),
      resultLength: result.length,
      sampleResult: result[0]
    });

    return result;
  }

  // Initialize data structure for all months and importers
  const result = sortedMonths.map(month => {
    const dataPoint: Record<string, number | string> = { month };
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
        monthData[item.importer] = (monthData[item.importer] as number || 0) + (item.total_value_usd / item.quantity);
      }
    }
  });

  console.log("Aggregated price data (with importers):", {
    resultLength: result.length,
    sampleResult: result[0],
    importers: filters.importers
  });

  return result;
};

export function PriceLineChart({ 
  data, 
  filters, 
  onFilterChange,
  uniqueProducts,
  uniqueImporters,
  uniqueDestinations,
  uniqueYears,
  showFilters = true,
  showChart = true
}: LineChartProps) {
  const chartData = aggregatePriceByMonth(data, filters);
  console.log("Line Chart Data:", {
    rawDataLength: data.length,
    transformedData: chartData,
    firstFewItems: chartData.slice(0, 3)
  });

  // Generate chart config based on selected importers
  const chartConfig = {
    ...(filters.importers.length === 0 ? {
      total: {
        label: "Avg Price Per Ton (USD)",
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
    <div className="h-full">
      {showFilters && (
        <Filters 
          filters={filters}
          onFilterChange={onFilterChange}
          uniqueProducts={uniqueProducts}
          uniqueImporters={uniqueImporters}
          uniqueDestinations={uniqueDestinations}
          uniqueYears={uniqueYears}
        />
      )}

      {showChart && (
        <Card className="h-full">
          <CardHeader className="border-b py-2">
            <CardTitle className="text-base">Price Trends</CardTitle>
            <CardDescription className="text-xs">Average price per ton (USD) by month</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="w-full h-[calc(100%-120px)]">
              <ChartContainer config={chartConfig}>
                <LineChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ left: 24, right: 24, top: 4, bottom: 4 }}
                  height={0}
                  width={0}
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
                    <Line
                      dataKey="total"
                      type="natural"
                      stroke={chartConfig.total.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : (
                    filters.importers.map((importer) => (
                      <Line
                        key={importer}
                        dataKey={importer}
                        type="natural"
                        stroke={chartConfig[importer].color}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))
                  )}
                </LineChart>
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
      )}
    </div>
  );
}
