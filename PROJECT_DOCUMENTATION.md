# LifeLink Health Diagnostics - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Installation & Setup](#installation--setup)
4. [File Structure](#file-structure)
5. [Backend API Documentation](#backend-api-documentation)
6. [Frontend Usage](#frontend-usage)
7. [Machine Learning Models](#machine-learning-models)
8. [Data Files Reference](#data-files-reference)
9. [Running the Application](#running-the-application)
10. [API Endpoints Guide](#api-endpoints-guide)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

**LifeLink Health Diagnostics** is an AI-powered health prediction system that uses machine learning to predict diseases based on patient symptoms. The application features:

- **Multiple ML Models**: RandomForest, SVC, Gradient Boosting, K-Neighbors, Multinomial Naive Bayes, Decision Tree, and Logistic Regression
- **Comprehensive Health Info**: Disease descriptions, precautions, medications, diet recommendations, and workout suggestions
- **Web Frontend**: Modern, responsive healthcare UI built with HTML, CSS, and JavaScript
- **RESTful API**: FastAPI backend with CORS support for cross-origin requests
- **Real-time Predictions**: Instant disease predictions based on symptom selection

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│          Frontend (HTML/CSS/JavaScript)             │
│  - Prediction Interface                             │
│  - Model Selection                                  │
│  - History Management (Browser LocalStorage)        │
│  - Dashboard & Analytics                            │
└──────────────┬──────────────────────────────────────┘
               │
               │ HTTP Requests
               │ (CORS Enabled)
               ▼
┌─────────────────────────────────────────────────────┐
│     FastAPI Backend (Python)                        │
│  - Symptom Validation                               │
│  - Model Loading & Prediction                       │
│  - Health Data Retrieval                            │
│  - Response Formatting                              │
└──────────────┬──────────────────────────────────────┘
               │
               │
      ┌────────┴────────┬─────────────┬──────────────┐
      ▼                 ▼             ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────┐ ┌─────────┐
│ ML Models    │ │ CSV Data     │ │ Encoders │ │ Symptom │
│ (.pkl files) │ │ (Disease     │ │ (.pkl)   │ │ List    │
│              │ │  info)       │ │          │ │ (.pkl)  │
└──────────────┘ └──────────────┘ └──────────┘ └─────────┘
```

---

## Installation & Setup

### Prerequisites
- Python 3.9+ (3.10 recommended)
- pip or conda package manager
- Modern web browser
- Terminal/Command Prompt access

### Step 1: Navigate to Project Directory
```bash
cd d:\LifeLink\ ML
```

### Step 2: Create Virtual Environment (Optional but Recommended)
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

**Required Packages:**
- fastapi==0.141.1
- uvicorn==0.52.1
- pydantic==2.13.4
- numpy==1.26.4
- pandas==2.3.0
- scipy==1.14.1
- scikit-learn==1.2.2
- joblib==1.5.1

### Step 4: Verify Installation
```bash
pip list
# Should show all installed packages
```

---

## File Structure

```
LifeLink ML/
├── api/
│   └── index.py                 # Main FastAPI application
├── index/                       # Frontend HTML files
│   ├── index.html              # Main dashboard
│   ├── login.html              # Login page
│   ├── signup.html             # Registration page
│   ├── prediction.html         # AI Prediction interface
│   ├── dashboard.html          # Analytics dashboard
│   ├── history.html            # Prediction history
│   ├── doctor.html             # Doctor finder
│   ├── nearby.html             # Nearby clinics
│   ├── blood.html              # Blood info
│   └── ambulance.html          # Emergency services
├── styles/
│   └── style.css               # Global CSS styles
├── js/
│   └── script.js               # Frontend JavaScript logic
├── image/                      # Image assets
│
├── ML Models (Pickled):
│   ├── RandomForest.pkl
│   ├── SVC.pkl
│   ├── GradientBoosting.pkl
│   ├── KNeighbors.pkl
│   ├── MultinomialNB.pkl
│   ├── DecisionTree.pkl
│   └── LRegression.pkl
│
├── Data & Encoding:
│   ├── encoder.pkl             # Label encoder for diseases
│   ├── symptoms_list.pkl       # List of all symptoms
│
├── Health Information (CSV):
│   ├── symtoms_df.csv          # Symptom definitions
│   ├── description.csv         # Disease descriptions
│   ├── precautions_df.csv      # Precautions for each disease
│   ├── medications.csv         # Recommended medications
│   ├── diets.csv               # Diet recommendations
│   ├── workout_df.csv          # Exercise recommendations
│
├── Training Data:
│   ├── Training.csv            # Training dataset
│   ├── Testing.csv             # Testing dataset
│   ├── Symptom-severity.csv    # Symptom severity levels
│
├── Analytics:
│   ├── all_accuracies.json     # Model accuracy scores
│   ├── accuracy_plot.png       # Accuracy visualization
│   ├── model_accuracies.png    # Model comparison
│
├── Jupyter Notebooks:
│   ├── Comprehensive-Health-Diagnostics.ipynb
│   └── graph.ipynb
│
├── Configuration:
│   ├── requirements.txt        # Python dependencies
│   ├── vercel.json            # Vercel deployment config
│   ├── README.txt             # Quick start guide
│   └── PROJECT_DOCUMENTATION.md (this file)
```

---

## Backend API Documentation

### Server Configuration
- **Framework**: FastAPI 0.141.1
- **Server**: Uvicorn 0.52.1
- **Default Port**: 8000
- **Base URL**: `http://127.0.0.1:8000`

### CORS Configuration
- **Allowed Origins**: All (`["*"]`)
- **Allowed Methods**: All
- **Allowed Headers**: All
- **Credentials**: Enabled

### API Response Format

All API responses follow this structure:

```json
{
  "success": true/false,
  "message": "Optional message",
  "data": {}
}
```

---

## Frontend Usage

### Pages Overview

#### 1. **Dashboard (index.html)**
- Main landing page
- Quick health status overview
- Navigation to other sections

#### 2. **Prediction (prediction.html)**
- Main feature for disease prediction
- Symptom selection interface
- Model selection dropdown
- Results display with comprehensive health info

#### 3. **History (history.html)**
- Stores past predictions locally
- Browser-based localStorage
- Allows viewing previous diagnoses

#### 4. **Doctor Finder (doctor.html)**
- Locate nearby physicians
- Doctor information and ratings

#### 5. **Nearby Clinics (nearby.html)**
- Find healthcare facilities
- Location-based search

#### 6. **Emergency (ambulance.html)**
- Quick access to emergency services
- Emergency contact information

#### 7. **Medical Info Pages**
- **Blood (blood.html)**: Blood type and transfusion info
- **Login (login.html)**: User authentication
- **Signup (signup.html)**: New user registration

---

## Machine Learning Models

### Available Models

| Model Name | Accuracy | Best For |
|------------|----------|----------|
| RandomForest | ~90%+ | General predictions (recommended) |
| SVC (Support Vector) | ~88%+ | Complex decision boundaries |
| GradientBoosting | ~89%+ | High-accuracy predictions |
| KNeighbors | ~85%+ | Instance-based learning |
| MultinomialNB | ~82%+ | Fast predictions |
| DecisionTree | ~80%+ | Interpretable results |
| LRegression | ~75%+ | Linear relationships |

### Model Architecture

1. **Input**: Binary symptom vector (1 if symptom present, 0 if absent)
2. **Processing**: Feature scaling and model inference
3. **Output**: Disease prediction with probability scores

### Model Files
- Located in: `d:\LifeLink ML\*.pkl`
- Format: Scikit-learn pickle format
- Loaded dynamically at runtime

---

## Data Files Reference

### CSV Data Files

#### 1. **symtoms_df.csv**
- Contains: Symptom definitions and descriptions
- Columns: `Symptom`, `Description`
- Purpose: Educate users about each symptom

#### 2. **description.csv**
- Contains: Disease descriptions
- Columns: `Disease`, `Description`
- Purpose: Provide medical information about predicted disease

#### 3. **precautions_df.csv**
- Contains: Preventive measures for each disease
- Columns: `Disease`, `Precaution_1`, `Precaution_2`, ...
- Purpose: Recommend preventive actions

#### 4. **medications.csv**
- Contains: Medication recommendations
- Columns: `Disease`, `Medication_1`, `Medication_2`, ...
- Purpose: Suggest appropriate medications

#### 5. **diets.csv**
- Contains: Dietary recommendations
- Columns: `Disease`, `Food_1`, `Food_2`, ...
- Purpose: Guide nutrition during illness

#### 6. **workout_df.csv**
- Contains: Exercise recommendations
- Columns: `disease`, `Exercise_1`, `Exercise_2`, ...
- Purpose: Suggest recovery exercises

### JSON Data Files

#### **all_accuracies.json**
```json
{
  "RandomForest": 0.92,
  "SVC": 0.88,
  "GradientBoosting": 0.89,
  "KNeighbors": 0.85,
  "MultinomialNB": 0.82,
  "DecisionTree": 0.80,
  "LRegression": 0.75
}
```

---

## Running the Application

### Full Setup Instructions

#### Terminal 1: Start the Backend API

```bash
# Navigate to project directory
cd d:\LifeLink\ ML

# Activate virtual environment (if created)
venv\Scripts\activate

# Start FastAPI server
python -m uvicorn api.index:app --reload --log-level debug
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

#### Terminal 2: Start the Frontend Server

```bash
# In new terminal, navigate to project directory
cd d:\LifeLink\ ML

# Start local HTTP server on port 5500
python -m http.server 5500
```

**Expected Output:**
```
Serving HTTP on 127.0.0.1 port 5500
```

#### Step 3: Open in Browser

```
http://127.0.0.1:5500/index/index.html
```

### Verification Checklist

- [ ] Backend API running on http://127.0.0.1:8000
- [ ] Frontend server running on http://127.0.0.1:5500
- [ ] All model files (.pkl) present in project root
- [ ] All CSV files present in project root
- [ ] Browser console shows no CORS errors
- [ ] Can access http://127.0.0.1:5500/index/index.html

---

## API Endpoints Guide

### 1. Health Check

**GET** `/api/health`

Check if API is running and get environment info.

**Response:**
```json
{
  "success": true,
  "status": "API is running",
  "python_environment": "Python 3.10 + scikit-learn 1.2.2"
}
```

---

### 2. Get Available Symptoms

**GET** `/api/symptoms`

Retrieve all available symptoms for prediction.

**Response:**
```json
{
  "success": true,
  "count": 132,
  "symptoms": [
    "itching",
    "skin_rash",
    "nodal_skin_eruptions",
    ...
  ]
}
```

---

### 3. Get Available Models

**GET** `/api/models`

Retrieve all available ML models.

**Response:**
```json
{
  "success": true,
  "models": [
    "RandomForest",
    "SVC",
    "GradientBoosting",
    "KNeighbors",
    "MultinomialNB",
    "DecisionTree",
    "LRegression"
  ]
}
```

---

### 4. Disease Prediction (Main Endpoint)

**POST** `/api/predict`

Make disease prediction based on selected symptoms and model.

**Request Body:**
```json
{
  "symptoms": ["fever", "cough", "fatigue"],
  "model": "RandomForest"
}
```

**Parameters:**
- `symptoms` (required): List of symptom strings
- `model` (optional): Model name (default: "RandomForest")

**Response (Success):**
```json
{
  "success": true,
  "disease": "Common Cold",
  "model": "RandomForest",
  "accuracy": 0.92,
  "symptoms": ["fever", "cough", "fatigue"],
  "description": "Common cold is a viral infection...",
  "precautions": [
    "Get adequate rest",
    "Stay hydrated",
    "Use humidifier"
  ],
  "medications": [
    "Paracetamol",
    "Antihistamine",
    "Decongestant"
  ],
  "diet": [
    "Warm soups",
    "Citrus fruits",
    "Honey"
  ],
  "workout": [
    "Light walking",
    "Stretching",
    "Yoga"
  ]
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Please select at least one symptom."
}
```

---

### 5. Root Endpoint

**GET** `/api`

Simple root check.

**Response:**
```json
{
  "success": true,
  "message": "LifeLink Health Diagnostics API is running"
}
```

---

## API Usage Examples

### Example 1: Python (requests library)

```python
import requests

# Symptoms to check
symptoms = ["fever", "cough", "fatigue"]
model = "RandomForest"

# Make request
response = requests.post(
    "http://127.0.0.1:8000/api/predict",
    json={
        "symptoms": symptoms,
        "model": model
    }
)

# Get results
result = response.json()
if result["success"]:
    print(f"Disease: {result['disease']}")
    print(f"Accuracy: {result['accuracy']}")
    print(f"Medications: {result['medications']}")
```

### Example 2: JavaScript (Fetch API)

```javascript
// Frontend code (already implemented in script.js)
const symptoms = ["fever", "cough", "fatigue"];
const model = "RandomForest";

fetch('http://127.0.0.1:8000/api/predict', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    symptoms: symptoms,
    model: model
  })
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log(`Disease: ${data.disease}`);
    console.log(`Accuracy: ${data.accuracy}`);
    displayResults(data);
  }
})
.catch(error => console.error('Error:', error));
```

### Example 3: cURL

```bash
curl -X POST http://127.0.0.1:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["fever", "cough", "fatigue"],
    "model": "RandomForest"
  }'
```

---

## Frontend Integration

### Prediction Flow in JavaScript

1. **Fetch Symptoms**: Call `/api/symptoms` to populate symptom list
2. **User Selection**: User selects symptoms from the UI
3. **Model Selection**: User chooses ML model (or uses default)
4. **Send Prediction**: POST request to `/api/predict`
5. **Display Results**: Show disease info, medications, diet, workout
6. **Save History**: Store in browser localStorage

### JavaScript Functions (in script.js)

```javascript
// Load available symptoms
async function loadSymptoms() {
  const response = await fetch('/api/symptoms');
  const data = await response.json();
  populateSymptomList(data.symptoms);
}

// Load available models
async function loadModels() {
  const response = await fetch('/api/models');
  const data = await response.json();
  populateModelDropdown(data.models);
}

// Make prediction
async function predict() {
  const symptoms = getSelectedSymptoms();
  const model = getSelectedModel();
  
  const response = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symptoms, model })
  });
  
  const result = await response.json();
  displayResults(result);
  saveToPredictionHistory(result);
}

