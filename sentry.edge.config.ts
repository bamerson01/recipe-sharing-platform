import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry in production
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Adjust this value in production
    tracesSampleRate: 0.1,
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    
    // Filter out sensitive information
    beforeSend(event, hint) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      
      // Filter out sensitive data from error messages
      if (event.exception) {
        event.exception.values?.forEach(exception => {
          if (exception.value) {
            // Remove potential PII from error messages
            exception.value = exception.value
              .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
              .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[credit-card]')
              .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]');
          }
        });
      }
      
      return event;
    },
  });
}