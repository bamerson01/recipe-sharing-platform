import * as Sentry from '@sentry/nextjs';

// Only initialize Sentry in production
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    
    // Adjust this value in production
    tracesSampleRate: 0.1,
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    
    replaysOnErrorSampleRate: 1.0,
    
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,
    
    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    integrations: [
      Sentry.replayIntegration({
        // Additional Replay configuration goes in here
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
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
    
    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random plugins/extensions
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Facebook related errors
      'fb_xd_fragment',
      // Network errors that are usually client-side issues
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // User cancelled actions
      'Non-Error promise rejection captured',
      'User cancelled',
      'User denied',
    ],
  });
}