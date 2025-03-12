"use client"

import { useEffect, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  filters: { product?: string; importers?: string[]; destination?: string; year?: number }
) => {
  // Apply non-importer filters first
  let filteredData = data.filter((item) => {
    return (
      (!filters.product || item.product === filters.product) &&
      (!filters.destination || item.destination === filters.destination) &&
      (!filters.year || item.year === filters.year)
    );
  });

  // If no importers selected, aggregate all together
  if (!filters.importers || filters.importers.length === 0) {
    const monthlyData: { [key: string]: { month: string; total: number } } = {};
    
    filteredData.forEach((item) => {
      const monthKey = `${item.year}-${String(item.month).padStart(2, "0")}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, total: 0 };
      }
      monthlyData[monthKey].total += item.total_value_usd;
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }

  // Aggregate data by importer
  const monthlyDataByImporter: { [key: string]: { [month: string]: number } } = {};
  const months = new Set<string>();

  filteredData.forEach((item) => {
    if (filters.importers?.includes(item.importer)) {
      const monthKey = `${item.year}-${String(item.month).padStart(2, "0")}`;
      months.add(monthKey);

      if (!monthlyDataByImporter[item.importer]) {
        monthlyDataByImporter[item.importer] = {};
      }
      if (!monthlyDataByImporter[item.importer][monthKey]) {
        monthlyDataByImporter[item.importer][monthKey] = 0;
      }
      monthlyDataByImporter[item.importer][monthKey] += item.total_value_usd;
    }
  });

  // Convert to chart format
  const sortedMonths = Array.from(months).sort();
  return sortedMonths.map(month => {
    const dataPoint: { [key: string]: any } = { month };
    filters.importers?.forEach(importer => {
      dataPoint[importer] = monthlyDataByImporter[importer]?.[month] || 0;
    });
    return dataPoint;
  });
};

export function Component() {
  const [originalData, setOriginalData] = useState<ImportData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    product: "all",
    importers: [] as string[],
    destination: "all",
    year: 0
  });

  // Function to get filtered data based on current filters
  const getFilteredData = (data: ImportData[], currentFilters: typeof filters) => {
    return data.filter((item) => {
      const productMatch = currentFilters.product === "all" || item.product === currentFilters.product;
      const importerMatch = currentFilters.importers.length === 0 || currentFilters.importers.includes(item.importer);
      const destinationMatch = currentFilters.destination === "all" || item.destination === currentFilters.destination;
      const yearMatch = currentFilters.year === 0 || item.year === currentFilters.year;
      return productMatch && importerMatch && destinationMatch && yearMatch;
    });
  };

  // Function to get filtered unique values based on current filters
  const getFilteredUniqueValues = (
    data: ImportData[],
    field: keyof ImportData,
    currentFilters: typeof filters,
    excludeField?: keyof typeof filters
  ) => {
    // Create a new filters object excluding the field we're getting values for
    const filtersWithoutField = { ...currentFilters };
    if (excludeField) {
      if (excludeField === 'importers') {
        filtersWithoutField.importers = [];
      } else if (excludeField === 'year') {
        filtersWithoutField.year = 0;
      } else {
        (filtersWithoutField[excludeField] as string) = "all";
      }
    }

    // Get filtered data
    const filteredData = getFilteredData(data, filtersWithoutField);
    
    // Extract unique values
    const values = Array.from(new Set(filteredData.map(item => item[field]))).sort();
    return values;
  };

  // Get filtered unique values for each filter
  const uniqueProducts = getFilteredUniqueValues(originalData, 'product', filters, 'product') as string[];
  const uniqueImporters = getFilteredUniqueValues(originalData, 'importer', filters, 'importers') as string[];
  const uniqueDestinations = getFilteredUniqueValues(originalData, 'destination', filters, 'destination') as string[];
  const uniqueYears = getFilteredUniqueValues(originalData, 'year', filters, 'year') as number[];

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
      ...(filters.importers.length > 0 && { importers: filters.importers }),
      ...(filters.destination !== "all" && { destination: filters.destination }),
      ...(filters.year !== 0 && { year: filters.year }),
    };
    setChartData(aggregateDataByMonth(originalData, activeFilters));

    // Validate current filter values against new options
    const validateFilters = () => {
      const newFilters = { ...filters };
      let hasChanges = false;

      // Validate product
      if (filters.product !== "all" && !uniqueProducts.includes(filters.product)) {
        newFilters.product = "all";
        hasChanges = true;
      }

      // Validate importers
      const validImporters = filters.importers.filter(imp => uniqueImporters.includes(imp));
      if (validImporters.length !== filters.importers.length) {
        newFilters.importers = validImporters;
        hasChanges = true;
      }

      // Validate destination
      if (filters.destination !== "all" && !uniqueDestinations.includes(filters.destination)) {
        newFilters.destination = "all";
        hasChanges = true;
      }

      // Validate year
      if (filters.year !== 0 && !uniqueYears.includes(filters.year)) {
        newFilters.year = 0;
        hasChanges = true;
      }

      if (hasChanges) {
        setFilters(newFilters);
      }
    };

    validateFilters();
  }, [filters, originalData]);

  const handleFilterChange = (filterType: keyof typeof filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Generate chart config based on selected importers
  const chartConfig = {
    ...(filters.importers.length === 0 ? {
      total: {
        label: "Total Value (USD)",
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

          <div className="space-y-2">
            <Select
              value={filters.importers.length > 0 ? filters.importers[0] : "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  handleFilterChange("importers", []);
                } else {
                  const newImporters = filters.importers.includes(value)
                    ? filters.importers.filter(i => i !== value)
                    : [...filters.importers, value];
                  handleFilterChange("importers", newImporters);
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
              <div className="flex flex-wrap gap-1">
                {filters.importers.map((importer) => (
                  <div
                    key={importer}
                    className="flex items-center gap-1 px-2 py-1 text-sm bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80"
                    onClick={() => {
                      handleFilterChange(
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
              filters.importers.map((importer, index) => (
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
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex flex-wrap gap-2">
          {Object.entries(chartConfig).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
              <span>{config.label}</span>
            </div>
          ))}
        </div>
        <div className="leading-none text-muted-foreground">
          Showing import values by month
        </div>
      </CardFooter>
    </Card>
  );
}
