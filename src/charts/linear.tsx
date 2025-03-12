import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styled from "@emotion/styled";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Define TypeScript interface based on your backend schema
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
const aggregateDataByMonth = (data: ImportData[], filters: { product?: string; destination?: string; importer?: string; year?: number }) => {
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
    const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`; // Format as YYYY-MM

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

  // Compute average price per ton for each month
  Object.keys(monthlyData).forEach((month) => {
    const entry = monthlyData[month];
    entry.avg_price = entry.quantity > 0 ? entry.total_value_usd / entry.quantity : 0;
  });

  // Convert to array & sort by date
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
};

const LinearChart: React.FC = () => {
  const [originalData, setOriginalData] = useState<ImportData[]>([]);
  const [chartData, setChartData] = useState<{ month: string; total_value_usd: number; quantity: number; avg_price: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>();
  const [selectedDestination, setSelectedDestination] = useState<string | undefined>();
  const [selectedImporter, setSelectedImporter] = useState<string | undefined>();
  const [selectedYear, setSelectedYear] = useState<number | undefined>();

  // Unique filter options
  const products = Array.from(new Set(originalData.map((item) => item.product)));
  const destinations = Array.from(new Set(originalData.map((item) => item.destination)));
  const importers = Array.from(new Set(originalData.map((item) => item.importer)));
  const years = Array.from(new Set(originalData.map((item) => item.year))).sort((a, b) => a - b);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<ImportData[]>('http://localhost:5555/api/v1/excel/get_data');
        setOriginalData(response.data);
        setChartData(aggregateDataByMonth(response.data, {})); // Initial data without filters
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update chart data when filters change
  useEffect(() => {
    setChartData(aggregateDataByMonth(originalData, { product: selectedProduct, destination: selectedDestination, importer: selectedImporter, year: selectedYear }));
  }, [selectedProduct, selectedDestination, selectedImporter, selectedYear, originalData]);

  if (loading) return <p>Loading chart data...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      {/* Filters Section */}
      <Select>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
      <SelectValue placeholder="Select a fruit" />
        <select className={selectBoxStyles} value={selectedProduct || ''} onChange={(e) => setSelectedProduct(e.target.value || undefined)}>
          <option value="">All Products</option>
          {products.map((product) => (
            <option key={product} value={product}>{product}</option>
          ))}
        </select>
        </Select>
        <select className={selectBoxStyles} value={selectedDestination || ''} onChange={(e) => setSelectedDestination(e.target.value || undefined)}>
          <option value="">All Destinations</option>
          {destinations.map((destination) => (
            <option key={destination} value={destination}>{destination}</option>
          ))}
        </select>

        <select className={selectBoxStyles} value={selectedImporter || ''} onChange={(e) => setSelectedImporter(e.target.value || undefined)}>
          <option value="">All Importers</option>
          {importers.map((importer) => (
            <option key={importer} value={importer}>{importer}</option>
          ))}
        </select>

        <select className={selectBoxStyles} value={selectedYear || ''} onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Chart Section */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="total_value_usd" stroke="#8884d8" name="Total Value (USD)" />
          <Line type="monotone" dataKey="quantity" stroke="#82ca9d" name="Quantity (Ton)" />
          <Line type="monotone" dataKey="avg_price" stroke="#ff7300" name="Avg Price per Ton (USD)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LinearChart;



const selectBoxStyles =
  "p-2 border rounded-lg text-gray-700 border-gray-300 bg-white cursor-pointer text-lg outline-none transition duration-300 focus:border-blue-500 min-w-[200px]";

  // 문의내역 ----------------------------
export const HistoryCard = styled.div`
display: flex;
padding-bottom: 0px;
flex-direction: column;
align-items: flex-start;
align-self: stretch;
`;