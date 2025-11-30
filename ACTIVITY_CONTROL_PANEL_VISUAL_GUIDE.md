# Activity Control Panel - Visual Guide

## Component Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Activity Control Panel                                       │
│ Manage which activity is currently active for participants   │
├─────────────────────────────────────────────────────────────┤
│ ● Currently Active: Quiz: General Knowledge                  │
│                                          [⏸️ Deactivate]     │
├─────────────────────────────────────────────────────────────┤
│ ❓ Quiz: General Knowledge              [✓ Ready]            │
│    quiz • Order: 1                      [⏸️ Deactivate]     │
├─────────────────────────────────────────────────────────────┤
│ 📊 Poll: Favorite Color                 [✓ Ready]            │
│    poll • Order: 2                      [▶️ Activate]       │
├─────────────────────────────────────────────────────────────┤
│ 🎁 Raffle: Grand Prize                  [📝 Draft]           │
│    raffle • Order: 3                    Not ready            │
├─────────────────────────────────────────────────────────────┤
│ Total Activities: 3    Ready: 1 | Active: 1 | Completed: 0  │
└─────────────────────────────────────────────────────────────┘
```

## State Examples

### No Active Activity

```
┌─────────────────────────────────────────────────────────────┐
│ Activity Control Panel                                       │
│ Manage which activity is currently active for participants   │
├─────────────────────────────────────────────────────────────┤
│ ⏸️ No active activity - Participants are in waiting state   │
├─────────────────────────────────────────────────────────────┤
│ ❓ Quiz: General Knowledge              [✓ Ready]            │
│    quiz • Order: 1                      [▶️ Activate]       │
├─────────────────────────────────────────────────────────────┤
│ 📊 Poll: Favorite Color                 [✓ Ready]            │
│    poll • Order: 2                      [▶️ Activate]       │
└─────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────┐
│ Activity Control Panel                                       │
│ Manage which activity is currently active for participants   │
├─────────────────────────────────────────────────────────────┤
│                    ⏳ Loading control panel...               │
└─────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────┐
│ Activity Control Panel                                       │
│ Manage which activity is currently active for participants   │
├─────────────────────────────────────────────────────────────┤
│        No activities to control. Add activities to get       │
│                         started.                             │
└─────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────┐
│ Activity Control Panel                                       │
│ Manage which activity is currently active for participants   │
├─────────────────────────────────────────────────────────────┤
│ ❌ Failed to load activities                                 │
│                                              [Retry]         │
└─────────────────────────────────────────────────────────────┘
```

## Status Badge Colors

| Status    | Color  | Background | Text    | Icon |
|-----------|--------|------------|---------|------|
| Draft     | Gray   | #F3F4F6    | #374151 | 📝   |
| Ready     | Blue   | #DBEAFE    | #1E40AF | ✓    |
| Active    | Green  | #D1FAE5    | #065F46 | ●    |
| Completed | Purple | #E9D5FF    | #6B21A8 | ✓    |

## Banner Colors

| Banner Type      | Background | Border     | Text    |
|------------------|------------|------------|---------|
| Active Activity  | Green/20   | Green/30   | Green   |
| No Activity      | Yellow/20  | Yellow/30  | Yellow  |

## Button States

### Activate Button (Ready Activity)
```
┌──────────────────┐
│  ▶️ Activate     │  ← Green background (#16A34A)
└──────────────────┘
```

### Deactivate Button (Active Activity)
```
┌──────────────────┐
│  ⏸️ Deactivate   │  ← Orange background (#EA580C)
└──────────────────┘
```

### Disabled State (Draft Activity)
```
┌──────────────────┐
│  Not ready       │  ← Gray text, no button
└──────────────────┘
```

### Loading State
```
┌──────────────────┐
│  ⏳ Activating... │  ← Disabled, shows progress
└──────────────────┘
```

## Responsive Behavior

### Desktop (> 768px)
- Full width layout
- All elements visible
- Buttons on the right side

### Mobile (< 768px)
- Stacked layout
- Activity name truncates
- Buttons stack below activity info

## Interaction Flow

### Activating an Activity

1. User clicks "▶️ Activate" button
2. Button changes to "⏳ Activating..."
3. API call to `/api/activities/:id/activate`
4. On success:
   - Previously active activity deactivates
   - New activity becomes active
   - Active banner updates
   - Button changes to "⏸️ Deactivate"
5. On error:
   - Alert shows error message
   - Button returns to "▶️ Activate"

### Deactivating an Activity

1. User clicks "⏸️ Deactivate" button
2. Button changes to "⏳ Deactivating..."
3. API call to `/api/activities/:id/deactivate`
4. On success:
   - Activity becomes ready
   - Active banner changes to "No active activity"
   - Button changes to "▶️ Activate"
5. On error:
   - Alert shows error message
   - Button returns to "⏸️ Deactivate"

## Accessibility Features

- **Semantic HTML**: Uses proper heading hierarchy
- **Button Labels**: Clear, descriptive text with emoji icons
- **Disabled States**: Properly indicated with opacity and cursor
- **Color Contrast**: All text meets WCAG AA standards
- **Keyboard Navigation**: All buttons are keyboard accessible
- **Screen Readers**: Proper ARIA labels (implicit via semantic HTML)

## Animation Details

### Pulse Animation (Active Indicator)
- Green dot pulses at 1s intervals
- Opacity: 1 → 0.5 → 1
- Draws attention to active state

### Loading Spinner
- Rotates continuously
- 2px border, white color
- 8x8 size for inline use, 12x12 for full-page

### Hover Effects
- Buttons: Darken on hover
- Activity rows: Subtle background change
- Smooth transitions (200ms)

## Integration Examples

### With EventActivities Page

```tsx
<div className="space-y-6">
  {/* Control Panel at top */}
  <ActivityControlPanel
    eventId={eventId}
    organizerId={organizerId}
    onActivityChange={handleRefresh}
  />
  
  {/* Activity List below */}
  <ActivityList
    eventId={eventId}
    organizerId={organizerId}
    onActivityEdit={handleEdit}
  />
</div>
```

### Standalone Dashboard Widget

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Left: Control Panel */}
  <ActivityControlPanel
    eventId={eventId}
    organizerId={organizerId}
  />
  
  {/* Right: Other widgets */}
  <ParticipantCount eventId={eventId} />
</div>
```

## Performance Considerations

- **Memoization**: Consider memoizing activity list rendering
- **Debouncing**: Prevent rapid activate/deactivate clicks
- **Optimistic Updates**: Update UI before API response
- **Error Recovery**: Revert optimistic updates on error

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Known Limitations

1. **No Drag-and-Drop**: Activities cannot be reordered in this component
2. **No Bulk Actions**: Must activate/deactivate one at a time
3. **No Preview**: Cannot preview activity before activation
4. **No Scheduling**: Cannot schedule future activations

These limitations are intentional for the MVP and can be addressed in future iterations.
