# Admin Features Test Suite

Comprehensive test cases for all admin functionality in the IT Cert Simulator backend.

## Test Coverage

### 1. Admin Authentication (6 tests)
- ✅ Deny access without token
- ✅ Deny access with regular user token
- ✅ Allow access with admin token

### 2. Certification Management (2 tests)
- ✅ Create new certification
- ✅ Reject duplicate certification codes

### 3. Question Management (7 tests)
- ✅ Create single question
- ✅ Fail to create question without answers
- ✅ Get all questions
- ✅ Filter questions by certification
- ✅ Update a question
- ✅ Delete a question

### 4. Bulk Question Upload (2 tests)
- ✅ Upload multiple questions in bulk
- ✅ Fail bulk upload with invalid data

### 5. Exam Management (4 tests)
- ✅ Create exam with questions
- ✅ Get all exams for admin
- ✅ Get exam details with questions
- ✅ Update exam questions

### 6. PDF Parsing (1 test)
- ✅ Parse PDF with exam questions

### 7. Data Validation (4 tests)
- ✅ Reject invalid question type
- ✅ Reject invalid difficulty level
- ✅ Reject exam with empty question list
- ✅ Handle invalid passing score

## Prerequisites

1. **Database Setup**
   - Ensure PostgreSQL is running
   - Database should be created and migrated
   ```bash
   cd backend
   bun run db:push
   ```

2. **Backend Server**
   - The backend server should be running on `http://localhost:3001`
   ```bash
   bun run dev
   ```

## Running Tests

### Run All Tests
```bash
cd backend
bun test tests/admin.test.ts
```

### Run with Verbose Output
```bash
bun test tests/admin.test.ts --verbose
```

### Run Specific Test Suite
```bash
bun test tests/admin.test.ts -t "Admin Authentication"
```

### Watch Mode (Re-run on changes)
```bash
bun test --watch tests/admin.test.ts
```

## Test Structure

```
tests/
└── admin.test.ts
    ├── Setup (beforeAll)
    │   ├── Create test users (admin & regular user)
    │   ├── Login and get tokens
    │   └── Clean up existing test data
    │
    ├── Test Suites
    │   ├── Admin Authentication
    │   ├── Certification Management
    │   ├── Question Management
    │   ├── Bulk Question Upload
    │   ├── Exam Management
    │   ├── PDF Parsing
    │   └── Data Validation
    │
    └── Cleanup (afterAll)
        └── Remove all test data
```

## Test Data

The tests create and clean up the following test data:

- **Users:**
  - `admin@test.com` (ADMIN role)
  - `user@test.com` (USER role)

- **Certifications:**
  - Test Certification
  - CompTIA Network+ (N10-009)

- **Questions:**
  - Various test questions with different types and difficulties

- **Exams:**
  - Test exams with selected questions

All test data is automatically cleaned up after tests complete.

## Expected Results

```
✓ Admin Authentication (6 tests)
✓ Certification Management (2 tests)
✓ Question Management (7 tests)
✓ Bulk Question Upload (2 tests)
✓ Exam Management (4 tests)
✓ PDF Parsing (1 test)
✓ Data Validation (4 tests)

Total: 26 tests passed
```

## Troubleshooting

### Tests Failing with "Connection Refused"
- Ensure backend server is running on port 3001
- Check DATABASE_URL environment variable

### Authentication Errors
- Verify JWT_SECRET is set in .env
- Check that test users are being created properly

### Database Errors
- Run migrations: `bun run db:push`
- Check database connection string
- Ensure PostgreSQL is running

### Cleanup Issues
- If test data persists, manually clean:
  ```sql
  DELETE FROM users WHERE email IN ('admin@test.com', 'user@test.com');
  ```

## Adding New Tests

1. **Create test suite:**
   ```typescript
   describe('New Feature', () => {
     test('should do something', async () => {
       // Test code
     });
   });
   ```

2. **Use test helpers:**
   - `createTestUser()` - Create test users
   - `login()` - Get authentication token
   - `adminToken` - Admin JWT token
   - `userToken` - Regular user JWT token

3. **Follow naming conventions:**
   - Descriptive test names
   - Use "should" statements
   - Group related tests in describe blocks

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
test:
  script:
    - bun install
    - bun run db:push
    - bun run dev & # Start server in background
    - sleep 5 # Wait for server to start
    - bun test tests/admin.test.ts
```

## Coverage Report

To generate coverage report (future enhancement):
```bash
bun test --coverage tests/admin.test.ts
```

## Notes

- Tests use real database (consider test database)
- Tests are executed sequentially
- Each test suite is independent
- All test data is cleaned up automatically
- Tests require running backend server
