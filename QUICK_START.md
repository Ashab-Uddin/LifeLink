# LifeLink Health Diagnostics - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd d:\LifeLink\ ML
pip install -r requirements.txt
```

### Step 2: Start Backend (Terminal 1)
```bash
python -m uvicorn api.index:app --reload --log-level debug
```
✅ Should see: `Application startup complete` at `http://127.0.0.1:8000`

### Step 3: Start Frontend (Terminal 2)
```bash
python -m http.server 5500
```
✅ Should see: `Serving HTTP on 127.0.0.1 port 5500`

### Step 4: Open Browser
```
http://127.0.0.1:5500/index/index.html
```

---

## 📍 Key API Endpoints

| Endpoint | Method | Purpose | Returns |
|----------|--------|---------|---------|
| `/api/health` | GET | Check API status | Health status |
| `/api/symptoms` | GET | List all symptoms | 132+ symptoms |
| `/api/models` | GET | List ML models | 7 available models |
| `/api/predict` | POST | Make prediction | Disease + recommendations |

---

## 🔍 Make a Prediction

### Using JavaScript
```javascript
const response = await fetch('http://127.0.0.1:8000/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    symptoms: ['fever', 'cough', 'fatigue'],
    model: 'RandomForest'
  })
});
const result = await response.json();
console.log(result.disease); // Common Cold
```

### Using Python
```python
import requests
response = requests.post('http://127.0.0.1:8000/api/predict', 
  json={'symptoms': ['fever', 'cough'], 'model': 'RandomForest'})
print(response.json()['disease'])
```

### Using cURL
```bash
curl -X POST http://127.0.0.1:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"symptoms":["fever","cough"],"model":"RandomForest"}'
```

---

## 📂 File Locations

| What | Where |
|------|-------|
| API Backend | `api/index.py` |
| Frontend | `index/index.html` |
| ML Models | `*.pkl` (RandomForest.pkl, etc) |
| Symptom Data | `symptoms_list.pkl` |
| Disease Info | `*.csv` files |
| Model Accuracy | `all_accuracies.json` |

---

## 🎯 Available Models

```
RandomForest       → ~92% accuracy (BEST)
GradientBoosting   → ~89% accuracy
SVC                → ~88% accuracy
KNeighbors         → ~85% accuracy
MultinomialNB      → ~82% accuracy
DecisionTree       → ~80% accuracy
LRegression        → ~75% accuracy
```

---

## 🏥 Prediction Response Includes

✅ **Disease**: Predicted condition  
✅ **Accuracy**: Model confidence (0-1)  
✅ **Description**: Medical explanation  
✅ **Precautions**: Prevention tips  
✅ **Medications**: Suggested drugs  
✅ **Diet**: Food recommendations  
✅ **Workout**: Exercise suggestions  

---

## 🐛 Common Issues

| Error | Fix |
|-------|-----|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| `Connection refused` | Start API: `python -m uvicorn api.index:app --reload` |
| `Model not found` | Check `.pkl` files in project root |
| CORS errors | Verify API running on `:8000`, frontend on `:5500` |
| `Invalid symptoms` | Use exact symptom names from `/api/symptoms` |

---

## 📊 Symptom Format

Symptoms must use **underscores**, not spaces:
- ✅ CORRECT: `itching`, `skin_rash`, `nodal_skin_eruptions`
- ❌ WRONG: `Itching`, `Skin Rash`, `skin rash`

Get full list:
```bash
curl http://127.0.0.1:8000/api/symptoms
```

---

## 🔧 Project Structure

```
LifeLink ML/
├── api/index.py              # FastAPI application
├── index/                    # Frontend (HTML/CSS/JS)
├── *.pkl                     # ML models & encoders
├── *.csv                     # Disease & health data
├── requirements.txt          # Dependencies
└── PROJECT_DOCUMENTATION.md  # Full docs
```

---

## 💾 Browser History

Predictions saved to **LocalStorage**:
- Location: `history.html`
- Persists across browser sessions
- No server-side storage

---

## 🚀 Development Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Start API with debug logging
python -m uvicorn api.index:app --reload --log-level debug

# Start frontend server
python -m http.server 5500

# Check API health
curl http://127.0.0.1:8000/api/health
```

---

## 📋 Checklist Before Launch

- [ ] All `.pkl` files present in root
- [ ] All `.csv` files present in root
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] API running: `http://127.0.0.1:8000`
- [ ] Frontend running: `http://127.0.0.1:5500`
- [ ] No CORS errors in browser console
- [ ] Can fetch symptoms: `GET /api/symptoms`
- [ ] Can make prediction: `POST /api/predict`

---

## 🌐 Accessing Pages

| Page | URL |
|------|-----|
| Dashboard | `http://127.0.0.1:5500/index/index.html` |
| Prediction | `http://127.0.0.1:5500/index/prediction.html` |
| History | `http://127.0.0.1:5500/index/history.html` |
| Login | `http://127.0.0.1:5500/index/login.html` |
| Doctor Finder | `http://127.0.0.1:5500/index/doctor.html` |

---

## 📚 Additional Info

- **Python Version**: 3.9+ (3.10 recommended)
- **Framework**: FastAPI + Uvicorn
- **ML Library**: Scikit-learn 1.2.2
- **Deployment**: Vercel-ready (vercel.json configured)

---

**Need More Help?** See `PROJECT_DOCUMENTATION.md` for complete documentation.
