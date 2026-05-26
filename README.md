<div align="center">

# 🛡️ VerifAI

### *AI-powered document auditing and bias detection.*

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_LLM-F55036?style=for-the-badge&logo=groq&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

## 📖 About

**VerifAI** is an AI-powered document auditing platform. It uses large language models (via Groq's inference API) to analyse uploaded documents for authenticity, detect bias, and provide structured audit reports. Built with a Next.js frontend and a FastAPI backend, it is fully containerised with Docker Compose.

The platform supports a freemium model with monthly usage limits per plan tier.

---

## ✨ Features

- **📄 Document Auditing** — AI-powered analysis of document authenticity and content quality
- **⚖️ Bias Detection** — Identifies potential biases in written content
- **🏆 Contest Mode** — Document evaluation for competition/review contexts
- **🔐 JWT Authentication** — Secure user sessions with token-based auth
- **📊 Usage Limits** — Free plan with monthly quotas per feature
- **🐳 Docker Ready** — Full-stack containerisation via Docker Compose
- **📁 File Uploads** — Supports documents up to 10MB

---

## 🛠️ Tech Stack

### Frontend
| Tool | Detail |
|---|---|
| Framework | Next.js |
| Port | 3000 |
| API Communication | REST to FastAPI backend |

### Backend
| Tool | Detail |
|---|---|
| Framework | FastAPI (Python) |
| Port | 8000 |
| LLM | Groq API (fast LLM inference) |
| Auth | JWT tokens |
| File Limit | 10 MB max upload |

### Infrastructure
| Tool | Detail |
|---|---|
| Containerisation | Docker + Docker Compose |
| Orchestration | `docker-compose.yml` (backend + frontend services) |

---

## 💳 Plan Limits (Free Tier)

| Feature | Monthly Limit |
|---|---|
| Document Audits | 5 |
| Bias Checks | 3 |
| Contest Submissions | 2 |

---

## 📂 Project Structure

```
VERIFIAI/
├── docker-compose.yml      # Orchestrates backend + frontend containers
├── .env.example            # Environment variable template
├── backend/
│   ├── Dockerfile          # Backend container config
│   ├── main.py             # FastAPI entry point
│   ├── routes/             # API route handlers
│   └── requirements.txt    # Python dependencies
└── frontend/
    ├── Dockerfile          # Frontend container config
    ├── pages/              # Next.js pages
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Docker + Docker Compose

### 1. Clone & configure
```bash
git clone https://github.com/Manan-2007/VERIFIAI.git
cd VERIFIAI
cp .env.example backend/.env
```

### 2. Fill in your environment variables
```env
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here
NEXT_PUBLIC_API_URL=http://localhost:8000
MAX_FILE_SIZE_MB=10
```

### 3. Start with Docker Compose
```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |

---
