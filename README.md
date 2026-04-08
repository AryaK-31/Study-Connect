# StudyConnect

StudyConnect is a comprehensive full-stack web application that revolutionizes the way students connect and collaborate on academic pursuits. Built to foster meaningful study partnerships, StudyConnect enables students to discover peers with similar interests, organize study sessions, and build a supportive learning community through intelligent matching algorithms and real-time collaboration tools.

## 🚀 Features

### Core Functionality
- **Intelligent User Matching**: Advanced algorithm-based discovery of study partners based on academic interests, subjects, and availability
- **Dynamic Study Sessions**: Create and manage collaborative study sessions with real-time attendee tracking and capacity management
- **Secure Authentication**: Robust JWT-based authentication system ensuring user data privacy and security

### User Experience
- **Personalized Profiles**: Comprehensive profile setup allowing users to specify interests, subjects, study preferences, and availability schedules
- **Connection Management**: Send and receive connection requests to build your academic network
- **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS and enhanced with smooth animations via Framer Motion

### Communication & Collaboration
- **Email Integration**: Simulated email system for connection requests and session invitations
- **Real-time Updates**: Live tracking of session participants and availability
- **Interactive Dashboard**: Centralized hub for managing sessions, connections, and profile settings


## 🏗️ Project Structure

```
.
├── backend/
│   ├── graphql/
│   │   ├── resolvers.js    # GraphQL Resolvers
│   │   └── schema.js       # GraphQL Type Definitions
│   ├── models/
│   │   └── index.js        # Mongoose Models (User, Session)
│   └── server.js           # Express & Apollo Server entry point
├── database/
│   ├── users.json          # Sample user data export
│   ├── sessions.json       # Sample session data export
│   └── README.md           # Database import instructions
├── frontend/
│   └── src/
│       ├── components/
│       │   └── Signup.jsx  # Signup component
│       ├── lib/
│       │   ├── apollo.js   # Apollo Client configuration
│       │   └── utils.js    # Utility functions (cn)
│       ├── App.jsx         # Main React Application
│       ├── main.jsx        # React Entry Point
│       └── index.css       # Global Styles
├── package.json            # Project dependencies and scripts
├── vite.config.js          # Vite configuration
└── .env                    # Environment variables
```

##  Database Export

The `database/` folder contains sample data exports for testing and demonstration:

- **users.json**: 4 sample user accounts with completed profiles
- **sessions.json**: 3 sample study sessions with attendees
- **README.md**: Detailed instructions for importing/exporting data

Use these files to quickly populate your database with test data or as examples for your own exports.

## Tech Stack

### Frontend
- **React**: Component-based UI framework for building interactive interfaces
- **Apollo Client**: GraphQL client for efficient data fetching and state management
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Framer Motion**: Animation library for smooth, professional transitions
- **Lucide Icons**: Modern icon library for consistent visual elements

### Backend
- **Node.js**: JavaScript runtime for server-side development
- **Express**: Web application framework for building RESTful APIs
- **Apollo Server**: GraphQL server implementation for flexible API design
- **Mongoose**: MongoDB object modeling for Node.js
- **MongoDB**: NoSQL database for scalable data storage

### Security & Authentication
- **JWT (JSON Web Tokens)**: Stateless authentication mechanism
- **bcryptjs**: Password hashing for secure credential storage

## 🎯 Challenges & Solutions

Developing StudyConnect presented several technical challenges that were overcome through careful planning and implementation:

**GraphQL Schema Design**: Creating an efficient schema that supports complex queries for user matching and session management required careful consideration of relationships and resolvers. The solution involved implementing proper population of referenced documents and optimizing query performance.

**Real-time State Management**: Coordinating state between the React frontend and GraphQL backend while maintaining data consistency across components demanded robust Apollo Client integration. This was solved by implementing proper cache management and refetching strategies.

**Interest-Based Matching Algorithm**: Developing an intelligent matching system that finds students with similar interests involved implementing case-insensitive string matching and array intersection logic in MongoDB queries, ensuring accurate and performant user discovery.

**Responsive UI/UX Design**: Creating a mobile-first interface that works seamlessly across devices while maintaining professional aesthetics required extensive use of Tailwind CSS utilities and Framer Motion animations. The challenge of managing complex component states was addressed through React hooks and proper state lifting.

**Email Integration**: Implementing a reliable notification system for connection requests and session updates involved configuring nodemailer with proper error handling and fallback mechanisms for development environments.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas cloud service)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd studyconnectuts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_own_mongodb_atlas_connection_string
   JWT_SECRET=your_super_secret_key_here
   EMAIL_USER=your_smtp_user (optional)
   EMAIL_PASS=your_smtp_pass (optional)
   ```

4. **Database Setup**
   
   Ensure MongoDB is running locally or configure your Atlas connection string in the `.env` file.
   
   **Optional: Import Sample Data**
   ```bash
   # Import sample users and sessions
   mongoimport --db studyconnect --collection users --file database/users.json --jsonArray
   mongoimport --db studyconnect --collection sessions --file database/sessions.json --jsonArray
   ```
   
   See `database/README.md` for detailed import instructions.

## Important Notes:
Login Credentials: All these mock users have the password: password123.
UI Visibility: Once imported, these students will appear in the "Students with Similar Interests" section on the dashboard when you log in with your own account.
Emails: These are @uts.edu.au mock emails for a professional look.

### Running the Application

#### Development Mode
```bash
npm run dev
```
This command starts both the backend GraphQL server and the Vite development server concurrently.

#### Production Build
```bash
npm run build
npm start
```
Builds the optimized frontend and starts the production server.

## 📖 Usage

1. **Sign Up**: Create your account with email and password
2. **Complete Profile**: Set your academic interests, subjects, and availability
3. **Discover Partners**: Browse and connect with students sharing your interests
4. **Create Sessions**: Organize study sessions with specific topics and time slots
5. **Join Sessions**: Participate in existing sessions and collaborate in real-time

## 🤝 Contributing

We welcome contributions to StudyConnect! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and structure
- Write clear, concise commit messages
- Test your changes thoroughly
- Update documentation as needed


## 📞 Contact

For questions, suggestions, or support, please open an issue on GitHub or contact the Repository owner.
---

*Built with ❤️ for students, by students*
