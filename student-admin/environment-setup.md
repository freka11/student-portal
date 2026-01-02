# Environment Configuration

## Production Setup

1. Create a `.env.local` file in the root directory with the following:

```env
NEXT_PUBLIC_API_URL=https://your-production-api-domain.com/api
```

2. For development, create a `.env.local` file with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## API Endpoints Required

Your backend API should implement the following endpoints:

### Dashboard
- `GET /api/dashboard/stats` - Returns dashboard statistics

### Thoughts
- `GET /api/thoughts` - Get all thoughts
- `POST /api/thoughts` - Create a new thought
- `PUT /api/thoughts/:id` - Update a thought
- `DELETE /api/thoughts/:id` - Delete a thought

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Create a new question
- `PUT /api/questions/:id` - Update a question
- `DELETE /api/questions/:id` - Delete a question

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id/messages` - Get messages for a student
- `POST /api/students/:id/messages` - Send a message to a student

## Data Models

### Thought
```typescript
{
  id: string
  content: string
  createdAt: string
  updatedAt: string
}
```

### Question
```typescript
{
  id: string
  content: string
  status: 'published' | 'draft'
  createdAt: string
  updatedAt: string
}
```

### Student
```typescript
{
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  isOnline: boolean
}
```

### Message
```typescript
{
  id: string
  content: string
  timestamp: string
  isSent: boolean
}
```

### Dashboard Stats
```typescript
{
  totalStudents: number
  activeChats: number
  thoughtsPosted: number
  questionsAsked: number
}
```
