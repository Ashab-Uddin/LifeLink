# 🩺 LifeLink — AI Health Diagnostics

LifeLink is an AI-powered health diagnostics web application that predicts possible diseases based on user-selected symptoms. It uses multiple machine-learning models and provides related disease information, precautions, medications, diet suggestions, and workout recommendations.

The project combines a responsive frontend with a FastAPI-based machine-learning backend and is deployed using Vercel and Render.

---

## 🌐 Live Application

### 🚀 Frontend
**Live Website:**  
[🌐 Open LifeLink](https://life-link-ui93.vercel.app/)

### ⚡ Backend API
**Render API:**  
[⚡ Open Backend API](https://lifelink-p8se.onrender.com/api)

### 📚 API Documentation
**Swagger Documentation:**  
[📚 Open API Documentation](https://lifelink-p8se.onrender.com/docs)

---

## ⚠️ Medical Disclaimer

LifeLink is an **educational AI-based decision-support application**.

The predictions and health information provided by this application are not medical diagnoses and should not replace professional medical advice, examination, or treatment from a qualified healthcare professional.

If you are experiencing a medical emergency, contact your local emergency service or seek immediate professional medical assistance.

---

## ✨ Features

- 🧠 AI-based disease prediction from symptoms
- 🔬 Multiple machine-learning classification models
- 🚀 XGBoost and LightGBM integration
- 🩺 Disease descriptions and health information
- 💊 Medication suggestions
- 🛡️ Precaution recommendations
- 🥗 Diet recommendations
- 🏃 Workout recommendations
- 🔎 Dynamic symptom selection
- 📊 Model accuracy information
- 📱 Responsive frontend
- 🕘 Browser-based prediction history using `localStorage`
- ⚡ FastAPI REST API
- 📖 Interactive Swagger API documentation
- ☁️ Vercel frontend deployment
- ☁️ Render backend deployment

---

# 🤖 Machine Learning Models

LifeLink currently supports **nine machine-learning models**:

| Model | Type |
|---|---|
| RandomForest | Random Forest Classifier |
| SVC | Support Vector Classifier |
| GradientBoosting | Gradient Boosting Classifier |
| KNeighbors | K-Nearest Neighbors |
| MultinomialNB | Multinomial Naive Bayes |
| DecisionTree | Decision Tree Classifier |
| XGBClassifier | XGBoost Classifier |
| LGBMClassifier | LightGBM Classifier |
| LRegression | Logistic Regression |

Model accuracy values are loaded from `all_accuracies.json`.

> **Note:** Model accuracy represents the evaluation performance of the model on the project's dataset. It does not represent the probability that a particular user has a disease.

---

# 🧠 How LifeLink Works

```text
User
  │
  ▼
Select Symptoms
  │
  ▼
Select Machine Learning Model
  │
  ▼
Frontend sends API request
  │
  ▼
FastAPI Backend
  │
  ▼
Validate Symptoms & Model
  │
  ▼
Create Binary Symptom Feature Vector
  │
  ▼
Selected ML Model
  │
  ▼
Predict Disease Class
  │
  ▼
Disease Label Encoder
  │
  ▼
Retrieve Disease Information
  │
  ├── Description
  ├── Precautions
  ├── Medications
  ├── Diet
  └── Workout
  │
  ▼
Display Result
```

---

# 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │       User          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Vercel Frontend    │
                    │ HTML/CSS/JavaScript │
                    └──────────┬──────────┘
                               │
                         HTTPS / REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Render Backend    │
                    │ FastAPI + Uvicorn   │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
          ML Models       Encoder/Data    Prediction
                │              │              │
                └──────────────┼──────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Prediction Result │
                    │ Disease Information │
                    └─────────────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Responsive Web Design
- Browser `localStorage`

## Backend

- Python 3.10
- FastAPI
- Uvicorn
- Pydantic

## Machine Learning

- Scikit-learn
- XGBoost
- LightGBM
- Joblib / Pickle

## Data Processing

- NumPy
- Pandas
- SciPy

## Deployment & Version Control

- Vercel — Frontend
- Render — Backend API
- Git
- GitHub

---

# 📂 Project Structure

```text
LifeLink/
│
├── api/
│   └── index.py
│
├── index/
│   └── Frontend HTML pages
│
├── js/
│   └── script.js
│
├── styles/
│   └── style.css
│
├── image/
│   └── Image assets
│
├── Training.csv
├── Testing.csv
├── Symptom-severity.csv
│
├── description.csv
├── precautions_df.csv
├── medications.csv
├── diets.csv
├── workout_df.csv
├── symtoms_df.csv
│
├── symptoms_list.pkl
├── encoder.pkl
│
├── RandomForest.pkl
├── SVC.pkl
├── GradientBoosting.pkl
├── KNeighbors.pkl
├── MultinomialNB.pkl
├── DecisionTree.pkl
├── LRegression.pkl
├── XGBClassifier.pkl
└── LGBMClassifier.pkl
│
├── all_accuracies.json
├── requirements.txt
├── vercel.json
│
├── API_REFERENCE.md
├── PROJECT_DOCUMENTATION.md
├── QUICK_START.md
├── SETUP_AND_DEPLOYMENT.md
├── USER_MANUAL.md
└── README.md
```

---

# 🔌 API

The LifeLink backend is powered by FastAPI and provides REST endpoints for communication between the frontend and machine-learning system.

## Base URL

[⚡ Open Backend API](https://lifelink-p8se.onrender.com/api)

## Available Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api` | Confirm that the API is running |
| GET | `/api/health` | Check API health |
| GET | `/api/symptoms` | Return available symptoms |
| GET | `/api/models` | Return available machine-learning models |
| POST | `/api/predict` | Predict a disease from symptoms |

---

## Prediction Request

Example:

```json
{
  "symptoms": [
    "itching",
    "skin_rash"
  ],
  "model": "XGBClassifier"
}
```

The `model` field is optional and defaults to `RandomForest`.

### XGBoost

```json
{
  "symptoms": ["itching", "skin_rash"],
  "model": "XGBClassifier"
}
```

### LightGBM

```json
{
  "symptoms": ["itching", "skin_rash"],
  "model": "LGBMClassifier"
}
```

---

## Prediction Response

A successful response contains:

```text
success
disease
model
accuracy
symptoms
description
precautions
medications
diet
workout
```

---

# 📖 API Documentation

**Interactive FastAPI Swagger Documentation:**  
[📖 Open Swagger UI](https://lifelink-p8se.onrender.com/docs)

The documentation allows developers to inspect endpoints and test API requests directly from a browser.

---

# 🕘 Prediction History

LifeLink stores prediction history in the user's browser using `localStorage`.

This allows users to review previous predictions without requiring a separate database account.

The stored history remains local to the user's browser.

---

# 📱 Responsive Design

The LifeLink frontend is designed for:

- 💻 Desktop
- 💻 Laptop
- 📱 Mobile
- 📟 Tablet

The interface adapts its layout and components based on screen size.

---

# ☁️ Deployment

LifeLink uses a separated frontend and backend deployment architecture.

### Frontend — Vercel

The responsive static frontend is deployed through Vercel.

```text
User Browser
     │
     ▼
Vercel Frontend
     │
     │ HTTPS API Requests
     ▼
Render Backend
```

### Backend — Render

The FastAPI machine-learning backend is deployed on Render.

**Production API:**  
[🔗 Open LifeLink API](https://lifelink-p8se.onrender.com/api)

This architecture allows the frontend and machine-learning backend to be deployed and maintained independently.

---

# 🧪 Machine Learning Data

The project includes datasets and supporting files used for disease prediction and health information.

### Main datasets

```text
Training.csv
Testing.csv
Symptom-severity.csv
```

### Health information

```text
description.csv
precautions_df.csv
medications.csv
diets.csv
workout_df.csv
symtoms_df.csv
```

### Model support files

```text
encoder.pkl
symptoms_list.pkl
all_accuracies.json
```

---

# 🔄 Frontend–Backend Integration

The frontend communicates with the FastAPI backend using HTTP requests.

```text
Frontend
   │
   ├── GET /api/symptoms
   │
   ├── GET /api/models
   │
   └── POST /api/predict
   │
   ▼
FastAPI Backend
   │
   ▼
Machine Learning Model
   │
   ▼
Prediction + Health Information
   │
   ▼
Frontend Result Interface
```

---

# 🎯 Project Goals

The main goals of LifeLink are:

1. Provide an easy-to-use symptom-based health prediction interface.
2. Demonstrate the practical use of machine learning in a healthcare-related application.
3. Integrate multiple classification algorithms into one application.
4. Provide supporting health information alongside predictions.
5. Build a responsive and accessible web interface.
6. Demonstrate real-world frontend, backend, machine-learning, and cloud deployment integration.

# 🔐 Security & Responsible Use

- LifeLink is not a replacement for professional medical advice.
- Do not use LifeLink as the sole basis for medical decisions.
- Do not use the application for emergency diagnosis or treatment decisions.
- Only load serialized model files from trusted sources.
- Production CORS settings should be restricted to trusted frontend origins.
- Avoid storing sensitive personal health information unnecessarily.

---

# 📚 Additional Documentation

| File | Description |
|---|---|
| `API_REFERENCE.md` | Detailed API reference |
| `PROJECT_DOCUMENTATION.md` | Complete project documentation |
| `QUICK_START.md` | Quick project overview |
| `SETUP_AND_DEPLOYMENT.md` | Deployment information |
| `USER_MANUAL.md` | End-user manual |
| `DOCUMENTATION_INDEX.md` | Documentation navigation |

---
## 👥 Contributors

LifeLink was collaboratively designed and developed by:

| Contributor |
|-------------|
| **Ashab Uddin** |
| **Rokunuzamman Topu** |
| **Modabbir Mohammad Mansur** |

# 📄 License

No open-source license has currently been declared for this repository.

If the project is intended for public distribution or reuse, an appropriate license should be added.

---

# ❤️ LifeLink

**LifeLink — Connecting Symptoms with Intelligent Health Insights.**

Built with ❤️ using **Python, FastAPI, Machine Learning, HTML, CSS, JavaScript, Vercel, Render, and GitHub.**
