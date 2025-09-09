# GastroManager

A modern web application for managing gastroenterology clinic operations, built with React, TypeScript, and Supabase.

## Features

- User authentication and authorization
- Patient management
- Appointment scheduling
- Medical records management
- Billing and invoicing
- Responsive design for all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Deployment**: Render

## Prerequisites

- Node.js 16+ and npm 8+
- Supabase account and project
- Git

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/gastromanager.git
   cd gastromanager
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../api
   npm install
   cd ..
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in the root directory
   - Update the values with your Supabase credentials

4. **Start the development server**
   ```bash
   # Start both frontend and backend in development mode
   npm run dev
   ```
   - Frontend will be available at http://localhost:3000
   - Backend API will be available at http://localhost:5000/api

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server
PORT=5000
NODE_ENV=development

# Frontend
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run client` - Start only the frontend
- `npm run server` - Start only the backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests

## Project Structure

```
gastromanager/
├── api/                  # Backend API (Express)
│   ├── src/              # Source files
│   ├── supabase/         # Supabase client and types
│   ├── index.ts          # Entry point
│   └── package.json
├── client/               # Frontend (React)
│   ├── public/           # Static files
│   ├── src/              # Source files
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── ...
│   └── package.json
├── shared/               # Shared code between frontend and backend
└── package.json          # Root package.json
```

## Deployment

### Prerequisites
- Render account
- Supabase project

### Steps

1. **Deploy the backend**
   - Create a new Web Service on Render
   - Connect your GitHub repository
   - Configure the build command: `npm install && npm run build`
   - Configure the start command: `node dist/index.js`
   - Add the required environment variables

2. **Deploy the frontend**
   - Create a new Static Site on Render
   - Connect your GitHub repository
   - Set the build command: `cd client && npm install && npm run build`
   - Set the publish directory: `client/dist`
   - Add the required environment variables

## Database Schema

See `shared/schema.ts` for the complete database schema.

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
