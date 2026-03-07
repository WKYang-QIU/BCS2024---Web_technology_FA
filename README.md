# Campus Lost & Found Management System

A full-stack web application for Quest International University (QIU) to manage lost and found items digitally, replacing the manual notice board and WhatsApp group system.

## Features

- Submit lost/found item reports with optional image upload
- View all lost and found items
- View detailed item information
- Update item status (Active / Claimed / Resolved)
- Delete reports
- User authentication (login/logout)
- Role-based access control (admin/student)
- Forgot password / reset password
- Admin panel for user management
- Server-side validation and security measures

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Image Storage**: Cloudinary
- **Deployment**: Railway
- **Security**: bcryptjs, parameterized queries, XSS prevention, session auth

## Environment Variables

Copy `.env.example` and fill in your credentials:

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
SESSION_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/WKYang-QIU/BCS2024---Web_technology_FA.git
cd BCS2024---Web_technology_FA
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your database and Cloudinary credentials
```

### 4. Setup database
Import the provided SQL file:
```bash
mysql -u root -p < database.sql
```

### 5. Run the server
```bash
node server.js
```

Visit: http://localhost:3000

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/check | Check session |
| POST | /api/auth/reset-password | Reset password |
| GET | /api/items | Get all items |
| GET | /api/items/:id | Get item by ID |
| POST | /api/items | Create new item |
| PUT | /api/items/:id | Update item |
| DELETE | /api/items/:id | Delete item |
| GET | /api/users | Get all users (admin) |
| POST | /api/users | Create user (admin) |
| DELETE | /api/users/:id | Delete user (admin) |

## Deployment

Live URL: https://bcs2024-webtechnologyfa-production.up.railway.app

## Default Admin Account

Username: `admin`  
Password: `admin123`