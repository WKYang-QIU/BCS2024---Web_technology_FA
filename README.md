# Campus Lost & Found Management System
To simulate bulid a full-stack web application for QIU to manage lost and found items digitally.

## Feature
- Submit lost item report
- Submit found item report
- View all lost/found items
- Update item status (e.g. Active change status to Claimed/Resolved)
- Delete reports
- Server-side validation and security

## Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js + Express.js
- **Database**: MySQL

## Setup Instruction

### 1. Clone the repository
```bash
git clone <https://github.com/WKYang-QIU/BCS2024---Web_technology_FA.git>
cd Web_tech_FA
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with database credential
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
| GET | /api/items | Get all items |
| GET | /api/items/:id | Get item by ID |
| POST | /api/items | Create new item |
| PUT | /api/items/:id | Update item status |
| DELETE | /api/items/:id | Delete item |