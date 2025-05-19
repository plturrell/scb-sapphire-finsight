# Vietnam Company Data Extraction Guide

This guide explains how to extract real Vietnam company data from S&P Capital IQ and populate the data products.

## Prerequisites

- S&P Capital IQ account credentials:
  - Username: craig.turrell@sc.com  
  - Password: Victoria0405%
- Node.js installed
- Access to Capital IQ website

## Data Extraction Methods

### Method 1: Capital IQ API (Automated)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the API extraction script:
   ```bash
   cd scripts
   node capitalIQApiClient.ts
   ```

This will:
- Authenticate with Capital IQ
- Search for Vietnam companies
- Download company details
- Save data to `/data_products/vietnam_companies_capitaliq.json`

### Method 2: Manual CSV Export

If API access is limited, use the manual export method:

1. **Log in to Capital IQ**
   - Go to https://www.capitaliq.spglobal.com
   - Use the provided credentials

2. **Navigate to Company Screening**
   - Click on "Screening" > "Company Screening"
   - Create a new screen

3. **Set Filters for Vietnam Companies**
   - Geography: Asia Pacific > Vietnam
   - Status: Active Companies
   - Company Type: All (Private, Public, SOE)
   - Industry: All Industries

4. **Configure Export Columns**
   Click "Edit Columns" and include:
   - Company Name
   - Local Name (Vietnamese)
   - Tax ID
   - Business Registration Number
   - GICS Industry Classification
   - Company Type
   - Province/State
   - City/District
   - Full Address
   - Phone Number
   - Email
   - Website
   - Founded Date
   - Registered Capital
   - Number of Employees
   - Revenue (Latest)
   - Export Revenue (if available)
   - Import Value (if available)
   - Stock Exchange (for public companies)
   - Ticker Symbol
   - Credit Rating
   - Ultimate Parent Company

5. **Export Data**
   - Click "Run Screen"
   - Wait for results to load
   - Click "Export" > "Export to Excel"
   - Select "All Results" with all columns
   - Save as: `/data_products/vietnam_companies_capitaliq_export.csv`

6. **Parse the CSV**
   ```bash
   cd scripts
   node parseCapitalIQExport.ts
   ```

This will convert the CSV to JSON format and save to:
- `/data_products/vietnam_companies_capitaliq.json`
- `/data_products/vietnam_companies_summary.json`

## Data Product Structure

The Vietnam Company data product follows this schema:

```typescript
interface VietnamCompany {
  VietnamCompanyCode: string;      // VCG-0001, VCG-0002, etc.
  CompanyName: string;             // English name
  CompanyNameLocal?: string;       // Vietnamese name
  TaxCode?: string;                // Tax identification number
  BusinessRegistrationNumber?: string;
  IndustryCode?: string;           // Standardized industry code
  CompanyType?: string;            // JSC, LLC, SOE, etc.
  Province?: string;               // Province/City
  District?: string;               // District
  Address?: string;                // Full address
  PhoneNumber?: string;
  Email?: string;
  Website?: string;
  EstablishedDate?: string;        // YYYY-MM-DD format
  RegisteredCapital?: number;      
  RegisteredCapitalCurrency?: string;  // VND, USD, etc.
  EmployeeCount?: number;
  AnnualRevenue?: number;
  AnnualRevenueCurrency?: string;
  ExportValue?: number;
  ExportValueCurrency?: string;
  ImportValue?: number;
  ImportValueCurrency?: string;
  MainExportProducts?: string;
  MainImportProducts?: string;
  TradingPartners?: string;
  CreditRating?: string;
  ListingStatus?: string;          // Listed/Private
  StockSymbol?: string;            // For listed companies
  Status?: string;                 // Active/Inactive
  LastUpdated?: string;            // ISO timestamp
  DataSource?: string;             // S&P Capital IQ
}
```

## Key Vietnam Companies to Include

Ensure these major Vietnamese companies are captured:

1. **Vinamilk** (VNM) - Dairy products
2. **FPT Corporation** (FPT) - Technology
3. **Viettel Group** - Telecommunications
4. **Vinatex** (VGT) - Textiles
5. **Masan Group** (MSN) - Conglomerate
6. **Vietnam Airlines** (HVN) - Aviation
7. **PetroVietnam Gas** (GAS) - Energy
8. **Hoa Phat Group** (HPG) - Steel
9. **Mobile World** (MWG) - Retail
10. **Vietnam Rubber Group** (GVR) - Rubber

## Data Quality Checks

After extraction, verify:

1. Company codes are unique (VCG-XXXX format)
2. Currency codes are standardized (VND, USD)
3. Industry codes are mapped correctly
4. Dates are in ISO format
5. Numeric values are properly parsed
6. Province names are consistent

## Troubleshooting

### API Issues
- Check rate limits (1 request/second)
- Verify authentication credentials
- Monitor daily/hourly request limits

### CSV Export Issues
- Ensure all columns are selected before export
- Check for encoding issues (UTF-8)
- Verify CSV delimiter (comma)

### Data Mapping Issues
- Review industry code mappings
- Check company type classifications
- Verify province name standardization

## Next Steps

After successful extraction:

1. Load data into Redis using:
   ```bash
   npm run load-data-products
   ```

2. Verify data in the application:
   - Navigate to Data Products page
   - Search for Vietnam companies
   - Check company details display

3. Test integrations:
   - Monte Carlo simulations
   - Tariff impact analysis
   - Company dashboards

## Support

For Capital IQ access issues:
- Contact S&P Global support
- Use alternative data sources if needed

For technical issues:
- Check error logs in `/logs`
- Review API response errors
- Verify network connectivity