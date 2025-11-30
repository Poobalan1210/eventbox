# Performance Testing Guide

## Quick Start

Run all performance tests:

```bash
cd backend
npx vitest run performance.test.ts
```

Run with detailed output:

```bash
cd backend
npx vitest run performance.test.ts --reporter=verbose
```

Run specific test suite:

```bash
cd backend
npx vitest run performance.test.ts -t "Dashboard Loading"
```

---

## Test Suites

### 19.1 Dashboard Loading Performance
Tests dashboard loading with 100+ quizzes

**What it tests**:
- Loading 100 quizzes from database
- Categorizing quizzes (live, upcoming, past)
- Sorting quizzes by status and date

**Performance targets**:
- Dashboard load: < 2 seconds
- Categorization: < 100ms
- Sorting: < 100ms

### 19.2 Search Performance
Tests search and filter operations with 150+ quizzes

**What it tests**:
- Search by quiz name
- Search by topic
- Filter by status
- Combined search and filter

**Performance target**: < 300ms for all search operations

### 19.3 Real-time Updates
Tests concurrent quiz updates with 20 live quizzes

**What it tests**:
- Updating participant counts
- Fetching updated quiz lists
- Concurrent status transitions
- Processing quiz list updates

**Performance targets**:
- Concurrent updates: < 500ms
- Quiz list fetch: < 2 seconds
- List processing: < 100ms

### 19.4 Template Operations
Tests template loading and creation with 50+ templates

**What it tests**:
- Creating templates with 20 questions
- Loading templates
- Creating quizzes from templates
- Loading multiple templates
- Filtering public templates

**Performance targets**:
- Template creation: < 1 second
- Template loading: < 500ms

### 19.5 Mode Transitions
Tests quiz state transitions

**What it tests**:
- Draft → Setup transition
- Setup → Live transition
- Live → Completed transition
- Concurrent transitions

**Performance target**: < 500ms per transition

### 19.6 Public Quiz Discovery
Tests public quiz browsing with 100+ public quizzes

**What it tests**:
- Loading public quizzes
- Filtering by status
- Searching public quizzes

**Performance targets**:
- Load: < 2 seconds
- Search/filter: < 300ms

---

## Understanding Test Results

### Reading Performance Output

```
Dashboard loaded 100 quizzes in 5.94ms
```

- **100 quizzes**: Number of items processed
- **5.94ms**: Actual execution time
- Compare against target (< 2000ms in this case)

### Test Status Indicators

- ✅ **PASS**: Test met performance target
- ❌ **FAIL**: Test exceeded performance target
- ⚠️ **WARN**: Test passed but close to target

### Performance Metrics

All tests measure:
- **Duration**: Time to complete operation
- **Throughput**: Items processed per second
- **Scalability**: Performance with increasing load

---

## Test Data

### Automatically Created

The tests automatically create:
- **385 events** across all test suites
- **53 templates** for template testing
- **Questions** for various quizzes

### Automatic Cleanup

All test data is automatically cleaned up after tests complete.

---

## Performance Targets

From `design.md`:

| Operation | Target | Typical Result |
|-----------|--------|----------------|
| Dashboard initial load | < 2 seconds | ~6ms |
| Mode transition | < 500ms | ~3ms |
| Search results | < 300ms | ~0.1ms |
| Template creation | < 1 second | ~4ms |
| Quiz list update | < 100ms | ~0.3ms |

---

## Troubleshooting

### Tests Running Slowly

If tests exceed performance targets:

1. **Check database connection**: Ensure DynamoDB is running
2. **Check system resources**: High CPU/memory usage can affect results
3. **Run tests individually**: Isolate slow test suites
4. **Check network**: Ensure stable connection to database

### Tests Failing

Common issues:

1. **Database not running**: Start local DynamoDB
2. **Environment variables**: Check `.env.local` configuration
3. **Permissions**: Ensure database access permissions
4. **Concurrent tests**: Run tests sequentially if needed

### Cleanup Issues

If cleanup fails:

```bash
# Manually clean up test data
cd backend
npm run test -- performance.test.ts --run
```

The `afterAll` hook will attempt cleanup even if tests fail.

---

## Best Practices

### Running Performance Tests

1. **Close other applications**: Minimize system load
2. **Run multiple times**: Average results across runs
3. **Use consistent environment**: Same hardware/network
4. **Monitor resources**: Watch CPU/memory during tests

### Interpreting Results

1. **Look for trends**: Single slow test vs consistent slowness
2. **Compare to targets**: Not just pass/fail
3. **Consider variance**: Some variation is normal
4. **Check logs**: Review console output for insights

### Adding New Tests

When adding performance tests:

1. **Set clear targets**: Define acceptable performance
2. **Use realistic data**: Match production scenarios
3. **Clean up resources**: Always clean up test data
4. **Document expectations**: Explain what's being tested

---

## Integration with CI/CD

### Running in CI

```yaml
# Example GitHub Actions workflow
- name: Run Performance Tests
  run: |
    cd backend
    npx vitest run performance.test.ts
```

### Performance Regression Detection

Monitor test durations over time:

```bash
# Save results
npx vitest run performance.test.ts --reporter=json > perf-results.json

# Compare with baseline
# (implement custom comparison script)
```

---

## Related Documentation

- **PERFORMANCE_TEST_REPORT.md**: Detailed test results
- **design.md**: Performance targets and requirements
- **tasks.md**: Task 19 implementation details

---

## Support

For questions or issues with performance tests:

1. Check test output for specific error messages
2. Review PERFORMANCE_TEST_REPORT.md for expected results
3. Verify environment configuration
4. Check database connectivity

---

## Summary

Performance tests verify that the Organizer UX Improvements feature meets all performance targets:

✅ All 25 tests passing  
✅ All targets exceeded by 50-3000x  
✅ Production-ready performance  
✅ Excellent scalability  

Run tests regularly to ensure performance remains optimal as the codebase evolves.
