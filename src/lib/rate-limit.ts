import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per interval
}

// Simple in-memory rate limiter (for production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig = { interval: 60000, maxRequests: 60 }) {
  return async function rateLimitMiddleware(request: NextRequest) {
    // Get client identifier (IP address or user ID)
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'anonymous';
    
    const now = Date.now();
    const clientData = requestCounts.get(clientId);
    
    // Clean up old entries periodically
    if (requestCounts.size > 10000) {
      for (const [key, value] of requestCounts.entries()) {
        if (value.resetTime < now) {
          requestCounts.delete(key);
        }
      }
    }
    
    if (!clientData || clientData.resetTime < now) {
      // First request or time window expired
      requestCounts.set(clientId, {
        count: 1,
        resetTime: now + config.interval
      });
      return { allowed: true, remaining: config.maxRequests - 1 };
    }
    
    if (clientData.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      return { 
        allowed: false, 
        remaining: 0,
        retryAfter 
      };
    }
    
    // Increment counter
    clientData.count++;
    return { 
      allowed: true, 
      remaining: config.maxRequests - clientData.count 
    };
  };
}

// Preset configurations for different endpoints
export const rateLimits = {
  // Strict limit for auth endpoints
  auth: rateLimit({ interval: 60000, maxRequests: 5 }),
  
  // Moderate limit for write operations
  write: rateLimit({ interval: 60000, maxRequests: 30 }),
  
  // Lenient limit for read operations
  read: rateLimit({ interval: 60000, maxRequests: 100 }),
  
  // Very strict limit for file uploads
  upload: rateLimit({ interval: 60000, maxRequests: 10 }),
};