# SCB Sapphire FinSight

A modern financial insights and analytics platform built with Next.js, React, and TypeScript.

## Features

- **Dashboard**: Real-time financial metrics and KPIs
- **Analytics**: Detailed transaction banking performance analysis
- **Mobile App**: Responsive mobile interface
- **Joule AI Assistant**: Integrated AI assistant for financial insights
- **Data Visualization**: Interactive charts and graphs using Recharts

## Tech Stack

- **Framework**: Next.js 15
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Animations**: Framer Motion
- **Type Safety**: TypeScript

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3001](http://localhost:3001)

## Deployment

### Deploying to Vercel

This project is optimized for deployment on Vercel. We've provided a deployment script to streamline the process:

1. **Using the deployment script**:
   ```bash
   ./scripts/deploy-to-vercel.sh
   ```
   This will:
   - Clean previous build artifacts
   - Install dependencies
   - Run linting checks
   - Build the project
   - Deploy to Vercel

2. **Manual deployment**:
   If you prefer to deploy manually:
   ```bash
   npm run build
   vercel --prod
   ```

3. **Environment variables**:
   Make sure to configure the following environment variables in your Vercel project settings:
   - Any API keys or secrets from your `.env.local` file

### Notes on Deployment

- The project follows SAP Fiori Horizon design principles
- All components are optimized for performance and accessibility
- The deployment is configured via `vercel.json` in the project root

## Available Routes

- `/` - Main dashboard
- `/analytics` - Detailed analytics view
- `/knowledge-dashboard` - Knowledge graph visualization
- `/sankey-demo` - Financial flow visualization with Sankey charts

## Project Structure

```
src/
├── components/       # Reusable UI components
├── lib/             # Utility functions and services
├── pages/           # Next.js pages and routes
├── styles/          # Global styles
├── types/           # TypeScript type definitions
public/
├── images/          # Static images including SCB logo
scripts/
├── deploy-to-vercel.sh # Vercel deployment script
└── data/           # Mock data and constants
```

## Key Components

- **Layout**: Main app layout with sidebar navigation
- **MetricCard**: Displays key financial metrics
- **JouleAssistant**: AI assistant modal dialog
- **DetailedAnalyticsTable**: Financial data table with sectors

## Development

- **Start dev server**: `npm run dev`
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Run linting**: `npm run lint`

## Features Implemented

1. Responsive dashboard with financial metrics
2. Interactive charts and data visualizations
3. Mobile app interface with tabbed navigation
4. AI assistant (Joule) with chat interface
5. Detailed analytics table with sector performance
6. Modern UI with Tailwind CSS styling

## Future Enhancements

- API integration for real-time data
- User authentication
- More detailed reporting features
- Enhanced mobile features
- Data export functionality