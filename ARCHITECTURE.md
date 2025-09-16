# BNI App Architecture Documentation

## Overview

The BNI (Business Networking International) application is structured using a **feature-based architecture** that organizes code by business domain rather than technical layers. This makes the codebase easier to navigate, maintain, and scale.

## Directory Structure

```
bni-app/
├── frontend/src/
│   ├── app/                      # Application entry point
│   │   ├── App.tsx               # Main app component
│   │   └── index.tsx             # React DOM root
│   ├── shared/                   # Shared utilities & components
│   │   ├── components/
│   │   │   ├── ui/               # Design system components
│   │   │   ├── layout/           # Layout components
│   │   │   └── common/           # Common components (ErrorBoundary, etc.)
│   │   ├── hooks/                # Shared React hooks
│   │   ├── lib/                  # Utilities (query client, etc.)
│   │   ├── services/             # API clients and data services
│   │   └── utils/                # Helper functions
│   ├── features/                 # Business features
│   │   ├── chapters/             # Chapter management
│   │   ├── members/              # Member management
│   │   ├── analytics/            # Analytics and reporting
│   │   ├── reports/              # Report generation
│   │   ├── file-upload/          # File upload functionality
│   │   └── admin/                # Administration features
│   └── testing/                  # Testing utilities
│       ├── __tests__/            # Global tests
│       ├── fixtures/             # Test data
│       ├── mocks/                # MSW handlers
│       ├── utils/                # Test utilities
│       └── setup/                # Test setup files
├── backend/
│   ├── config/                   # Django project configuration
│   │   ├── settings.py           # Django settings
│   │   ├── urls.py               # Main URL configuration
│   │   ├── wsgi.py               # WSGI application
│   │   └── asgi.py               # ASGI application
│   ├── shared/                   # Shared utilities
│   │   ├── models.py             # Base model classes
│   │   ├── utils.py              # Utility functions
│   │   └── exceptions.py         # Custom exceptions
│   ├── features/                 # Django apps organized by feature
│   │   ├── chapters/             # Chapter and member models/views
│   │   ├── analytics/            # Analytics models/views
│   │   ├── reports/              # Report generation
│   │   ├── data_processing/      # Data import and processing
│   │   └── api/                  # Main API endpoints
│   └── testing/                  # Testing utilities
│       ├── fixtures/             # Test data
│       ├── factories/            # Model factories
│       └── utils/                # Test utilities
```

## Key Architectural Principles

### 1. **Feature-Based Organization**
- Code is organized by business functionality rather than technical layers
- Each feature is self-contained with its own components, hooks, types, etc.
- Makes it easy to understand what functionality belongs where

### 2. **Clear Separation of Concerns**
- **Frontend**: React with TypeScript for UI and user interactions
- **Backend**: Django REST Framework for API and business logic
- **Shared**: Common utilities and components used across features

### 3. **Consistent Naming**
- All directories and files use **kebab-case** for consistency
- Clear, descriptive names that indicate purpose
- Feature-specific components are prefixed with feature name

### 4. **Testing Strategy**
- Centralized testing utilities in dedicated `/testing` directories
- Each feature can have its own tests alongside components
- Shared test data and mocks for consistency

## Feature Breakdown

### **Chapters Feature**
- Manages BNI chapters (business networking groups)
- Components: chapter cards, dashboard, detail pages, routing
- Handles chapter-level data and navigation

### **Members Feature**
- Manages individual members within chapters
- Components: member details, member lists, member tabs
- Handles member profiles and member-specific data

### **Analytics Feature**
- Provides business analytics and insights
- Components: matrix displays, analytics dashboards
- Handles referral tracking, one-to-one meetings, TYFCB data

### **Reports Feature**
- Generates and displays various reports
- Components: report viewers, previous data tabs
- Handles monthly reports and historical data

### **File Upload Feature**
- Handles Excel file uploads and processing
- Components: upload interface, error handling
- Includes security utilities for safe file processing

### **Admin Feature**
- Administrative functions and dashboards
- Components: admin dashboard, management tools
- Handles system administration tasks

## Technology Stack

### Frontend
- **React 18.3.1**: Modern UI framework with concurrent features
- **TypeScript**: Type safety throughout the application
- **TailwindCSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **React Query**: Server state management
- **React Router**: Client-side routing

### Backend
- **Django 4.2.7**: Web framework with ORM
- **Django REST Framework**: RESTful API development
- **PostgreSQL**: Production database
- **Redis + Celery**: Async task processing
- **JWT Authentication**: Token-based auth

## Development Benefits

### **Easier Navigation**
- Developers can quickly find code related to specific business functionality
- Clear boundaries between different parts of the application

### **Better Maintainability**
- Changes to one feature are isolated from others
- Easier to understand the impact of modifications

### **Improved Scalability**
- New features can be added without affecting existing code
- Team members can work on different features independently

### **Consistent Structure**
- Every feature follows the same organizational pattern
- New developers can quickly understand the codebase structure

## Getting Started

1. **Frontend Development**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

2. **Backend Development**:
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Running Tests**:
   ```bash
   # Frontend
   cd frontend && npm test

   # Backend
   cd backend && python manage.py test
   ```

This architecture ensures the codebase remains organized, maintainable, and scalable as the application grows.