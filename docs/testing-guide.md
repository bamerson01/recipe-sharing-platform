# Testing Guide

## Overview

This project uses Vitest as the testing framework with support for unit, integration, and component testing.

## Setup

Testing infrastructure is already configured with:
- **Vitest** - Fast unit test framework
- **@testing-library/react** - React component testing
- **@vitest/ui** - Interactive test UI
- **vitest-environment-jsdom** - Browser environment simulation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

Tests are organized alongside the code they test:

```
src/
├── lib/
│   ├── logger/
│   │   ├── index.ts
│   │   └── logger.test.ts
│   ├── services/
│   │   ├── recipe-service.ts
│   │   └── recipe-service.test.ts
│   └── validation/
│       ├── api-schemas.ts
│       └── api-schemas.test.ts
```

## Writing Tests

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { functionToTest } from './module';

describe('Module Name', () => {
  it('should do something specific', () => {
    const result = functionToTest(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### Testing with Mocks

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('@/lib/db/server', () => ({
  getServerSupabase: vi.fn(() => mockSupabaseClient)
}));

// Mock console methods
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
```

### Testing Async Code

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing with Environment Variables

```typescript
beforeEach(() => {
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
});
```

## Test Coverage

Current test coverage includes:

1. **Logger Service** (`src/lib/logger/logger.test.ts`)
   - Log level filtering
   - Environment-specific behavior
   - Structured logging format
   - Helper methods (API, database, auth, user actions)

2. **Recipe Service** (`src/lib/services/recipe-service.test.ts`)
   - Recipe fetching with filters
   - Following feed functionality
   - Search capabilities
   - Error handling

3. **Validation Schemas** (`src/lib/validation/api-schemas.test.ts`)
   - Profile update validation
   - Recipe creation/update validation
   - Comment validation
   - Pagination validation

## Best Practices

1. **Test Organization**
   - Keep tests close to the code they test
   - Use descriptive test names
   - Group related tests with `describe` blocks

2. **Mocking**
   - Mock external dependencies (database, APIs)
   - Use `vi.spyOn` for function spying
   - Clean up mocks with `vi.restoreAllMocks()`

3. **Assertions**
   - Test both success and failure cases
   - Verify error messages and types
   - Check edge cases and boundary conditions

4. **Performance**
   - Keep unit tests fast and isolated
   - Use `beforeEach` and `afterEach` for setup/cleanup
   - Avoid testing implementation details

## Continuous Integration

Tests are configured to run in CI with:
- Coverage reporting
- Failure notifications
- Parallel test execution

## Adding New Tests

When adding new features:
1. Write tests alongside the implementation
2. Ensure tests pass before committing
3. Maintain or improve coverage
4. Update this guide if new patterns emerge

## Debugging Tests

```bash
# Run specific test file
npm test src/lib/logger/logger.test.ts

# Run tests matching pattern
npm test -- --grep "Logger"

# Debug with Node inspector
node --inspect-brk ./node_modules/.bin/vitest
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)