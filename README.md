# Blood Bank Management System

A comprehensive system for managing blood inventory across hospitals.

## Features

- User authentication and authorization
- Blood inventory management
- Search and filtering capabilities
- Data recovery and soft deletion
- Hospital-specific data access

## Getting Started

### Prerequisites

- Node.js 18 or later
- PostgreSQL database (we use Neon for serverless PostgreSQL)

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
DATABASE_URL=your_postgres_connection_string
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Initialize the database:

\`\`\`bash
psql -f scripts/init-db.sql your_database_name
\`\`\`

4. Hash any plain text passwords:

\`\`\`bash
npx ts-node scripts/hash-passwords.ts
\`\`\`

5. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

### Production Deployment

1. Set up environment variables on your hosting platform
2. Build the application:

\`\`\`bash
npm run build
\`\`\`

3. Start the production server:

\`\`\`bash
npm start
\`\`\`

## Database Schema

The application uses the following tables:

- `admins`: User accounts for hospital administrators
- `admin_sessions`: Session management for authenticated users
- `hospitals`: Hospital information
- `redblood_inventory`: Red blood cell inventory
- `plasma_inventory`: Plasma inventory
- `platelets_inventory`: Platelets inventory

## Security

- Passwords are hashed using bcrypt
- Session tokens are randomly generated
- Hospital-specific data access controls
- Input validation and sanitization

## License

This project is licensed under the MIT License - see the LICENSE file for details.
\`\`\`

Let's remove the debug pages and endpoints:

```typescriptreact file="app/debug/page.tsx" isDeleted="true"
...deleted...
