import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

// Process data into monthly aggregation
const aggregateDataByMonth = (data: ImportData[]) => {
  const monthlyData: { [key: string]: { month: string; total_value_usd: number; quantity: number; avg_price: number } } = {};

  data.forEach((item) => {
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
  const [chartData, setChartData] = useState<{ month: string; total_value_usd: number; quantity: number; avg_price: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<ImportData[]>('http://localhost:5555/api/v1/excel/get_data');
        const processedData = aggregateDataByMonth(response.data);
        setChartData(processedData);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading chart data...</p>;
  if (error) return <p>{error}</p>;

  return (
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
  );
};

export default LinearChart;
