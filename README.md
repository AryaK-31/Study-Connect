# 🚀 StudyConnect

StudyConnect is a full-stack, containerized web application designed to help students discover peers, collaborate effectively, and organize structured study sessions.

Built with a modern **React + GraphQL + Docker architecture**, the platform focuses on scalability, real-time interaction, and reproducible environments — aligning closely with real-world engineering practices.

---

## ✨ Key Highlights

* 🔥 **Dockerized Full-Stack App** → Run entire project with a single command
* ⚡ **GraphQL API (Apollo Server)** → Efficient and flexible data querying
* ☁️ **MongoDB Atlas Integration** → Cloud-based scalable database
* 🔐 **Robust JWT Authentication** → Secure and stateless user sessions with validation
* 🎯 **Interest-Based Matching Algorithm** → Smart student discovery
* 🎨 **Modern UI** → Tailwind CSS + Framer Motion
* 🌓 **Dark & Light Theme** → Context API with `useMemo()` optimization
* 💬 **Real-time Chat** → WebSocket communication with connections
* ⚠️ **Robust Error Handling** → Graceful degradation when server stops
* 🔄 **Error Boundary** → Prevents entire app from crashing on errors

---

## 🎯 Extra Features Implemented

### 1. **Dark & Light Theme** 🌓
- **Implementation**: React Context API with `useMemo()` hook
- **Storage**: Theme preference saved in localStorage
- **System Preference**: Auto-detects system dark/light mode on first visit
- **Toggle**: Easy theme switcher in navbar (available on desktop & mobile)
- **Performance**: Uses `useMemo()` to prevent unnecessary re-renders of theme value
- **Coverage**: All UI components support both themes seamlessly

### 2. **Chat with Connections** 💬
- Send direct messages to connected peers
- Real-time message delivery via WebSockets
- Message history maintained in database
- Connection requests system before chatting
- Unread message counter in navbar badge

### 3. **Robust Error Handling** ⚠️
- **Server Failures**: App doesn't crash if backend stops
- **Error Boundary**: React component catches rendering errors
- **Apollo Error Link**: Intercepts GraphQL errors with user-friendly messages
- **Socket Error Handling**: Graceful degradation for real-time connection failures
- **Global Error Toast**: Displays errors at top of screen without interrupting user
- **Network Detection**: Specific messages for offline/network issues
- **Auto-reconnection**: Socket reconnects with exponential backoff

### 4. **Authentication & Security** 🔐
- JWT-based stateless authentication
- Password hashing and validation
- Protected routes (unauthorized users redirected to login)
- Session persistence via localStorage
- Secure token injection in Apollo headers

---

## 🏗️ Application Flow & Architecture

### User Journey
```
Unauthenticated User
  ↓
Login/Signup Page
  ↓
Profile Setup (Interests, Availability)
  ↓
Dashboard
  ├─ Similar Students Section
  │  ├─ Browse students with similar interests
  │  ├─ Send connection requests
  │  └─ View/Send messages
  ├─ Study Sessions Section
  │  ├─ Create new sessions
  │  ├─ Join existing sessions
  │  └─ View session participants
  └─ Messages Page
     ├─ Chat with connections
     ├─ Real-time message updates
     └─ Connection management
```

### Technical Architecture
```
Frontend Layer (React + Apollo + WebSockets)
        ↓
GraphQL API Layer (Apollo Server + Express)
        ↓
Database Layer (MongoDB)
        ↓
Real-time Layer (Socket.io)
```

### Component Hierarchy
```
App (Error Boundary)
  ├─ ThemeProvider (Context + useMemo)
  ├─ ErrorProvider (Error Context)
  ├─ ApolloProvider (GraphQL)
  └─ Router
      ├─ MainApp (Main Logic)
      │  ├─ Navbar (Theme Toggle)
      │  ├─ Login
      │  ├─ Signup
      │  ├─ ProfileSetup
      │  ├─ Dashboard
      │  │  ├─ Similar Students
      │  │  ├─ Study Sessions
      │  │  ├─ Session Modal
      │  │  └─ Error Toast
      │  └─ Messages
      └─ Error Boundary (Fallback UI)
```

---

## 🐳 One Command Setup (Recommended)

### Prerequisites

* Docker
* Docker Compose

### Run the app

```bash
docker compose up --build
```

### Access the app

* Frontend → http://localhost:5173
* Backend (GraphQL) → http://localhost:5000/graphql

---

## ⚙️ Environment Configuration

Create a file:

```bash
backend/.env
```

