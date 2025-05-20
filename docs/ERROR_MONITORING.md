# Error Monitoring and Logging System

**Version: 1.0.0 (May 2025)**

This document outlines the error monitoring and logging system implemented in the FinSight application to ensure reliability, performance, and rapid problem resolution in production.

## Overview

The FinSight application implements a multi-layered monitoring and logging approach:

1. **Client-side error tracking**
2. **Server-side error logging**
3. **API request/response logging**
4. **Performance monitoring**
5. **Real-time alerts**

## Monitoring Tools

### Sentry Integration

The application uses Sentry for error tracking and monitoring:

```typescript
// _app.tsx - Sentry initialization
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.5,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### Server-Side Logging

Server-side logs are structured using Pino:

```typescript
// lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export default logger;
```

## Log Levels

The application uses the following log levels:

| Level | Description | Example Use Case |
|-------|-------------|-----------------|
| TRACE | Detailed debugging | Function entry/exit points |
| DEBUG | Development info | Variable states, method calls |
| INFO | Production operations | API requests, user actions |
| WARN | Potential issues | Deprecated API usage, slow responses |
| ERROR | Runtime errors | API failures, exceptions |
| FATAL | Critical failures | Application crashes, data corruption |

## Error Capture Points

The application captures errors at these key points:

### 1. React Error Boundary

```tsx
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 2. API Request Logging Middleware

```typescript
// pages/api/_middleware.ts
import type { NextRequest, NextResponse } from 'next/server';
import logger from '../../lib/logger';

export function middleware(req: NextRequest) {
  const start = Date.now();
  const requestId = crypto.randomUUID();
  
  // Attach context to request for logging
  req.headers.set('x-request-id', requestId);
  
  logger.info({
    type: 'request',
    method: req.method,
    url: req.url,
    requestId,
  });
  
  const response = NextResponse.next();
  
  // Log response
  response.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      type: 'response',
      method: req.method,
      url: req.url,
      statusCode: response.status,
      duration,
      requestId,
    });
  });
  
  return response;
}
```

### 3. Global Error Handler

```typescript
// pages/_error.tsx
import * as Sentry from '@sentry/nextjs';
import type { NextPageContext } from 'next';
import NextErrorComponent from 'next/error';

const CustomErrorComponent = ({ statusCode }: { statusCode: number }) => {
  return <NextErrorComponent statusCode={statusCode} />;
};

CustomErrorComponent.getInitialProps = async (context: NextPageContext) => {
  await Sentry.captureUnderscoreErrorException(context);
  return NextErrorComponent.getInitialProps(context);
};

export default CustomErrorComponent;
```

## Client-Side Error Tracking

The application tracks client-side errors with:

1. **Automatic error reporting**:
   - Unhandled exceptions
   - Promise rejections
   - React rendering errors
   
2. **Custom error reporting**:
   ```typescript
   try {
     // Code that might fail
   } catch (error) {
     Sentry.captureException(error, {
       tags: { component: 'DataLoader' },
       extra: { customData: '...' },
     });
   }
   ```

3. **User impact tracking**:
   ```typescript
   Sentry.setUser({
     id: userId,
     role: userRole,
     company: companyId,
   });
   ```

## Network Error Handling

The application implements advanced network error handling:

```typescript
// services/api.ts
import axios from 'axios';
import logger from '../lib/logger';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response } = error;
    
    // Log the error
    logger.error({
      type: 'api_error',
      url: config?.url,
      method: config?.method,
      status: response?.status,
      data: response?.data,
      error: error.message,
    });
    
    // Report to Sentry if 5xx or network error
    if (!response || response.status >= 500) {
      Sentry.captureException(error, {
        tags: {
          api_url: config?.url,
          status_code: response?.status,
        },
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

## Performance Monitoring

### Web Vitals Tracking

```typescript
// pages/_app.tsx
import { reportWebVitals } from 'next/web-vitals';

export function reportWebVitals(metric) {
  // Send to analytics or monitoring service
  if (metric.label === 'web-vital') {
    logger.info({
      type: 'web_vital',
      name: metric.name,
      value: metric.value,
      id: metric.id,
    });
  }
}
```

### Custom Performance Metrics

```typescript
// Performance tracking for critical operations
import { performance } from 'perf_hooks';

export function trackPerformance(operationName: string, callback: () => any) {
  const start = performance.now();
  const result = callback();
  const duration = performance.now() - start;
  
  logger.info({
    type: 'performance',
    operation: operationName,
    duration_ms: duration,
  });
  
  return result;
}
```

## Real-Time Alerts

The application triggers alerts based on these thresholds:

| Metric | Warning Threshold | Critical Threshold | Alert Method |
|--------|-------------------|-------------------|--------------|
| API Error Rate | > 1% | > 5% | Slack + PagerDuty |
| Response Time | > 3000ms | > 5000ms | Slack |
| P95 Latency | > 500ms | > 1000ms | Slack |
| Memory Usage | > 80% | > 90% | Slack + PagerDuty |
| Unhandled Exceptions | > 5/min | > 20/min | Slack + PagerDuty |

## Logging Best Practices

1. **Structured Logging**: Use JSON format with consistent fields
2. **Context Preservation**: Include request IDs in all logs
3. **PII Protection**: Never log sensitive information
4. **Sampling**: Use sampling for high-volume events
5. **Correlation**: Maintain context between client and server

## Debugging Production Issues

1. **Access Logs**:
   ```bash
   # View Vercel logs
   vercel logs finsight-app
   
   # Filter by error type
   vercel logs finsight-app --filter=error
   
   # Follow logs in real-time
   vercel logs finsight-app --follow
   ```

2. **Sentry Dashboard**:
   - View detailed error reports
   - Analyze error trends
   - See affected users
   - Browse performance metrics

3. **Log Queries**:
   - Search by request ID
   - Filter by component
   - View error patterns
   - Analyze performance trends

## Setting Up Monitoring

1. **Environment Variables**:
   ```
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   LOG_LEVEL=info
   ENABLE_PERFORMANCE_MONITORING=true
   ```

2. **Sentry Configuration**:
   - Create a Sentry project
   - Add the DSN to environment variables
   - Configure alert rules
   - Set up integrations (Slack, PagerDuty)

3. **Log Storage**:
   - Development: Local files
   - Production: Vercel Logs or custom solution (Datadog, Loggly, etc.)

## Troubleshooting Common Issues

| Issue | Possible Causes | Resolution Steps |
|-------|----------------|-----------------|
| Missing logs | Incorrect log level | Check LOG_LEVEL env var |
| Sentry not receiving errors | Invalid DSN | Verify SENTRY_DSN |
| Performance degradation | Memory leaks | Check React component lifecycle |
| API timeouts | Slow database queries | Review database indexes |
| Network errors | CORS issues | Check API endpoint configuration |

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/nextjs/)
- [Pino Logger Documentation](https://getpino.io/#/)
- [Next.js Error Handling](https://nextjs.org/docs/advanced-features/error-handling)
- [Web Vitals Monitoring](https://web.dev/vitals/)