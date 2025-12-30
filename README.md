Event Management System
A full-stack event management platform built with React and Node.js that enables users to create, manage, and RSVP to events with real-time capacity tracking and AI-powered features.
Features
Core Functionality

User Authentication: Secure registration and login system using JWT tokens
Event Management: Create, edit, and delete events with image uploads
Smart Search: Advanced filtering by title, category, and date
AI Integration: Auto-generate compelling event descriptions using Claude API
RSVP System: Join and leave events with strict capacity enforcement
Personal Dashboard: Track events you've created and ones you're attending
Responsive Design: Seamless experience across desktop, tablet, and mobile devices

Technical Highlights

Real-time capacity tracking with race condition prevention
Database transactions for concurrent booking protection
RESTful API architecture
Token-based authentication
File upload handling for event images

Technology Stack
Backend

Runtime: Node.js with Express.js
Database: MongoDB with Mongoose ODM
Authentication: JWT (JSON Web Tokens)
File Uploads: Multer middleware
AI Service: Anthropic Claude API
Security: bcryptjs for password hashing

Frontend

Framework: React 18
Build Tool: Vite
Routing: React Router v6
HTTP Client: Axios
State Management: React Context API
Styling: Custom CSS with responsive design

Prerequisites
Before running this application, make sure you have:

Node.js (version 16 or higher)
MongoDB (version 5 or higher)
npm or yarn package manager
A modern web browser

Installation Guide
Step 1: Clone the Repository
bashgit clone <your-repository-url>
cd event-management-system
Step 2: Backend Configuration
Navigate to the backend directory and install dependencies:
bashcd backend
npm install
Create a .env file in the backend directory with the following variables:
envPORT=5000
MONGODB_URI=mongodb://localhost:27017/event-management
JWT_SECRET=your_very_secure_secret_key_minimum_32_characters
ANTHROPIC_API_KEY=your_anthropic_api_key_here
Important: Replace the values with your actual credentials:

JWT_SECRET: Use a long, random string (at least 32 characters)
ANTHROPIC_API_KEY: Get your API key from Anthropic Console

Create the uploads directory for event images:
bashmkdir uploads
Step 3: Start MongoDB
Make sure MongoDB is running on your system:
macOS (with Homebrew):
bashbrew services start mongodb-community
Ubuntu/Linux:
bashsudo systemctl start mongod
Windows:
bashnet start MongoDB
Or run MongoDB directly:
bashmongod
Verify MongoDB is running by connecting to it:
bashmongosh
# or
mongo
Step 4: Start the Backend Server
From the backend directory:
bashnpm run dev
```

You should see output similar to:
```
✅ Environment variables loaded
MongoDB Connected: localhost
Database: event-management
✅ Server running on http://localhost:5000
Step 5: Frontend Configuration
Open a new terminal window and navigate to the frontend directory:
bashcd frontend
npm install
Start the development server:
bashnpm run dev
```

The frontend will be available at `http://localhost:5173`

## Running the Application

1. Ensure both backend (port 5000) and frontend (port 5173) servers are running
2. Open your browser and navigate to `http://localhost:5173`
3. Create a new account using the signup form
4. Start creating and managing events!

## Usage Guide

### Getting Started
1. **Sign Up**: Create a new account with your name, email, and password
2. **Browse Events**: View all upcoming events on the home page
3. **Search & Filter**: Use the search bar to find events by title, category, or date

### Creating Events
1. Click the "Create Event" button in the navigation bar
2. Fill in the event details:
   - Title
   - Description (or use AI to generate one)
   - Date and time
   - Location
   - Maximum capacity
   - Category
   - Upload an event image
3. Click "Create Event" to publish

### Managing Your Events
1. Navigate to your dashboard
2. View events you've created under "My Events"
3. Edit or delete your events as needed

### RSVPing to Events
1. Click on any event to view details
2. Click "RSVP Now" to register (if spots are available)
3. View your RSVPs in the dashboard under "Attending"
4. Cancel your RSVP anytime before the event

## Technical Deep Dive: Solving the RSVP Concurrency Challenge

### The Problem

In a multi-user environment, race conditions can occur when multiple users attempt to RSVP for the last available spot simultaneously. Without proper handling:

