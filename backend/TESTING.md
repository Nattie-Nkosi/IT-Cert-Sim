# Testing Guide

## Quick Start

### 1. Start the Backend Server
```bash
cd backend
bun run dev
```

### 2. Run Tests (in a new terminal)
```bash
cd backend
bun test
```

## Test Commands

```bash
# Run all admin tests
bun test

# Run tests in watch mode (re-run on changes)
bun test:watch

# Run with verbose output
bun test:verbose

# Run specific test suite
bun test tests/admin.test.ts -t "Question Management"
```

## Test Coverage Summary

### 26 Test Cases Covering:

1. **Admin Authentication (6 tests)**
   - Access control without token
   - Access control with regular user token
   - Access control with admin token
   - Token validation

2. **Certification Management (2 tests)**
   - Create certifications
   - Prevent duplicate certification codes

3. **Question Management (7 tests)**
   - Create single questions
   - Validate required fields
   - Get all questions
   - Filter by certification
   - Update questions
   - Delete questions

4. **Bulk Upload (2 tests)**
   - Upload multiple questions
   - Validate bulk data

5. **Exam Management (4 tests)**
   - Create exams with questions
   - Get all exams
   - Get exam details
   - Update exam questions

6. **PDF Parsing (1 test)**
   - Parse PDF files with questions

7. **Data Validation (4 tests)**
   - Question type validation
   - Difficulty level validation
   - Exam question list validation
   - Passing score validation

## Test Data

All tests use isolated test data:
- Test users: `admin@test.com`, `user@test.com`
- Test certifications and questions are created and cleaned up automatically
- No impact on production data

## Prerequisites

✅ Backend server running on `http://localhost:3001`
✅ PostgreSQL database connected
✅ Database migrations applied (`bun run db:push`)
✅ Environment variables configured (`.env`)

## Expected Output

```bash
$ bun test

✓ Admin Authentication > should deny access without token
✓ Admin Authentication > should deny access with regular user token
✓ Admin Authentication > should allow access with admin token
✓ Certification Management > should create a new certification
✓ Certification Management > should fail to create duplicate certification code
✓ Question Management > should create a single question
✓ Question Management > should fail to create question without answers
✓ Question Management > should get all questions
✓ Question Management > should filter questions by certification
✓ Question Management > should update a question
✓ Question Management > should delete a question
✓ Bulk Question Upload > should upload multiple questions in bulk
✓ Bulk Question Upload > should fail bulk upload with invalid data
✓ Exam Management > should create an exam with questions
✓ Exam Management > should get all exams for admin
✓ Exam Management > should get exam details with questions
✓ Exam Management > should update exam questions
✓ PDF Parsing > should parse PDF with exam questions
✓ Data Validation > should reject question with invalid question type
✓ Data Validation > should reject question with invalid difficulty
✓ Data Validation > should reject exam with empty question list
✓ Data Validation > should reject exam with invalid passing score

26 tests passed
```

## Troubleshooting

### "Connection refused" Error
**Problem:** Tests can't connect to backend
**Solution:**
```bash
# Make sure backend is running
cd backend
bun run dev
```

### "Unauthorized" Errors
**Problem:** JWT tokens not working
**Solution:**
```bash
# Check .env file has JWT_SECRET
echo "JWT_SECRET=your-secret-key" >> .env
```

### Database Errors
**Problem:** Prisma can't connect to database
**Solution:**
```bash
# Check DATABASE_URL in .env
# Run migrations
bun run db:push
```

### Tests Leave Data Behind
**Problem:** Test data not cleaned up
**Solution:**
```sql
-- Manually clean test data
DELETE FROM users WHERE email IN ('admin@test.com', 'user@test.com');
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: |
          cd backend
          bun install

      - name: Setup database
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        run: |
          cd backend
          bun run db:push

      - name: Start backend
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          JWT_SECRET: test-secret
        run: |
          cd backend
          bun run dev &
          sleep 5

      - name: Run tests
        run: |
          cd backend
          bun test
```

## Writing New Tests

### Template for New Test Suite

```typescript
describe('New Feature', () => {
  let testData: any;

  test('should do something', async () => {
    const response = await fetch(`${API_URL}/admin/endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        field: 'value',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.field).toBe('value');
  });
});
```

### Best Practices

1. ✅ Use descriptive test names
2. ✅ Test happy path and error cases
3. ✅ Clean up test data
4. ✅ Use existing test helpers
5. ✅ Test one thing per test
6. ✅ Make tests independent

## Further Reading

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Testing Best Practices](https://testingjavascript.com/)
- See `tests/README.md` for detailed test coverage
