# Debug Endpoints

⚠️ **WARNING: These endpoints are for development only and should be removed or secured before production deployment.**

## Security Notice

These debug endpoints are created for development and troubleshooting purposes. They expose internal application state and database structure.

### Before Production Deployment:

1. **Option 1: Remove Entirely**
   ```bash
   rm -rf src/app/api/debug
   ```

2. **Option 2: Add Authentication & Environment Check**
   Add this to each debug endpoint:
   ```typescript
   // Check environment
   if (process.env.NODE_ENV === 'production') {
     return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
   }
   
   // Add authentication check
   const { data: { user } } = await supabase.auth.getUser();
   if (!user || !ADMIN_USER_IDS.includes(user.id)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   }
   ```

3. **Option 3: Use Environment Variable**
   ```typescript
   if (!process.env.ENABLE_DEBUG_ENDPOINTS) {
     return NextResponse.json({ error: 'Debug endpoints disabled' }, { status: 403 });
   }
   ```

## Current Debug Endpoints

- `/api/debug/check-tables` - Verifies database table structure
- `/api/debug/social-debug` - Tests social features functionality
- `/api/debug/verify-counts` - Verifies follower/following counts
- `/api/debug/test-social` - Tests social features with authentication
- `/api/debug/test-insert` - Tests database insert operations

## Notes

- Never expose these endpoints in production without proper authentication
- Consider using feature flags for conditional availability
- Log all access to debug endpoints for security auditing