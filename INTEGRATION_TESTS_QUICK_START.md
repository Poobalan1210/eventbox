# Integration Tests Quick Start Guide

## Prerequisites

### 1. Start DynamoDB Local
```bash
docker-compose up -d
```

Verify it's running:
```bash
docker ps | grep dynamodb
```

You should see:
- `live-quiz-dynamodb` on port 8000
- `live-quiz-dynamodb-admin` on port 8001

### 2. Setup Database Tables
```bash
npx tsx scripts/setup-local-db.ts --recreate
```

This creates all necessary tables with proper indexes:
- Events (with organizerId-index)
- Templates (with organizerId-index)
- Questions
- Participants
- Answers
- GamePins

## Running Tests

### Run All Integration Tests
```bash
cd backend
npm test
```

### Run Specific Test Suites

#### Organizer UX Workflow Tests (Task 18)
```bash
npm test -- organizer-workflows.test.ts
```

#### Phase 2 Feature Tests
```bash
npm test -- integration.test.ts
```

#### Access Control Tests
```bash
npm test -- accessControl.test.ts
```

#### Template Tests
```bash
npm test -- template.test.ts
```

## Test Coverage

### Organizer UX Workflows (26 tests)
- ✅ Complete organizer workflow (3 tests)
- ✅ Template workflow (4 tests)
- ✅ Privacy workflow (6 tests)
- ✅ Dashboard workflow (6 tests)
- ✅ Public quiz discovery (7 tests)

### Phase 2 Features (39 tests)
- ✅ Game PIN flow (4 tests)
- ✅ Speed-based scoring (6 tests)
- ✅ Answer statistics (4 tests)
- ✅ Streak tracking (4 tests)
- ✅ Image upload (3 tests)
- ✅ Podium display (5 tests)
- ✅ Nickname generator (5 tests)
- ✅ Colorful answer buttons (8 tests)

## Troubleshooting

### Issue: "The table does not have the specified index: organizerId-index"

**Solution**: Run the database setup script
```bash
npx tsx scripts/setup-local-db.ts --recreate
```

### Issue: "Cannot connect to DynamoDB"

**Solution**: Start DynamoDB Local
```bash
docker-compose up -d
```

### Issue: Tests are slow or timing out

**Solution**: Check DynamoDB Local is running and responsive
```bash
# Check containers
docker ps

# Check logs
docker logs live-quiz-dynamodb

# Restart if needed
docker-compose restart
```

### Issue: "Transform failed" or syntax errors

**Solution**: Clear the build cache and reinstall
```bash
cd backend
rm -rf node_modules dist
npm install
npm test
```

## Database Admin UI

Access the DynamoDB Admin UI at:
```
http://localhost:8001
```

This allows you to:
- View all tables
- Inspect table data
- Manually query items
- Debug test data

## Continuous Integration

For CI/CD pipelines, ensure:
1. DynamoDB Local is started before tests
2. Tables are created with proper indexes
3. Tests run with `--run` flag for non-watch mode
4. Cleanup happens after test suite

Example CI script:
```bash
#!/bin/bash
set -e

# Start DynamoDB Local
docker-compose up -d

# Wait for DynamoDB to be ready
sleep 5

# Setup tables
npx tsx scripts/setup-local-db.ts --recreate

# Run tests
cd backend
npm test

# Cleanup
docker-compose down
```

## Test Development Tips

### Writing New Integration Tests

1. **Use helper functions** from existing tests:
   ```typescript
   const event = await createTestEvent('Test Quiz', organizerId);
   const question = await createTestQuestion(event.eventId, 'Question 1');
   ```

2. **Clean up test data** in afterEach:
   ```typescript
   afterEach(async () => {
     for (const eventId of createdEventIds) {
       await eventRepository.deleteEvent(eventId);
     }
     createdEventIds = [];
   });
   ```

3. **Test realistic workflows**, not just individual functions

4. **Use descriptive test names** that explain the scenario

5. **Verify both success and failure cases**

### Running Tests in Watch Mode

For development, use watch mode:
```bash
npm test -- --watch organizer-workflows.test.ts
```

This will re-run tests automatically when files change.

## Performance Considerations

- Integration tests use real DynamoDB operations
- Each test creates and cleans up its own data
- Tests run in parallel by default (Vitest)
- Average test suite execution: ~200-400ms

## Next Steps

After running integration tests successfully:
1. Review test coverage reports
2. Add tests for new features
3. Consider adding performance tests (Task 19)
4. Set up CI/CD pipeline with automated testing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [DynamoDB Local Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
