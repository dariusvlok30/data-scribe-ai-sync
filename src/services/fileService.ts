
import * as XLSX from 'xlsx';

export interface ProcessedData {
  headers: string[];
  rows: any[][];
  preview: any[];
  totalRows: number;
  fileName: string;
  fileType: string;
}

export class FileService {
  async processFile(file: File): Promise<ProcessedData> {
    const fileType = this.getFileType(file.name);
    
    switch (fileType) {
      case 'excel':
        return this.processExcelFile(file);
      case 'csv':
        return this.processCSVFile(file);
      case 'text':
        return this.processTextFile(file);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'xlsx':
      case 'xls':
        return 'excel';
      case 'csv':
        return 'csv';
      case 'txt':
      case 'tsv':
        return 'text';
      default:
        return 'unknown';
    }
  }

  private async processExcelFile(file: File): Promise<ProcessedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const headers = jsonData[0] as string[] || [];
          const rows = jsonData.slice(1) as any[][];
          const preview = rows.slice(0, 10).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          resolve({
            headers,
            rows,
            preview,
            totalRows: rows.length,
            fileName: file.name,
            fileType: 'excel'
          });
        } catch (error) {
          reject(new Error(`Failed to process Excel file: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private async processCSVFile(file: File): Promise<ProcessedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = this.parseCSVLine(lines[0]);
          const rows = lines.slice(1).map(line => this.parseCSVLine(line));
          
          const preview = rows.slice(0, 10).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          resolve({
            headers,
            rows,
            preview,
            totalRows: rows.length,
            fileName: file.name,
            fileType: 'csv'
          });
        } catch (error) {
          reject(new Error(`Failed to process CSV file: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private async processTextFile(file: File): Promise<ProcessedData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          // Try to detect delimiter (tab, comma, pipe, etc.)
          const delimiter = this.detectDelimiter(lines[0]);
          const headers = lines[0].split(delimiter);
          const rows = lines.slice(1).map(line => line.split(delimiter));
          
          const preview = rows.slice(0, 10).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header.trim()] = row[index]?.trim();
            });
            return obj;
          });

          resolve({
            headers: headers.map(h => h.trim()),
            rows,
            preview,
            totalRows: rows.length,
            fileName: file.name,
            fileType: 'text'
          });
        } catch (error) {
          reject(new Error(`Failed to process text file: ${error}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private detectDelimiter(line: string): string {
    const delimiters = ['\t', ',', '|', ';', ':'];
    let maxCount = 0;
    let bestDelimiter = ',';
    
    for (const delimiter of delimiters) {
      const count = line.split(delimiter).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }
    
    return bestDelimiter;
  }

  validateData(data: ProcessedData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for empty headers
    if (data.headers.some(header => !header.trim())) {
      errors.push('Some column headers are empty');
    }
    
    // Check for consistent row lengths
    const expectedLength = data.headers.length;
    const inconsistentRows = data.rows.filter(row => row.length !== expectedLength);
    if (inconsistentRows.length > 0) {
      errors.push(`${inconsistentRows.length} rows have inconsistent column counts`);
    }
    
    // Check for minimum data requirements
    if (data.totalRows === 0) {
      errors.push('No data rows found');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const fileService = new FileService();
