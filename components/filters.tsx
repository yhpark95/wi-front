import { X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface FiltersProps {
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
}

export function Filters({ 
  filters, 
  onFilterChange,
  uniqueProducts,
  uniqueImporters,
  uniqueDestinations,
  uniqueYears,
}: FiltersProps) {
  return (
    <Card className="h-full">
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
  );
} 