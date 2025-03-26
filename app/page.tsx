"use client"

import { useEffect, useState } from "react";
import axios from "axios";

import { PriceLineChart } from "@/components/line-chart"
import { QuantityBarChart } from "@/components/bar-chart"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Filters } from "@/components/filters";
import {
  Container,
  Header,
  HeaderContent,
  Main,
  Grid,
  FiltersColumn,
  ChartColumn,
  ChartColumn2,
  CardColumn,
  CardColumn2,
} from "@/components/styled";
import { NavMenu } from "@/components/nav-menu"

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

type FilterValue = string | string[] | number;

export default function Page() {
  const [originalData, setOriginalData] = useState<ImportData[]>([]);
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
      } catch (err) {
        setError("Failed to fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Validate current filter values against new options
  useEffect(() => {
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
  }, [filters, originalData, uniqueProducts, uniqueImporters, uniqueDestinations, uniqueYears]);

  const handleFilterChange = (filterType: keyof typeof filters, value: FilterValue) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="min-h-screen">
      <Header>
        <HeaderContent>
          <h2>WI Analytics</h2>
          <NavMenu />
          <Container>
            <Button variant="outline" size="sm">Feedback</Button>
            <ModeToggle />
            <UserNav />
          </Container>
        </HeaderContent>
      </Header>
      
      <Main>
        <Grid>
          <FiltersColumn>
            <Filters 
              filters={filters}
              onFilterChange={handleFilterChange}
              uniqueProducts={uniqueProducts}
              uniqueImporters={uniqueImporters}
              uniqueDestinations={uniqueDestinations}
              uniqueYears={uniqueYears}
            />
          </FiltersColumn>
          <ChartColumn>
            <PriceLineChart 
              data={originalData}
              filters={filters}
              onFilterChange={handleFilterChange}
              uniqueProducts={uniqueProducts}
              uniqueImporters={uniqueImporters}
              uniqueDestinations={uniqueDestinations}
              uniqueYears={uniqueYears}
              showFilters={false}
              showChart={true}
            />
          </ChartColumn>
          <ChartColumn2>
            <QuantityBarChart 
              data={originalData}
              filters={filters}
            />
          </ChartColumn2>
          <CardColumn>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium">Summary</h3>
                <p className="text-sm text-muted-foreground">Key metrics and insights</p>
              </CardContent>
            </Card>
          </CardColumn>
          <CardColumn2>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium">Trends</h3>
                <p className="text-sm text-muted-foreground">Market trends and patterns</p>
              </CardContent>
            </Card>
          </CardColumn2>
        </Grid>
      </Main>
    </div>
  )
}
