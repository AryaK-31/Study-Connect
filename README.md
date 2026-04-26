# 🚀 StudyConnect

StudyConnect is a full-stack, containerized web application designed to help students discover peers, collaborate effectively, and organize structured study sessions.

Built with a modern **React + GraphQL + Docker architecture**, the platform focuses on scalability, real-time interaction, and reproducible environments — aligning closely with real-world engineering practices.

---

## ✨ Key Highlights

* 🔥 **Dockerized Full-Stack App** → Run entire project with a single command
* ⚡ **GraphQL API (Apollo Server)** → Efficient and flexible data querying
* ☁️ **MongoDB Atlas Integration** → Cloud-based scalable database
* 🔐 **JWT Authentication** → Secure and stateless user sessions
* 🎯 **Interest-Based Matching Algorithm** → Smart student discovery
* 🎨 **Modern UI** → Tailwind CSS + Framer Motion

---

## 🏗️ Architecture Overview

```text
Frontend (React + Apollo Client)
        ↓
GraphQL API (Apollo Server + Express)
        ↓
MongoDB (Atlas / Local via Docker)
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

> ⚠️ `.env` is not committed for security reasons. Use `.env.example` as reference.

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

* React
* Apollo Client
* Tailwind CSS
* Framer Motion

### Backend

* Node.js
* Express
* Apollo Server (GraphQL)
* Mongoose

### Database

* MongoDB Atlas (Cloud)
* MongoDB (Local via Docker)

### DevOps & Tooling

* Docker & Docker Compose
* Environment-based configuration
* Container networking

---

## 🧠 Core Engineering Concepts Demonstrated

* Containerized application architecture
* Service-to-service communication (Docker networking)
* Environment-based configuration management
* GraphQL schema design & resolver optimization
* Secure authentication using JWT
* Full-stack integration with API abstraction

---

## ⚡ Features

### 👥 User System

* Signup/Login with JWT auth
* Profile customization (subjects, interests, availability)

### 🔍 Smart Matching

* Find students with similar interests
* Case-insensitive matching logic

### 📅 Study Sessions

* Create & join sessions
* Real-time participant tracking

### 📬 Communication

* Email-based notifications (simulated)
* Connection requests system

---

## 📁 Project Structure

```
.
├── backend/
├── frontend/
├── database/
├── docker-compose.yml
├── README.md
```

---

## 🚧 Development Mode (Without Docker)

```bash
npm install
npm run dev
```

---

## ⚠️ Common Issues

### ❌ `ERR_NAME_NOT_RESOLVED`

Make sure frontend uses:

```env
VITE_API_URL=http://localhost:5000/graphql
```

### ❌ MongoDB not connecting

Check:

* Atlas IP whitelist (`0.0.0.0/0` for dev)
* Correct credentials in `.env`

---

## 🚀 Future Improvements

* CI/CD pipeline (GitHub Actions)
* Kubernetes deployment
* Real-time chat (WebSockets)
* Recommendation engine (ML-based)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
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
