# QwenTrace
Auditable financial reasoning agent. Every answer cites its source rows.

## What It Does
Upload CSV/XLSX of transactions → ask questions in plain English → get answers where every number traces to specific source rows + formulas.

## Stack
- Backend: Express, Mongoose, JWT, Qwen via OpenRouter
- Frontend: React + Vite
- Database: MongoDB Atlas

## Setup
```bash
# Backend
cd server && npm install
cp .env.example .env   # fill MONGO_URI and QWEN_API_KEY
node server.js

# Frontend
cd client && npm install
npx vite
```

Visit http://localhost:5173

## Architecture
Three-layer evidence chain:
1. Conclusion — the direct answer
2. Evidence chain — source rows cited
3. Reasoning — formula + tool call log

The agent refuses to answer if it cannot cite source rows.

## License
MIT
