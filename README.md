# 🌐 Social Media Platform — Graduation Project

> A modern social media platform built with **Spring Boot**, **Angular**, **PostgreSQL**, and **Keycloak**, supporting
> real-time messaging and notifications, content moderation via **Ollama**, and fine-grained privacy controls.

---

## 📖 Table of Contents

- [🌐 Social Media Platform — Graduation Project](#-social-media-platform--graduation-project)
  - [📖 Table of Contents](#-table-of-contents)
  - [🚀 Overview](#-overview)
  - [💡 Key Features](#-key-features)
  - [🏗️ System Architecture](#️-system-architecture)
  - [🧰 Technology Stack](#-technology-stack)
  - [🗂️ Backend Structure](#️-backend-structure)
  - [💻 Frontend Structure](#-frontend-structure)
  - [🗃️ Data Management](#️-data-management)
    - [Example Tables](#example-tables)
  - [🔐 Authentication and Authorization](#-authentication-and-authorization)
  - [🧪 Testing and Evaluation](#-testing-and-evaluation)
  - [🕓 Time Handling](#-time-handling)
  - [⚙️ Setup Instructions](#️-setup-instructions)
    - [Backend](#backend)
    - [Frontend](#frontend)
  - [🧭 Future Enhancements](#-future-enhancements)
  - [👥 Contributors](#-contributors)

---

## 🚀 Overview

This project represents our **final year graduation project** — a full-featured social media platform that enables users
to share posts, interact through comments and likes, exchange private messages, and receive live notifications.
The system prioritizes scalability and clean architecture.
It integrates **Ollama** for AI-based content moderation and uses **Keycloak** for secure, centralized identity and
access management.

---

## 💡 Key Features

- 🧑‍🤝‍🧑 **User Management**: Registration, login, verification, and profile customization.
- 📝 **Statuses**: Create posts with text, images, or videos; share and reply features.
- 🔔 **Notifications**: Real-time event notifications using WebSocket.
- 💬 **Messaging**: Private chats with online/offline status and typing indicators.
- 👁️ **Privacy Controls**: Users can customize who can message or add them to groups.
- 🧠 **AI Moderation**: Integrates **Ollama** for automatic filtering of harmful or inappropriate content.
- 🕓 **Timezone-Aware UI**: Displays timestamps in the user’s local timezone.
- 🧩 **Event-Driven Design**: Spring’s `ApplicationEventPublisher` used for async notifications and background tasks.

---

## 🏗️ System Architecture

The system follows a **modular, layered architecture** divided into four main modules:

| Module            | Description                                                          |
| :---------------- | :------------------------------------------------------------------- |
| **Users**         | Manages user accounts, profiles, preferences, and relationships.     |
| **Statuses**      | Handles posts (text, image, video), reactions, and visibility rules. |
| **Messages**      | Provides private and group chat functionality using WebSockets.      |
| **Notifications** | Handles system and user notifications, delivered in real-time.       |

The backend communicates with the frontend via **REST APIs** and **WebSocket channels** for live updates.

---

## 🧰 Technology Stack

| Layer              | Technologies                                                    |
| :----------------- | :-------------------------------------------------------------- |
| **Frontend**       | Angular 19, TypeScript, RxJS, SCSS, Luxon                       |
| **Backend**        | Spring Boot 3.4.x, Spring Security, JOOQ, Redis, WebSocket      |
| **Authentication** | Keycloak                                                        |
| **Database**       | PostgreSQL, Flyway (for migration) Testcontainers (for testing) |
| **AI Integration** | Ollama (for content moderation)                                 |
| **Build Tools**    | Maven, npm                                                      |
| **Testing**        | JUnit 5, Mockito, MockMvc, Gatling, Jasmine/Karma               |

---

## 🗂️ Backend Structure

```
backend/
 ├── src/main/java/com/app/
 │   ├── common/                # Shared utilities, constants, DTOs, helpers
 │   ├── config/                # Spring Boot configuration (CORS, WebSocket, Redis, Keycloak, etc.)
 │   ├── controller/            # REST controllers (API endpoints)
 │   ├── service/               # Business logic layer (uses repositories and event publisher)
 │   ├── repository/            # JOOQ-based repositories for data access
 │   ├── model/                 # Entity models, records, and DTOs
 │   ├── exception/             # Global exception handlers and custom exception classes
 │
 ├── src/main/resources/
 │   ├── application.properties # Main configuration
 │   ├── db/migration/          # Flyway SQL migration scripts
 │   ├── prompts/               # Ollama prompts for content moderation
 │   ├── data.sql               # Seed data for testing
 │
 ├── src/test/java/...          # Unit, integration, and performance tests
 └── uploads/                   # Directory for user-uploaded media files

```

---

## 💻 Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/         # Feature UI (bookmarks, chat, feed, notifications, profile, dialogs)
│   │   ├── core/               # Pipes, constants, guards, services, models
│   │   ├── config/             # App-level configuration (e.g., route enums)
│   │   ├── interceptors/       # HTTP interceptors (auth, etc.)
│   │   └── features/           # Feature modules (e.g., auth: login/signup, models, services)
│   │
│   ├── assets/                 # Static assets (images, icons)
│   ├── environments/           # Environment configs (e.g., environment.ts)
│   ├── index.html              # Root HTML
│   ├── main.ts                 # App bootstrap
│   ├── styles.css              # Global styles
│   └── proxy.conf.json         # Dev API proxy

```

---

## 🗃️ Data Management

All persistent entities are stored in **PostgreSQL**.
We use **JOOQ** to generate type-safe queries and leverage **Redis** for caching frequently accessed data (e.g., session
tokens, notification states).

### Example Tables

- `users`: Stores user details and metadata
- `user_preferences`: Defines privacy and messaging rules
- `statuses`: User posts
- `status_media`: Media (images/videos) linked to statuses
- `messages`: Chat messages
- `notifications`: System and user-triggered notifications

---

## 🔐 Authentication and Authorization

User identity and roles are managed by **Keycloak**, integrated via **OpenID Connect**.
Access tokens (JWTs) include custom claims such as `timezone_id`, enabling personalized frontend experiences.
Backend services enforce access rules using Spring Security with `@PreAuthorize` expressions.

---

## 🧪 Testing and Evaluation

The testing process is divided into three main layers:

| Type                    | Tools                          | Purpose                                                           |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------- |
| **Unit Testing**        | JUnit 5, Mockito               | Validate service logic, validators, and utilities.                |
| **Integration Testing** | Spring MockMvc, Testcontainers | Test endpoint behavior with real PostgreSQL and Redis containers. |
| **Performance Testing** | Gatling                        | Evaluate scalability and response times under load.               |

The frontend is tested with **Karma + Jasmine** for unit and component testing.

All integration tests automatically load seed SQL data from the `resources` folder using `@Sql`.

---

## 🕓 Time Handling

All timestamps are stored as **`Instant` (UTC)** in the backend.
When data reaches the frontend, the **Luxon** library converts these UTC timestamps into the user’s local time zone,
based on their `timezone_id` claim stored in the JWT.
This ensures that time displays (e.g., “Posted 5 minutes ago”) remain accurate for users in any region.

---

## ⚙️ Setup Instructions

### Backend

```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🧭 Future Enhancements

- Group and community features.
- Advanced similarity search.
- Customizing notifications delivery time.
- Content reporting.
- Recommendation system using simple ML models.

---

## 👥 Contributors

| Name                 | Main role          | Module                     |
|----------------------| ------------------ |----------------------------|
| **Mohammad Ballour** | Backend Developer  | Users, Statuses & Chatting |
| **Mohammad Shukur**  | Frontend Developer | Angular UI & Integration   |
| **Ahmed Akilan**     | Backend Developer | Notifications              |
| **Baraa Shaat**      | Frontend Developer | Statuses & Documentation   |
