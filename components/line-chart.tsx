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
  onFilterChange: (filterType: "product" | "destination" | "year" | "importers", value: any) => void;
  uniqueProducts: string[];
  uniqueImporters: string[];
  uniqueDestinations: string[];
  uniqueYears: number[];
  showFilters?: boolean;
  showChart?: boolean;
}

// Aggregates data by month with optional filters
const aggregateDataByMonth = (
  data: ImportData[],
  filters: { product?: string; importers?: string[]; destination?: string; year?: number }
) => {
  console.log("Aggregating data with filters:", filters);
  
  // Apply non-importer filters first
  let filteredData = data.filter((item) => {
    const productMatch = (filters.product === "all" || item.product === filters.product);
    const destinationMatch = (filters.destination === "all" || item.destination === filters.destination);
    const yearMatch = (filters.year === 0 || item.year === filters.year);
    return productMatch && destinationMatch && yearMatch;
  });
  
  console.log("After initial filtering:", {
    originalLength: data.length,
    filteredLength: filteredData.length,
    sampleItem: filteredData[0],
    filters: {
      product: filters.product,
      destination: filters.destination,
      year: filters.year
    }
  });

  // If no importers selected, aggregate all together
  if (!filters.importers || filters.importers.length === 0) {
    const monthlyData: { [key: string]: { month: string; total_value: number; total_quantity: number } } = {};
    
    filteredData.forEach((item) => {
      const monthKey = `${item.year}-${String(item.month).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, total_value: 0, total_quantity: 0 };
      }
      monthlyData[monthKey].total_value += item.total_value_usd;
      monthlyData[monthKey].total_quantity += item.quantity;
    });

    const result = Object.values(monthlyData)
      .map(({ month, total_value, total_quantity }) => ({
        month,
        total: total_quantity > 0 ? total_value / total_quantity : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log("Aggregated data:", {
      monthKeys: Object.keys(monthlyData),
      resultLength: result.length,
      sampleResult: result[0]
    });

    return result;
  }

  // Aggregate data by importer
  const monthlyDataByImporter: { [key: string]: { [month: string]: { value: number; quantity: number } } } = {};
  const months = new Set<string>();

  filteredData.forEach((item) => {
    if (filters.importers?.includes(item.importer)) {
      const monthKey = `${item.year}-${String(item.month).padStart(2, "0")}`;
      months.add(monthKey);

      if (!monthlyDataByImporter[item.importer]) {
        monthlyDataByImporter[item.importer] = {};
      }
      if (!monthlyDataByImporter[item.importer][monthKey]) {
        monthlyDataByImporter[item.importer][monthKey] = { value: 0, quantity: 0 };
      }
      monthlyDataByImporter[item.importer][monthKey].value += item.total_value_usd;
      monthlyDataByImporter[item.importer][monthKey].quantity += item.quantity;
    }
  });

  // Convert to chart format with average price per ton
  const sortedMonths = Array.from(months).sort();
  return sortedMonths.map(month => {
    const dataPoint: { [key: string]: any } = { month };
    filters.importers?.forEach(importer => {
      const monthData = monthlyDataByImporter[importer]?.[month];
      dataPoint[importer] = monthData?.quantity > 0 
        ? monthData.value / monthData.quantity 
        : 0;
    });
    return dataPoint;
  });
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
  const chartData = aggregateDataByMonth(data, filters);
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
    <div className="flex gap-4">
      {showFilters && (
        <Card className="w-80">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Select data filters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <Select value={filters.product} onValueChange={(value) => onFilterChange("product", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {uniqueProducts.map((product) => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Destination</label>
              <Select value={filters.destination} onValueChange={(value) => onFilterChange("destination", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Destinations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Destinations</SelectItem>
                  {uniqueDestinations.map((destination) => (
                    <SelectItem key={destination} value={destination}>
                      {destination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select 
                value={filters.year.toString()} 
                onValueChange={(value) => onFilterChange("year", Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Years</SelectItem>
                  {uniqueYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t space-y-2">
              <label className="text-sm font-medium">Compare Importers</label>
              <Select
                value={filters.importers.length > 0 ? filters.importers[0] : "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    onFilterChange("importers", []);
                  } else {
                    const newImporters = filters.importers.includes(value)
                      ? filters.importers.filter(i => i !== value)
                      : [...filters.importers, value];
                    onFilterChange("importers", newImporters);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Importers">
                    {filters.importers.length > 0 ? `${filters.importers.length} selected` : "All Importers"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Importers</SelectItem>
                  {uniqueImporters.map((importer) => (
                    <SelectItem key={importer} value={importer}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 ${filters.importers.includes(importer) ? "bg-primary" : "bg-muted"} rounded-full`} />
                        {importer}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.importers.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {filters.importers.map((importer) => (
                    <div
                      key={importer}
                      className="flex items-center gap-1 px-2 py-1 text-sm bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80"
                      onClick={() => {
                        onFilterChange(
                          "importers",
                          filters.importers.filter((i) => i !== importer)
                        );
                      }}
                    >
                      {importer}
                      <X className="h-3 w-3" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {showChart && (
        <Card className="flex-1">
          <CardHeader className="border-b py-2">
            <CardTitle className="text-base">Price Trends</CardTitle>
            <CardDescription className="text-xs">Average price per ton (USD) by month</CardDescription>
          </CardHeader>
          <CardContent className="p-2">
            <div className="w-full">
              <ChartContainer config={chartConfig}>
                <LineChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ left: 24, right: 24, top: 4, bottom: 4 }}
                  height={140}
                  width={800}
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
