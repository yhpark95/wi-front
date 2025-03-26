"use client"

import styled from 'styled-components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import React from 'react';
import { toast } from "sonner";

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

export default function DataManagementPage() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/excel/insert_data', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      if (result) {
        toast.success('File uploaded successfully');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      // Reset the input value so the same file can be selected again
      event.target.value = '';
    }
  };

  const handleDownload = () => {
    // TODO: Implement file download functionality
    console.log('Download clicked');
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
              Upload your Excel files to update the database with new data. 
              The system will automatically process and validate the data before importing.
            </p>
            <CardActions>
              <Button onClick={handleUpload} disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </CardActions>
          </CardContent>
        </StyledCard>

        <StyledCard>
          <CardHeader>
            <IconWrapper>
              <Download size={24} />
            </IconWrapper>
            <CardTitle>Download Data</CardTitle>
            <CardDescription>
              Export data in various formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download the current data in your preferred format. 
              Available formats include Excel, CSV, and JSON.
            </p>
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