// Save to browser history
function saveToPredictionHistory(result) {
  let history = JSON.parse(localStorage.getItem('predictions')) || [];
  history.unshift({
    ...result,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('predictions', JSON.stringify(history));
}
```

---

## Troubleshooting

### Issue 1: "ModuleNotFoundError" on startup

**Problem**: Missing dependencies
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution**:
```bash
pip install -r requirements.txt
# or individually:
pip install fastapi uvicorn pydantic pandas numpy scipy scikit-learn joblib
```

---

### Issue 2: Model files not found

**Problem**: 
```
FileNotFoundError: Model file not found: .../RandomForest.pkl
```

**Solution**:
1. Verify all `.pkl` files are in project root: `d:\LifeLink ML\*.pkl`
2. Check file naming matches exactly (case-sensitive on Linux)
3. Run from correct directory: `cd d:\LifeLink ML`

---

### Issue 3: CORS errors in browser console

**Problem**: 
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**:
1. Verify API is running with CORS enabled (it is by default)
2. Check correct API URL: `http://127.0.0.1:8000`
3. Check frontend URL: `http://127.0.0.1:5500`

---

### Issue 4: "Connection refused" when calling API

**Problem**: API server not running

**Solution**:
```bash
# Terminal 1: Start API
python -m uvicorn api.index:app --reload --log-level debug

# Wait for: "Application startup complete"
```

---

### Issue 5: Prediction returns "invalid symptoms"

**Problem**: Symptom names don't match

**Solution**:
1. Get symptom list: `curl http://127.0.0.1:8000/api/symptoms`
2. Use exact symptom names from the list
3. Note: Symptoms use underscores, not spaces (e.g., "skin_rash" not "skin rash")

---

### Issue 6: CSV files not loading

**Problem**:
```
FileNotFoundError: CSV file not found
```

**Solution**:
1. Verify CSV files exist in `d:\LifeLink ML\`
2. Check files: description.csv, precautions_df.csv, medications.csv, diets.csv, workout_df.csv
3. Ensure encoder.pkl and symptoms_list.pkl exist

---

### Debug Mode

Enable verbose logging:

```bash
python -m uvicorn api.index:app --reload --log-level debug
```

This shows:
- Model loading status
- Symptom validation
- Feature vector creation
- Prediction results
- Data retrieval steps

---

## Performance Optimization

### Model Loading
- Models are loaded dynamically when requested
- Consider caching frequently used models for faster predictions

### Data Loading
- CSV files loaded at startup (one-time cost)
- Using pandas for efficient data operations

### Prediction Latency
- Average prediction time: 50-200ms (model dependent)
- Binary feature vector creation: < 5ms
- Network latency: depends on browser/server distance

---

## Deployment

### Deployment on Vercel

The `vercel.json` file is configured for Vercel deployment:

```json
{
  "rewrites": [
    {
      "source": "/",
      "destination": "/index/index.html"
    }
  ]
}
```

### Steps for Deployment

1. **Backend (API)**: Deploy to serverless platform (Vercel, Heroku, Railway)
2. **Frontend (Static)**: Deploy to Vercel, Netlify, or GitHub Pages
3. **Update API URL**: Change base URL in frontend from localhost to deployed API

---

## Development Tips

### Adding a New Symptom

1. Retrain model with new symptom data
2. Update `symptoms_list.pkl`
3. Update training/testing CSV files
4. Retrain all models

### Adding a New Model

1. Train model using Training.csv
2. Save as `.pkl` file in project root
3. Add entry to `model_files` dict in `api/index.py`
4. Update `all_accuracies.json`

### Adding Disease Information

1. Add row to `description.csv` with disease and description
2. Add row to `precautions_df.csv` with precautions
3. Add row to `medications.csv` with medications
4. Add row to `diets.csv` with diet suggestions
5. Add row to `workout_df.csv` with exercises

---

## Security Considerations

- **CORS**: Currently allows all origins. For production, restrict to specific domains
- **Input Validation**: All symptoms are validated against known list
- **Model Protection**: Keep model files secure from unauthorized access
- **Data Privacy**: Consider HIPAA compliance for real healthcare use

---

## Support & References

### Key Technologies

- **FastAPI**: https://fastapi.tiangolo.com/
- **Scikit-learn**: https://scikit-learn.org/
- **Pandas**: https://pandas.pydata.org/
- **Uvicorn**: https://www.uvicorn.org/

### Project Structure

- **Backend**: API-first architecture using FastAPI
- **Frontend**: Vanilla JavaScript with responsive CSS
- **ML**: Scikit-learn models with pickle serialization
- **Data**: CSV-based disease and health information database

---

## Version Information

- **Project**: LifeLink Health Diagnostics v1.0.0
- **Python**: 3.9+
- **FastAPI**: 0.141.1
- **Scikit-learn**: 1.2.2
- **Status**: Production Ready

---

## Contact & Support

For issues or questions:
1. Check Troubleshooting section above
2. Review API endpoint documentation
3. Check console/terminal logs for errors
4. Verify all files and dependencies are installed correctly

---

**Last Updated**: 2024
**Status**: Complete Documentation
