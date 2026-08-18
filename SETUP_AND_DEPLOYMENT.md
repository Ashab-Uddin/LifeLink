# LifeLink Health Diagnostics - Setup & Deployment Guide

## 📦 Comprehensive Setup Instructions

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Windows Specific Setup](#windows-specific-setup)
3. [Mac/Linux Setup](#maclinux-setup)
4. [Docker Setup](#docker-setup)
5. [Deployment Options](#deployment-options)
6. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Requirements Checklist

- ✅ Python 3.9 or higher
- ✅ pip (comes with Python)
- ✅ Git (optional but recommended)
- ✅ At least 500MB free disk space
- ✅ Modern web browser (Chrome, Firefox, Edge)
- ✅ Terminal/Command Prompt access

### Verify Python Installation

**Windows**:
```bash
python --version
pip --version
```

**Mac/Linux**:
```bash
python3 --version
pip3 --version
```

Should show Python 3.9+

---

## Windows Specific Setup

### Step 1: Open Command Prompt

Press `Win + R`, type `cmd`, press Enter

### Step 2: Navigate to Project

```bash
cd d:\LifeLink\ ML
```

Or with quotes:
```bash
cd "d:\LifeLink ML"
```

### Step 3: Create Virtual Environment

```bash
python -m venv venv
```

This creates a `venv` folder.

### Step 4: Activate Virtual Environment

```bash
venv\Scripts\activate
```

You should see `(venv)` prefix in terminal.

### Step 5: Upgrade pip (Optional but Recommended)

```bash
python -m pip install --upgrade pip
```

### Step 6: Install Dependencies

```bash
pip install -r requirements.txt
```

Expected output:
```
Successfully installed fastapi-0.141.1 uvicorn-0.52.1 ...
```

### Step 7: Verify Installation

```bash
pip list
```

Should show all packages from requirements.txt

### Step 8: Start Backend API

```bash
python -m uvicorn api.index:app --reload --log-level debug
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

### Step 9: In New Command Prompt, Start Frontend

```bash
# Open new command prompt
cd "d:\LifeLink ML"
python -m http.server 5500
```

Expected output:
```
Serving HTTP on 127.0.0.1 port 5500
```

### Step 10: Open in Browser

```
http://127.0.0.1:5500/index/index.html
```

---

## Mac/Linux Setup

### Step 1: Open Terminal

Press `Cmd + Space` (Mac) or `Ctrl + Alt + T` (Linux), type "Terminal"

### Step 2: Navigate to Project

```bash
cd d:/LifeLink\ ML
# or
cd /path/to/LifeLink\ ML
```

### Step 3: Create Virtual Environment

```bash
python3 -m venv venv
```

### Step 4: Activate Virtual Environment

```bash
source venv/bin/activate
```

You should see `(venv)` prefix in terminal.

### Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 6: Start Backend API (Terminal 1)

```bash
python -m uvicorn api.index:app --reload --log-level debug
```

### Step 7: Start Frontend (Terminal 2)

```bash
# New terminal tab/window
cd /path/to/LifeLink\ ML
source venv/bin/activate
python -m http.server 5500
```

### Step 8: Open Browser

```
http://127.0.0.1:5500/index/index.html
```

---

## Docker Setup

### Prerequisites

- Docker Desktop installed ([download](https://www.docker.com/products/docker-desktop))
- At least 2GB RAM allocated to Docker

### Step 1: Create Dockerfile

Create file `Dockerfile` in project root:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Copy project files
COPY requirements.txt .
COPY api/ ./api/
COPY *.pkl ./
COPY *.csv ./

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 8000

# Start API
CMD ["python", "-m", "uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 2: Create docker-compose.yml

```yaml
version: '3.8'

services:
  lifelink-api:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./api:/app/api
      - ./:/app
    environment:
      - PYTHONUNBUFFERED=1
    command: python -m uvicorn api.index:app --host 0.0.0.0 --port 8000 --reload

  lifelink-frontend:
    image: python:3.10-slim
    working_dir: /app
    ports:
      - "5500:5500"
    volumes:
      - ./:/app
    command: python -m http.server 5500 --directory /app
```

### Step 3: Build and Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up
```

### Step 4: Access Application

- Frontend: `http://localhost:5500/index/index.html`
- API: `http://localhost:8000/api/health`

### Step 5: Stop Services

```bash
docker-compose down
```

---

## Deployment Options

### Option 1: Vercel (Recommended)

The project includes `vercel.json` configuration.

**Prerequisites**: Vercel account, Git

**Steps**:

1. Push code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/lifelink.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)

3. Click "New Project" → Connect Git repository

4. Select repository

5. Configure:
   - **Framework**: None
   - **Root Directory**: `/`
   - **Build Command**: None (leave blank)
   - **Output Directory**: `/index`

6. Deploy

**Result**: Frontend deployed automatically

**For API**: Deploy to separate platform (see below)

---

### Option 2: Heroku

**Prerequisites**: Heroku account, Heroku CLI

**Step 1: Create Procfile**

```
web: python -m uvicorn api.index:app --host 0.0.0.0 --port $PORT
```

**Step 2: Login to Heroku**

```bash
heroku login
```

**Step 3: Create App**

```bash
heroku create lifelink-api
```

**Step 4: Deploy**

```bash
git push heroku main
```

**Step 5: View Logs**

```bash
heroku logs --tail
```

**Result**: API available at `https://lifelink-api.herokuapp.com`

---

### Option 3: Railway.app

**Prerequisites**: Railway account

**Step 1**: Connect GitHub repository

**Step 2**: Create new service from GitHub

**Step 3**: Set start command:
```
python -m uvicorn api.index:app --host 0.0.0.0
```

**Step 4**: Deploy

---

### Option 4: AWS (EC2 + S3)

**For Backend (EC2)**:

```bash
# On EC2 instance
sudo apt-get update
sudo apt-get install python3-pip
git clone <your-repo>
cd LifeLink\ ML
pip install -r requirements.txt
python -m uvicorn api.index:app --host 0.0.0.0 --port 8000
```

**For Frontend (S3 + CloudFront)**:

1. Upload `index/` to S3
2. Configure CloudFront for CDN
3. Enable static website hosting

---

### Option 5: DigitalOcean

**Prerequisites**: DigitalOcean account, SSH access

**Step 1**: Create Droplet (Ubuntu 22.04)

**Step 2**: Connect via SSH

```bash
ssh root@your_droplet_ip
```

**Step 3**: Install Dependencies

```bash
apt-get update
apt-get install -y python3-pip python3-venv
```

**Step 4**: Clone Project

```bash
git clone <your-repo>
cd LifeLink\ ML
```

**Step 5**: Setup & Run

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn api.index:app --host 0.0.0.0 --port 8000
```

**Step 6**: Use PM2 (Keep Running)

```bash
apt-get install -y nodejs npm
npm install -g pm2
pm2 start "python -m uvicorn api.index:app --host 0.0.0.0 --port 8000"
pm2 startup
```

---

## Update Frontend API URLs for Deployment

After deploying backend to production, update API URLs in frontend:

**Edit** `js/script.js`:

```javascript
// Before (local):
const API_URL = 'http://127.0.0.1:8000/api';

// After (production):
const API_URL = 'https://your-deployed-api.com/api';
```

---

## Environment Configuration

### Local Development (.env)

Create `.env` file:

```
FLASK_ENV=development
API_HOST=127.0.0.1
API_PORT=8000
DEBUG=True
```

### Production (.env.production)

```
FLASK_ENV=production
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False
CORS_ORIGINS=https://yourdomain.com
```

Load in `api/index.py`:

```python
from dotenv import load_dotenv
import os

load_dotenv()

CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
```

---

## Database Setup (Optional)

For storing predictions:

### SQLite (Simple)

```python
import sqlite3

conn = sqlite3.connect('predictions.db')
c = conn.cursor()

c.execute('''CREATE TABLE predictions (
    id INTEGER PRIMARY KEY,
    disease TEXT,
    symptoms TEXT,
    accuracy REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)''')

conn.commit()
```

### PostgreSQL (Production)

```bash
pip install psycopg2-binary
```

Connection string:
```
postgresql://user:password@localhost:5432/lifelink
```

---

## SSL/TLS Setup

### Self-Signed Certificate (Testing)

```bash
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

Start server with SSL:
```bash
python -m uvicorn api.index:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem
```

### Let's Encrypt (Production)

```bash
apt-get install -y certbot python3-certbot-nginx
certbot certonly --standalone -d yourdomain.com
```

---

## Performance Optimization

### 1. Model Caching

```python
from functools import lru_cache

@lru_cache(maxsize=7)
def get_model(model_name):
    return load_dynamic_model(model_name)
```

### 2. Enable Gzip Compression

```python
from fastapi.middleware.gzip import GZIPMiddleware

app.add_middleware(GZIPMiddleware, minimum_size=1000)
```

### 3. Use Gunicorn (Production)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 api.index:app
```

### 4. Caching Headers

```python
@app.get("/api/symptoms")
async def get_symptoms(response: Response):
    response.headers["Cache-Control"] = "max-age=86400"  # 24 hours
    return {...}
```

---

## Monitoring & Logging

### Application Logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Prediction made for disease: {disease}")
```

### Health Monitoring

```bash
# Check API is running
curl http://127.0.0.1:8000/api/health

# Monitor logs
tail -f /var/log/app.log
```

### Error Tracking (Sentry)

```python
import sentry_sdk

sentry_sdk.init(
    "https://key@sentry.io/project"
)
```

---

## Troubleshooting

### Issue: "Port already in use"

**Error**: `Address already in use`

**Solution**:
```bash
# Windows - find process using port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :8000
kill -9 <PID>
```

### Issue: Import Errors

**Error**: `ModuleNotFoundError: No module named 'fastapi'`

**Solution**:
```bash
# Make sure virtual environment is activated
which python  # Should show path inside venv

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

### Issue: File Not Found

**Error**: `FileNotFoundError: RandomForest.pkl`

**Solution**:
```bash
# Verify files exist
ls *.pkl  # Mac/Linux
dir *.pkl  # Windows

# Verify working directory
pwd  # Should be d:\LifeLink ML
```

### Issue: CORS Errors

**Error**: `CORS policy blocked request`

**Solution**: Already configured in `api/index.py`, but verify:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Frontend Can't Connect to API

**Error**: `Failed to fetch` or connection timeout

**Solution**:
1. Verify API is running: `curl http://127.0.0.1:8000/api/health`
2. Verify frontend API URL is correct
3. Check firewall allows port 8000
4. If deployed, update API_URL in frontend

---

## Configuration File Locations

| File | Purpose |
|------|---------|
| `requirements.txt` | Python dependencies |
| `.env` | Environment variables |
| `vercel.json` | Vercel deployment config |
| `docker-compose.yml` | Docker configuration |
| `Procfile` | Heroku configuration |
| `api/index.py` | Main application |

---

## Backup & Restore

### Backup Project

```bash
# Backup to zip
tar -czf lifelink_backup.tar.gz .

# Upload to cloud storage
aws s3 cp lifelink_backup.tar.gz s3://backup-bucket/
```

### Restore Project

```bash
# Extract from backup
tar -xzf lifelink_backup.tar.gz

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Health Check Endpoints

### API Health
```bash
curl http://127.0.0.1:8000/api/health
```

### Models Status
```bash
curl http://127.0.0.1:8000/api/models
```

### Symptoms Count
```bash
curl http://127.0.0.1:8000/api/symptoms | grep count
```

---

## Next Steps

1. Follow local setup above
2. Test the application
3. Choose deployment option
4. Deploy to production
5. Monitor logs and errors
6. Update documentation as needed

---

**Setup Guide Version**: 1.0  
**Last Updated**: 2024  
**Status**: Complete
