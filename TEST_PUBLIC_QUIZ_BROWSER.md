# Public Quiz Browser - Testing Guide

## Quick Test Checklist

### 1. Navigation Test
- [ ] Navigate to home page (`/`)
- [ ] Click "Browse Public Quizzes" button
- [ ] Verify navigation to `/public-quizzes`
- [ ] Check "Public Quizzes" link in navigation bar
- [ ] Verify link is highlighted when on the page

### 2. Component Rendering Test
- [ ] Page loads without errors
- [ ] Header displays "Public Quizzes" title
- [ ] Filter buttons render (All, Live, Upcoming)
- [ ] Search input field is visible
- [ ] Quiz grid displays (if quizzes exist)

### 3. Filter Functionality Test
- [ ] Click "All" filter - shows all quizzes
- [ ] Click "Live" filter - shows only live quizzes
- [ ] Click "Upcoming" filter - shows only upcoming quizzes
- [ ] Active filter button has white background
- [ ] Inactive filter buttons have transparent background

### 4. Search Functionality Test
- [ ] Type in search box
- [ ] Results filter in real-time
- [ ] Search matches quiz names
- [ ] Search matches quiz topics
- [ ] Search is case-insensitive
- [ ] Clear search shows all quizzes again

### 5. Quiz Card Display Test
Each quiz card should show:
- [ ] Quiz name
- [ ] Topic (if available)
- [ ] Description (if available, truncated to 2 lines)
- [ ] Status badge (Live with pulse or Upcoming)
- [ ] Participant count with 👥 icon
- [ ] Public visibility with 🌐 icon
- [ ] Date information (Started time for live, Created date for upcoming)
- [ ] "Join Quiz" button

### 6. Interaction Test
- [ ] Hover over quiz card - shadow increases
- [ ] Click "Join Quiz" button
- [ ] Verify navigation to `/join/:eventId`
- [ ] Back button returns to public quizzes page

### 7. Empty States Test
- [ ] With no public quizzes: Shows "No quizzes found" message
- [ ] With filters that match nothing: Shows helpful message
- [ ] Loading state: Shows spinner and "Loading..." message
- [ ] Error state: Shows error message and "Try Again" button

### 8. Responsive Design Test
- [ ] Desktop (>1024px): 3 columns grid
- [ ] Tablet (768-1024px): 2 columns grid
- [ ] Mobile (<768px): 1 column grid
- [ ] Mobile menu includes "Public Quizzes" link
- [ ] All buttons are touch-friendly on mobile

### 9. Results Count Test
- [ ] Results count displays at bottom
- [ ] Shows "Showing X of Y quizzes"
- [ ] Updates when filters change
- [ ] Proper singular/plural ("quiz" vs "quizzes")

### 10. API Integration Test
- [ ] Component fetches from `/api/events/public`
- [ ] Handles successful response
- [ ] Handles error response
- [ ] Retry button works after error
- [ ] Loading state shows during fetch

## Test Data Setup

To test with actual data, you need public quizzes in the database:

1. Create a quiz via the UI
2. Set visibility to "public" 
3. Optionally set status to "live" or keep as "upcoming"
4. Add topic and description for better testing

## Expected Behavior

### Status Filter Logic
- **All**: Shows both live and upcoming quizzes
- **Live**: Shows only quizzes with status='live'
- **Upcoming**: Shows only quizzes with status='upcoming'
- Completed quizzes are never shown in public browser

### Search Logic
- Searches in both `name` and `topic` fields
- Case-insensitive matching
- Partial matches work (e.g., "math" matches "Mathematics Quiz")
- Empty search shows all quizzes

### Sorting
- Live quizzes appear first
- Within same status, most recent first
- Uses `startedAt` for live quizzes
- Uses `createdAt` for upcoming quizzes

## Common Issues to Check

1. **No quizzes showing**: Check if any quizzes are marked as public in database
2. **Search not working**: Verify search query is trimmed and lowercased
3. **Filters not working**: Check status categorization logic
4. **Navigation broken**: Verify route is added to App.tsx
5. **Styling issues**: Check Tailwind classes are correct

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Performance Considerations

- Component uses client-side filtering (fast for <100 quizzes)
- Backend supports pagination (not yet implemented in UI)
- Consider adding pagination if >50 quizzes
- Search is debounced by React's state updates

## Accessibility

- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Screen reader friendly labels
- [ ] Color contrast meets WCAG standards
- [ ] Touch targets are at least 44x44px

## Success Criteria

✅ All navigation links work
✅ Filters work correctly
✅ Search works correctly
✅ Quiz cards display all required information
✅ Join button navigates correctly
✅ Responsive on all screen sizes
✅ No console errors
✅ No TypeScript errors
✅ Build completes successfully