**Scenario:**
```
Time T1: User A checks → 1 spot available
Time T2: User B checks → 1 spot available  
Time T3: User A creates RSVP → attendeeCount = 1
Time T4: User B creates RSVP → attendeeCount = 2
Result: Overbooking! 2 people registered for 1 spot
Our Solution: MongoDB Transactions
We implemented ACID-compliant transactions to ensure atomic operations and prevent race conditions.
Implementation:
javascriptconst session = await mongoose.startSession();
session.startTransaction();

try {
  // Step 1: Check for duplicate RSVP
  const existing = await RSVP.findOne({
    event: eventId,
    user: req.userId,
    status: 'confirmed'
  }).session(session);

  if (existing) {
    await session.abortTransaction();
    return res.status(400).json({ error: 'Already registered' });
  }

  // Step 2: Fetch event within transaction (with lock)
  const event = await Event.findById(eventId).session(session);

  if (!event) {
    await session.abortTransaction();
    return res.status(404).json({ error: 'Event not found' });
  }

  // Step 3: Atomic capacity check
  if (event.attendeeCount >= event.capacity) {
    await session.abortTransaction();
    return res.status(400).json({ error: 'Event is full' });
  }

  // Step 4: Create RSVP
  const rsvp = new RSVP({
    event: eventId,
    user: req.userId,
    status: 'confirmed'
  });
  await rsvp.save({ session });

  // Step 5: Increment counter
  event.attendeeCount += 1;
  await event.save({ session });

  // Step 6: Commit everything atomically
  await session.commitTransaction();

  res.status(201).json({ message: 'RSVP successful', rsvp });
} catch (err) {
  // Rollback on any error
  await session.abortTransaction();
  
  if (err.code === 11000) {
    return res.status(400).json({ error: 'Already registered' });
  }
  
  res.status(500).json({ error: err.message });
} finally {
  session.endSession();
}
Why This Works
1. Atomicity

All database operations (check, create, update) happen as a single unit
Either all operations succeed, or none do

2. Isolation

Other transactions cannot see intermediate states
Each transaction operates on a consistent snapshot of the data

3. Consistency

Database constraints are enforced within the transaction
No partial updates can occur

4. Durability

Once committed, changes are permanent
Rollback capability ensures no corruption on failure

Additional Safeguards
Database-Level Protection:
javascript// Compound unique index in RSVP model
rsvpSchema.index({ event: 1, user: 1 }, { unique: true });
This prevents duplicate RSVPs even if application logic fails.
Status Field:
javascriptstatus: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
Allows users to cancel and re-register without violating unique constraints.
Error Handling:

Graceful handling of duplicate key errors (code 11000)
User-friendly error messages
Proper session cleanup in finally block

Performance Considerations

Transactions add minimal overhead for this use case
MongoDB transactions are optimized for single-document operations
Session cleanup prevents memory leaks
Proper indexing ensures fast lookups

API Documentation
Authentication Endpoints
Register User
httpPOST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
Response:
json{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
Login User
httpPOST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
Event Endpoints
Get All Events
httpGET /api/events?search=tech&category=Technology&startDate=2025-01-01
Query Parameters:

search: Search by title or description
category: Filter by category
startDate: Filter events from this date
endDate: Filter events until this date

Get Single Event
httpGET /api/events/:id
Create Event
httpPOST /api/events
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "Tech Conference 2025",
  "description": "Annual technology conference",
  "date": "2025-02-15T10:00:00Z",
  "location": "San Francisco, CA",
  "capacity": 500,
  "category": "Technology",
  "image": <file>
}
Update Event
httpPUT /api/events/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data
Delete Event
httpDELETE /api/events/:id
Authorization: Bearer <token>
Generate AI Description
httpPOST /api/events/generate-description
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Tech Conference 2025",
  "context": "Annual gathering of tech leaders"
}
RSVP Endpoints
Create RSVP
httpPOST /api/rsvp/:eventId
Authorization: Bearer <token>
Cancel RSVP
httpDELETE /api/rsvp/:eventId
Authorization: Bearer <token>
Get My RSVPs
httpGET /api/rsvp/my-rsvps
Authorization: Bearer <token>
Get My Created Events
httpGET /api/rsvp/my-events
Authorization: Bearer <token>
Check RSVP Status
httpGET /api/rsvp/check/:eventId
Authorization: Bearer <token>
```

## Troubleshooting

### Common Issues

**1. MongoDB Connection Failed**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
Solution: Make sure MongoDB is running
bash# Check MongoDB status
brew services list  # macOS
sudo systemctl status mongod  # Linux

# Start MongoDB if not running
brew services start mongodb-community  # macOS
sudo systemctl start mongod  # Linux
```

**2. JWT Secret Not Found**
```
Error: secretOrPrivateKey must have a value
```
**Solution**: Check your `.env` file exists in the backend folder and contains `JWT_SECRET`

**3. Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::5000
Solution: Kill the process using that port
bash# Find the process
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>
```

**4. CORS Errors**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Verify backend CORS configuration includes your frontend URL

**5. Image Upload Fails**
```
Error: ENOENT: no such file or directory, open 'uploads/...'
Solution: Create the uploads directory in backend folder
bashmkdir backend/uploads
Debug Mode
Enable detailed logging by setting in backend .env:
envNODE_ENV=development
Security Considerations

Passwords are hashed using bcryptjs with salt rounds
JWT tokens expire after 7 days
Authentication required for protected routes
Input validation on all forms
File upload restrictions (size and type)
CORS configured for specific origins
Database queries use parameterized statements

Future Enhancements

Email notifications for event reminders
Payment integration for paid events
Event categories with custom icons
User profiles with avatars
Event ratings and reviews
Social sharing features
Calendar integration (Google Calendar, iCal)
Real-time updates using WebSockets
Event recommendations based on user preferences
Analytics dashboard for event creators


Built with using React, Node.js, and MongoDBClaude is AI and can make mistakes. 
