# BNI Analytics Application

A comprehensive Business Networking Analytics application for tracking and analyzing chapter performance, member interactions, and business referrals.

## Tech Stack

- **Backend**: Django 4.2 with Django REST Framework
- **Frontend**: React 18 with TypeScript
- **Database**: PostgreSQL (SQLite for development)
- **Cache/Queue**: Redis with Celery
- **UI Library**: Material-UI
- **Charts**: Recharts

## Features

- **One-to-One Meeting Tracking**: Monitor member-to-member meetings
- **Referral Matrix**: Track referral relationships and flow
- **TYFCB Tracking**: Thank You For Closed Business transaction monitoring
- **Excel Import**: Bulk data import from Excel files
- **Real-time Analytics**: Interactive dashboards and reports
- **Member Scorecards**: Individual performance metrics

## Project Structure

```
bni-app/
├── backend/               # Django backend
│   ├── core/             # Project settings
│   ├── accounts/         # User management
│   ├── chapters/         # Chapter management
│   ├── analytics/        # Business logic
│   ├── reports/          # Report generation
│   ├── data_processing/  # Excel import
│   └── api/              # REST endpoints
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/       # Application pages
│   │   ├── services/    # API services
│   │   └── utils/       # Helper functions
└── docker-compose.yml    # Docker configuration
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (optional, for production)
- Redis (optional, for Celery)
- Docker & Docker Compose (optional)

## Installation

### Option 1: Local Development with Virtual Environment

#### Backend Setup

1. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Run database migrations:
```bash
python manage.py migrate
```

5. Create superuser:
```bash
python manage.py createsuperuser
```

6. Run development server:
```bash
python manage.py runserver
```

Backend will be available at http://localhost:8000

#### Frontend Setup

1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm start
```

Frontend will be available at http://localhost:3000

### Option 2: Docker Development

1. Build and start all services:
```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Redis on port 6379
- Django backend on port 8000
- React frontend on port 3000
- Celery worker for background tasks

2. Run migrations (first time only):
```bash
docker-compose exec backend python manage.py migrate
```

3. Create superuser:
```bash
docker-compose exec backend python manage.py createsuperuser
```

## API Documentation

API documentation is available at:
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/

## Environment Variables

Create a `.env` file in the backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgresql://user:password@localhost:5432/bni_db
REDIS_URL=redis://localhost:6379/0
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

## Development Commands

### Backend

```bash
# Run tests
python manage.py test

# Create new migration
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Start Celery worker
celery -A core worker -l info

# Start Celery beat (scheduler)
celery -A core beat -l info
```

### Frontend

```bash
# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

### Docker

```bash
# Start services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Execute command in container
docker-compose exec backend python manage.py shell
```

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Railway Deployment (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Add PostgreSQL and Redis:
```bash
railway add postgresql
railway add redis
```

4. Deploy:
```bash
railway up
```

### Alternative Deployment Options

- **Heroku**: Use Heroku buildpacks for Python and Node.js
- **DigitalOcean App Platform**: Configure app.yaml for multi-service deployment
- **AWS/GCP**: Use container services or traditional EC2/Compute Engine

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is proprietary and confidential.

## Support

For issues and questions, please contact the development team.
