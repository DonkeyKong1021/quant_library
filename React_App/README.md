# QuantLib React App

React frontend for the QuantLib quantitative trading library.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

## API Backend

Make sure the FastAPI backend is running on http://localhost:8000

To start the backend:
```bash
cd ../api
pip install -r requirements.txt
uvicorn main:app --reload
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.