Example:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studyconnect
JWT_SECRET=your_super_secret_key
PORT=5000
```

Create a file for frontend:

```bash
frontend/.env.local
```

Example:

```env
VITE_API_URL=http://localhost:5000/graphql
VITE_SOCKET_URL=http://localhost:5000
```

> ⚠️ `.env` files are not committed for security reasons.

---

## 🧪 Sample Data (Optional)

Use provided dataset:

```bash
mongoimport --db studyconnect --collection users --file database/users.json --jsonArray
mongoimport --db studyconnect --collection sessions --file database/sessions.json --jsonArray
```

---

## 🛠️ Tech Stack

### Frontend

* **React** - UI framework
* **Apollo Client** - GraphQL client
* **React Router** - Client-side routing
* **Tailwind CSS** - Styling
* **Framer Motion** - Animations
* **Socket.io-client** - Real-time communication
* **Lucide React** - Icons
* **Context API** - State management (Theme & Error)

### Backend

* **Node.js** - Runtime
* **Express** - Web framework
* **Apollo Server** - GraphQL server
* **Mongoose** - MongoDB ODM
* **Socket.io** - WebSocket server
* **JWT** - Authentication

### Database

* **MongoDB Atlas** - Cloud database
* **MongoDB** - Local via Docker

### DevOps & Tooling

* **Docker & Docker Compose** - Containerization
* **Nginx** - Reverse proxy (included in docker-compose)
* **Environment-based configuration** - Config management

---

## 🧠 Core Engineering Concepts Demonstrated

* ✅ Containerized microservices architecture
* ✅ Service-to-service communication (Docker networking)
* ✅ Environment-based configuration management
* ✅ GraphQL schema design & resolver optimization
* ✅ JWT-based secure authentication
* ✅ Full-stack integration with API abstraction
* ✅ React Context API for global state
* ✅ Performance optimization with `useMemo()` hook
* ✅ Error boundaries and error handling patterns
* ✅ Real-time communication with WebSockets
* ✅ Graceful degradation and resilience

---

## ⚡ Features

### 👥 User System

* Signup/Login with JWT auth
* Email-based authentication
* Password validation & hashing
* Profile customization (interests, availability, contact number)

### 🔍 Smart Matching

* Find students with similar interests
* Case-insensitive matching logic
* Interest-based ranking

### 📅 Study Sessions

* Create & join study sessions
* Real-time participant tracking
* Session creator can delete sessions
* Join/leave functionality

### 💬 Real-time Communication

* Send/receive messages via WebSockets
* Connection requests before messaging
* Unread message counter
* Message history persistence

### 🌓 Theme System

* Dark mode & Light mode support
- Easy toggle in navbar
* Auto-detect system preference
* Persistent theme preference (localStorage)
* Performance optimized with `useMemo()`

### 🛡️ Error Handling

* **Error Boundary**: Catches React errors
* **Apollo Error Link**: Handles GraphQL errors gracefully
* **Socket Error Handling**: Manages WebSocket failures
* **User-friendly Messages**: Clear error notifications
* **Graceful Degradation**: App continues working with limited functionality

---

## 📁 Project Structure

```
.
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── graphql/
│   │   ├── schema.js
│   │   └── resolvers.js
│   ├── models/
│   │   └── index.js
│   └── utils/
│       └── passwordValidator.js
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Signup.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── ResetPassword.jsx
│       │   ├── Messages.jsx
│       │   ├── ConnectionRequests.jsx
│       │   └── ErrorBoundary.jsx
│       ├── context/
│       │   ├── ThemeContext.jsx
│       │   └── ErrorContext.jsx
│       ├── hooks/
│       │   ├── useTheme.js
│       │   └── useError.js
│       └── lib/
│           ├── apollo.js (with error handling)
│           ├── socket.js (with error handling)
│           └── utils.js
├── database/
│   ├── users.json
│   └── sessions.json
├── nginx/
│   └── (nginx config)
├── docker-compose.yml
└── README.md
```

---

## 🚧 Development Mode (Without Docker)

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Implementation Details

### Theme System with useMemo()

The theme system uses React Context API combined with `useMemo()` for performance optimization:

```javascript
const themeValue = useMemo(() => ({
  isDark,
  toggleTheme,
}), [isDark, toggleTheme]);
```

**Why useMemo()?**
- Prevents unnecessary re-renders of child components
- Memoizes theme object reference for stable context value
- Only recalculates when dependencies change

### Error Handling Architecture

**Three layers of error handling:**

1. **Apollo Client Level** - Intercepts GraphQL errors
2. **Socket.io Level** - Handles real-time connection failures
3. **React Level** - Error Boundary catches rendering errors

All errors dispatch custom window events that trigger global error toast notifications.

### Database Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  interests: [String],
  availability: [String],
  contactNumber: String,
  profileUpdated: Boolean,
  createdAt: Date
}
```

#### Sessions Collection
```javascript
{
  _id: ObjectId,
  title: String,
  topic: String,
  time: Date,
  creator: ObjectId (ref: User),
  attendees: [ObjectId] (ref: User),
  createdAt: Date
}
```

#### Messages Collection
```javascript
{
  _id: ObjectId,
  sender: ObjectId (ref: User),
  recipient: ObjectId (ref: User),
  content: String,
  createdAt: Date
}
```

---

## ⚠️ Common Issues

### ❌ Theme not persisting
- Check localStorage is enabled in browser
- Clear browser cache and reload
- Inspect Application → LocalStorage in DevTools

### ❌ `ERR_NAME_NOT_RESOLVED`
Make sure frontend environment variables are correct:
```env
VITE_API_URL=http://localhost:5000/graphql
VITE_SOCKET_URL=http://localhost:5000
```

### ❌ MongoDB not connecting
Check:
- Atlas IP whitelist includes `0.0.0.0/0` (dev) or your IP (production)
- Correct username/password in `.env`
- Network connectivity

### ❌ Messages not appearing
- Verify Socket.io connection in browser DevTools
- Check server logs for socket connection issues
- Ensure both users have established WebSocket connection

### ❌ Error toasts appearing repeatedly
- Check server logs for actual errors
- Review Apollo network requests in DevTools
- Verify GraphQL resolver implementations

---

## 🚀 Future Improvements

* CI/CD pipeline (GitHub Actions)
* Kubernetes deployment
* Advanced recommendation engine (ML-based)
* Video call integration
* Session scheduling with calendar sync
* User ratings and reviews
* Search functionality

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially error scenarios)
5. Submit a Pull Request

---

## 📄 License

This project is open source and available for educational purposes.
3. Commit changes
4. Open PR

---

## 📌 Final Note

This project goes beyond a typical CRUD app by integrating:

* Full-stack architecture
* Cloud database
* Containerization
* Scalable API design

👉 Making it a strong foundation for **Data Engineering + DevOps-oriented roles**.

---

*Built for real-world learning, not just assignments.*
