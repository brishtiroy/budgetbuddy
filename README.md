# BudgetBuddy 

A full-stack budgeting app for solo users and couples.  
Built with React, Node.js, Express, and MongoDB.

## Features

- Solo and couple budgeting modes
- Invite partner via email with a unique code
- Real expense inputs — rent, commute, fixed costs
- Joint account calculator with proportional contributions
- Personal and couple savings goals with monthly breakdown
- JWT authentication

## Tech stack

- **Frontend** — React 18, Vite, TailwindCSS
- **Backend** — Node.js, Express
- **Database** — MongoDB Atlas
- **Auth** — JWT + bcrypt
- **Email** — Nodemailer + Gmail

## Setup

### 1. Clone the repo

git clone https://github.com/YOURUSERNAME/budgetbuddy.git
cd budgetbuddy

### 2. Backend setup

cd server
npm install
cp .env.example .env
# Fill in your values in .env

### 3. Frontend setup

cd ../client
npm install

### 4. Run

# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend  
cd client && npm run dev

Open http://localhost:5173