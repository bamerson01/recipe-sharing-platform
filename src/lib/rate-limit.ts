import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per interval
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Simple in-memory rate limiter with LRU-like cleanup
// For production, consider using Redis or a database-backed solution
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private maxSize = 5000; // Maximum number of entries to prevent memory exhaustion
  private cleanupInterval = 60000; // Cleanup every minute
  private lastCleanup = Date.now();

  get(key: string): RateLimitEntry | undefined {
    this.periodicCleanup();
    return this.store.get(key);
  }

  set(key: string, value: RateLimitEntry): void {
    this.periodicCleanup();
    
    // If store is at capacity, remove oldest entries
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const toDelete = Math.floor(this.maxSize * 0.2); // Remove 20% of entries
      const entries = Array.from(this.store.entries())
        .sort((a, b) => a[1].resetTime - b[1].resetTime);
      
      for (let i = 0; i < toDelete && i < entries.length; i++) {
        this.store.delete(entries[i][0]);
      }
    }
    
    this.store.set(key, value);
  }

  private periodicCleanup(): void {
    const now = Date.now();
    
    // Only run cleanup if enough time has passed
    if (now - this.lastCleanup < this.cleanupInterval) {
      return;
    }
    
    this.lastCleanup = now;
    
    // Remove expired entries
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

const rateLimitStore = new RateLimitStore();

export function rateLimit(config: RateLimitConfig = { interval: 60000, maxRequests: 60 }) {
  return async function rateLimitMiddleware(request: NextRequest) {
    // Get client identifier (IP address or user ID)
    const clientId = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                    request.headers.get('x-real-ip') || 
                    request.headers.get('cf-connecting-ip') || // Cloudflare
                    'anonymous';
    
    const now = Date.now();
    const clientData = rateLimitStore.get(clientId);
    
    if (!clientData || clientData.resetTime < now) {
      // First request or time window expired
      rateLimitStore.set(clientId, {
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
    rateLimitStore.set(clientId, clientData);
    
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