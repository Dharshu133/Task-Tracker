# Task Tracker

A full-stack project management and task tracking application built with modern technologies. It features Role-Based Access Control (RBAC), organization-level isolation, and a dynamic Kanban board.

## 🚀 Features

- **Role-Based Access Control (RBAC)**: Distinct permissions for `ADMIN` and `MEMBER` roles.
- **Project Isolation**: Members can only see and manage tasks within their specifically assigned project.
- **Kanban Board**: Drag-and-drop style task management (Open, In Progress, Closed).
- **Dashboard**: High-level statistical overview of project progress and task distribution.
- **Organization Support**: Data is isolated at the organization level.
- **Responsive Design**: Premium dark-mode UI built with Tailwind CSS.

## 🛠 Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS.
- **Backend**: Next.js Route Handlers.
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/).
- **Authentication**: JWT-based stateless authentication.
- **Containerization**: Docker & Docker Compose.

## 🏁 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed on your machine.
- Alternatively, Node.js 18+ and PostgreSQL for local development.

### Setup with Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd Task-Tracker
   ```

2. **Run with Docker Compose**:
   ```bash
   docker compose up --build
   ```

3. **Access the application**:
   The app will be available at [http://localhost:3000](http://localhost:3000).

### Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Environment Variables**:
   Create a `.env` file based on `.env.example`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/tasktracker"
   JWT_SECRET="your-super-secret-key"
   ```

3. **Run Prisma Migrations & Seed**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## 🔐 Default Credentials (Seed Data)

After running the seed script, you can log in with:

- **Admin**: `admin@acme.com` / `password123`
- **Member**: `member@acme.com` / `password123`

## 🏗 Project Structure

- `/app`: Next.js pages and API routes.
- `/components`: Reusable UI components.
- `/lib`: Utility functions, database client, and auth helpers.
- `/prisma`: Database schema and seed script.
- `/public`: Static assets.