"use client"

import { useEffect, useState } from "react";
import axios from "axios";
import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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

// Aggregates data by month with optional filters
const aggregateDataByMonth = (
  data: ImportData[],
  filters: { product?: string; destination?: string; importer?: string; year?: number }
) => {
  const monthlyData: { [key: string]: { month: string; total_value_usd: number; quantity: number; avg_price: number } } = {};

  // Apply filters
  const filteredData = data.filter((item) => {
    return (
      (!filters.product || item.product === filters.product) &&
      (!filters.destination || item.destination === filters.destination) &&
      (!filters.importer || item.importer === filters.importer) &&
      (!filters.year || item.year === filters.year)
    );
  });

  filteredData.forEach((item) => {
    const monthKey = `${item.year}-${String(item.month).padStart(2, "0")}`; // Format as YYYY-MM

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        month: monthKey,
        total_value_usd: 0,
        quantity: 0,
        avg_price: 0,
      };
    }

    monthlyData[monthKey].total_value_usd += item.total_value_usd;
    monthlyData[monthKey].quantity += item.quantity;
  });

  // Compute average price per unit
  Object.keys(monthlyData).forEach((month) => {
    const entry = monthlyData[month];
    entry.avg_price = entry.quantity > 0 ? entry.total_value_usd / entry.quantity : 0;
  });

  // Convert to array & sort by date
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
};

export function Component() {
  const [originalData, setOriginalData] = useState<ImportData[]>([]);
  const [chartData, setChartData] = useState<{ month: string; total_value_usd: number; quantity: number; avg_price: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    product: "all",
    importer: "all",
    destination: "all",
    year: 0
  });

  // Extract unique values for filters
  const uniqueProducts = Array.from(new Set(originalData.map(item => item.product))).sort();
  const uniqueImporters = Array.from(new Set(originalData.map(item => item.importer))).sort();
  const uniqueDestinations = Array.from(new Set(originalData.map(item => item.destination))).sort();
  const uniqueYears = Array.from(new Set(originalData.map(item => item.year))).sort();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<ImportData[]>("http://localhost:5555/api/v1/excel/get_data");
        setOriginalData(response.data);
        setChartData(aggregateDataByMonth(response.data, {}));
      } catch (err) {
        setError("Failed to fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update chart data when filters change
  useEffect(() => {
    const activeFilters = {
      ...(filters.product !== "all" && { product: filters.product }),
      ...(filters.importer !== "all" && { importer: filters.importer }),
      ...(filters.destination !== "all" && { destination: filters.destination }),
      ...(filters.year !== 0 && { year: filters.year }),
    };
    setChartData(aggregateDataByMonth(originalData, activeFilters));
  }, [filters, originalData]);

  const handleFilterChange = (filterType: keyof typeof filters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const chartConfig = {
    total_value_usd: {
      label: "Total Value (USD)",
      color: "#2563eb",
    },
  } satisfies ChartConfig;

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart</CardTitle>
        <CardDescription>Monthly Import Data</CardDescription>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <Select value={filters.product} onValueChange={(value) => handleFilterChange("product", value)}>
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

          <Select value={filters.importer} onValueChange={(value) => handleFilterChange("importer", value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Importers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Importers</SelectItem>
              {uniqueImporters.map((importer) => (
                <SelectItem key={importer} value={importer}>
                  {importer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.destination} onValueChange={(value) => handleFilterChange("destination", value)}>
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

          <Select 
            value={filters.year.toString()} 
            onValueChange={(value) => handleFilterChange("year", Number(value))}
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
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(5)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="total_value_usd"
              type="natural"
              stroke={chartConfig.total_value_usd.color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total import value for the last months
        </div>
      </CardFooter>
    </Card>
  );
}
