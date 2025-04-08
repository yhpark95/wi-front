"use client";

import React from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { Upload, Download, Calendar } from "lucide-react";

import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { API_BASE_URL } from "@/lib/utils";


const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const PageDescription = styled.p`
  color: var(--muted-foreground);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
`;

const StyledCard = styled(Card)`
  height: 100%;
`;

const CardActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: var(--muted);
  margin-bottom: 1rem;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
`;

const DatePickerButton = ({
  date,
  onSelect,
  placeholder,
  minDate,
  maxDate,
}: {
  date?: Date;
  onSelect: (date: Date | undefined) => void;
  placeholder: string;
  minDate?: Date;
  maxDate?: Date;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline">
        <Calendar className="mr-2 h-4 w-4" />
        {date ? format(date, "yyyy-MM-dd") : placeholder}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <DatePicker
        mode="single"
        selected={date}
        onSelect={onSelect}
        disabled={(d) =>
          Boolean((minDate && d < minDate) || (maxDate && d > maxDate))
        }
      />
    </PopoverContent>
  </Popover>
);

export default function DataManagementPage() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch('${API_BASE_URL}/api/excel/insert_data', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      if (result) {
        toast.success("File uploaded successfully");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDownload = async () => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", format(startDate, "yyyy-MM-dd"));
    if (endDate) params.append("end_date", format(endDate, "yyyy-MM-dd"));
  
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/excel/export_excel?${params.toString()}`, {
        method: "GET",
      });
  
      if (!response.ok) {
        throw new Error("Failed to download file");
      }
  
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
      const filename = filenameMatch?.[1] || `import_data_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
  
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    }
  };

  return (
    <PageContainer>
      <HiddenFileInput
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx"
      />

      <PageHeader>
        <PageTitle>Data Management</PageTitle>
        <PageDescription>
          Upload new data or download existing data in various formats
        </PageDescription>
      </PageHeader>

      <Grid>
        {/* Upload Card */}
        <StyledCard>
          <CardHeader>
            <IconWrapper>
              <Upload size={24} />
            </IconWrapper>
            <CardTitle>Upload Data</CardTitle>
            <CardDescription>
              Import new data from Excel files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your Excel files to update the database with new data. The
              system will automatically process and validate the data before
              importing.
            </p>
            <CardActions>
              <Button onClick={handleUpload} disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload File"}
              </Button>
            </CardActions>
          </CardContent>
        </StyledCard>

        {/* Download Card */}
        <StyledCard>
          <CardHeader>
            <IconWrapper>
              <Download size={24} />
            </IconWrapper>
            <CardTitle>Download Data</CardTitle>
            <CardDescription>Export data in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download the current data with optional date filters. Choose a
              start and end date to filter the data.
            </p>
            <FilterContainer>
              <DatePickerButton
                date={startDate}
                onSelect={setStartDate}
                placeholder="Start Date"
                maxDate={endDate || new Date()}
              />
              <DatePickerButton
                date={endDate}
                onSelect={setEndDate}
                placeholder="End Date"
                minDate={startDate || new Date("1970-01-01")}
              />
            </FilterContainer>
            <CardActions>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Data
              </Button>
            </CardActions>
          </CardContent>
        </StyledCard>
      </Grid>
    </PageContainer>
  );
}

