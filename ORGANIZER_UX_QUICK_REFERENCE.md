# Organizer UX Improvements - Quick Reference

## 🚀 Quick Start

### Create Your First Quiz
```
1. Click "My Quizzes" → "+ New"
2. Choose "Start from Blank" or "Use Template"
3. Add questions in Setup Mode
4. Click "Ready to Start Quiz"
5. Share Game PIN with participants
```

### Use a Template
```
1. Click "+ New" → "Use Template"
2. Select a template
3. Edit questions if needed
4. Start quiz
```

### Make Quiz Public
```
1. In Setup Mode, set Privacy to "Public"
2. Add topic and description
3. Start quiz
4. It appears in public browser automatically
```

---

## 📊 Dashboard

### Quiz Categories
- **🔴 Live**: Currently running quizzes
- **📅 Upcoming**: Draft or setup mode quizzes
- **✓ Past**: Completed quizzes

### Quick Actions
- **Search**: Type quiz name or topic
- **Filter**: Click tabs (All, Live, Upcoming, Past)
- **Create**: Click "+ New" button
- **Manage**: Click quiz card actions

---

## 🎯 Modes

### Setup Mode
**Purpose**: Create and edit questions

**Features**:
- Add/edit questions
- Drag to reorder
- Preview participant view
- Save as draft
- Set privacy

**Start Quiz**: Click "Ready to Start Quiz"

### Live Mode
**Purpose**: Run quiz session

**Features**:
- Real-time participant tracking
- Answer submission progress
- Quiz controls (Next, Show Results, End)
- Progress indicator

**Cannot**: Edit questions

---

## 📋 Templates

### Create Template
```
Setup Mode → "Save as Template" → Enter details → Save
```

### Use Template
```
Dashboard → "+ New" → "Use Template" → Select → Create
```

### Template Options
- **Private**: Only you can use
- **Public**: Anyone can use

---

## 🔒 Privacy

### Private Quiz 🔒
- Requires Game PIN
- Not in public browser
- Default setting

### Public Quiz 🌐
- Discoverable by anyone
- In public browser
- Still uses Game PIN

**Change Privacy**: Setup Mode → Privacy dropdown

**Note**: Cannot change once quiz is live

---

## 🌐 Public Quiz Browser

### For Participants
```
Browse Public Quizzes → Search/Filter → Join Quiz
```

### For Organizers
```
Set quiz to Public → Add topic/description → Start quiz
```

**Appears automatically** in public browser when live

---

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + N`: Create new quiz
- `Ctrl/Cmd + S`: Save draft
- `Ctrl/Cmd + P`: Preview question
- `Ctrl/Cmd + Enter`: Save question
- `Esc`: Close dialogs
- `Ctrl/Cmd + F`: Focus search

---

## 🔧 Common Tasks

### Find a Quiz
```
Dashboard → Search bar → Type name/topic
```

### Duplicate a Quiz
```
Quiz card → "Duplicate" → Edit → Save
```

### Delete a Quiz
```
Quiz card → "Delete" → Confirm
```

### Edit Questions
```
Dashboard → Select quiz → Edit in Setup Mode
```

### View Results
```
Dashboard → Past tab → Select quiz → View
```

---

## 🚨 Troubleshooting

### Can't Start Quiz
**Issue**: "Ready to Start" disabled  
**Fix**: Add at least one question with valid answers

### Quiz Not in Dashboard
**Issue**: Created quiz not visible  
**Fix**: Refresh page, check filters

### Can't Change Privacy
**Issue**: Privacy setting locked  
**Fix**: Privacy locked once live, create new quiz

### Participants Can't Join
**Issue**: Join errors  
**Fix**: Verify Game PIN, check quiz is live

### Dashboard Not Updating
**Issue**: Participant count not updating  
**Fix**: Check internet, refresh page

---

## 📖 API Quick Reference

### Get Organizer Quizzes
```bash
GET /api/events/organizer/:organizerId
```

### Update Quiz Status
```bash
PATCH /api/events/:eventId/status
Body: { "status": "live" }
```

### Update Quiz Visibility
```bash
PATCH /api/events/:eventId/visibility
Body: { "visibility": "public" }
```

### Create Template
```bash
POST /api/templates
Body: { "eventId": "...", "name": "...", "description": "..." }
```

### Get Public Quizzes
```bash
GET /api/events/public?status=live&search=math
```

---

## 📝 Best Practices

### Organization
✓ Use descriptive quiz names  
✓ Add topics for categorization  
✓ Regular cleanup of old quizzes  
✓ Build template library

### Templates
✓ Create templates for recurring quizzes  
✓ Use clear template names  
✓ Add detailed descriptions  
✓ Share quality templates publicly

### Privacy
✓ Default to private  
✓ Use public for community events  
✓ Add descriptions to public quizzes  
✓ Monitor public quiz participants

### Running Quizzes
✓ Preview before starting  
✓ Save drafts for later  
✓ Monitor answer progress  
✓ Use templates for efficiency

---

## 🔗 Quick Links

### Documentation
- [User Guide](ORGANIZER_UX_USER_GUIDE.md)
- [API Docs](ORGANIZER_UX_API_DOCUMENTATION.md)
- [Deployment](ORGANIZER_UX_DEPLOYMENT_GUIDE.md)
- [Migration](ORGANIZER_UX_MIGRATION_GUIDE.md)

### Support
- Email: support@your-domain.com
- GitHub: [issues]
- Forum: [forum-url]

---

## 📊 Status Transitions

```
Draft → Setup → Live → Completed
  ↓       ↓       ↓
 Edit   Start   End
```

**Valid Transitions**:
- Draft → Setup (edit)
- Setup → Live (start)
- Live → Completed (end)

**Invalid**: Cannot go backwards

---

## 🎯 Feature Checklist

### Dashboard
- [ ] View all quizzes
- [ ] Search by name/topic
- [ ] Filter by status
- [ ] Create new quiz
- [ ] Manage existing quizzes

### Setup Mode
- [ ] Add questions
- [ ] Reorder questions
- [ ] Preview questions
- [ ] Save as draft
- [ ] Set privacy
- [ ] Start quiz

### Live Mode
- [ ] View Game PIN
- [ ] Track participants
- [ ] Monitor answers
- [ ] Advance questions
- [ ] Show results
- [ ] End quiz

### Templates
- [ ] Save as template
- [ ] Create from template
- [ ] Browse templates
- [ ] Use public templates

### Privacy
- [ ] Set private/public
- [ ] View privacy indicator
- [ ] Understand restrictions

---

**Version**: 1.0  
**Last Updated**: November 28, 2025  
**Print this page for quick reference!**
