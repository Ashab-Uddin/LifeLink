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
The LifeLink project uses a branch-based GitHub workflow so multiple contributors can work on different features without affecting the stable main branch. Each contributor should work on their assigned feature, test it, and submit it through a Pull Request for review.

### 📥 1. Clone the Repository

```bash
git clone https://github.com/Ashab-Uddin/LifeLink.git
cd LifeLink
```

Check the available branches:

```bash
git branch
```

The main development branch is:

```text
main
```

---

### 🔄 2. Get the Latest `main` Branch

Before starting any new work:

```bash
git checkout main
git pull origin main
```

This ensures that the contributor is working with the latest version of LifeLink.

---

### 🌿 3. Create a Feature Branch

Contributors should **not develop features directly on `main`**.

```bash
git checkout -b feature/your-feature-name
```

Examples:

```bash
git checkout -b feature/blood-donation
git checkout -b feature/user-profile
git checkout -b feature/doctor-search
git checkout -b feature/health-dashboard
git checkout -b feature/donor-search
```

---

### 💻 4. Develop the Assigned Feature

Work only on the feature assigned to you.

For example, a contributor working on the **Blood Donation** feature may modify:

```text
blood-donation.html
blood-donation.js
related CSS files
Bangladesh location data
Supabase donor functionality
```

Avoid unnecessarily changing unrelated files because this can create merge conflicts.

---

### 🧪 5. Test Before Committing

Every contributor should test their changes locally before pushing them to GitHub.

Check:

- HTML functionality
- CSS styling
- JavaScript functionality
- Responsive design
- Form validation
- Supabase database operations
- Authentication functionality
- Image upload functionality
- API requests
- Browser console errors
- Existing project features

Make sure the new feature does not break functionality created by other contributors.

---

### 🔍 6. Check Your Changes

```bash
git status
```

Review the exact changes:

```bash
git diff
```

Make sure only the required files and changes are included.

---

### 💾 7. Commit Your Changes

```bash
git add .
git commit -m "Add blood donation feature"
```

Good commit messages:

```text
Add user profile image upload
Fix login form validation
Add blood donation location filters
Update responsive profile design
Add Division District Upazila selection
Fix donor registration form
Add user profile management
```

Avoid unclear messages such as:

```text
update
changes
final
test
done
```

---

### ⬆️ 8. Push the Feature Branch

```bash
git push origin feature/blood-donation
```

For another feature:

```bash
git push origin feature/user-profile
```

---

### 🔃 9. Create a Pull Request

After pushing the feature branch:

1. Open the LifeLink repository on GitHub.
2. Click **Compare & pull request**.
3. Set the base branch to `main`.
4. Set the compare branch to your feature branch.
5. Add a meaningful Pull Request title.
6. Describe the changes.
7. Mention how the feature was tested.
8. Create the Pull Request.

Example:

```text
base: main
compare: feature/blood-donation
```

---

### 📝 Pull Request Example

**Title:**

```text
Add Blood Donation Location Selection
```

**Description:**

```md
## Changes

- Added blood donation registration form
- Added Division selection
- Added District selection
- Added Upazila selection
- Added dependent location dropdowns
- Added donor form validation
- Integrated Supabase donor data submission

## Testing

- Tested Division → District → Upazila selection
- Tested form validation
- Tested responsive layout
- Tested Supabase data submission
- Checked browser console for errors
```

---

### 👀 10. Code Review

Every Pull Request should be reviewed before being merged into `main`.

The reviewer should check:

#### Functionality

- Does the new feature work correctly?
- Does it meet the assigned requirements?
- Are there JavaScript or backend errors?

#### Design

- Does it follow the existing LifeLink design?
- Does it maintain the existing `style.css`?
- Does it work correctly on desktop and mobile?

#### Integration

- Does the new feature affect existing functionality?
- Are file paths correct?
- Are JavaScript and CSS files correctly linked?

#### Supabase

- Are database queries correct?
- Are authentication operations working?
- Are Storage operations working?
- Are Row Level Security policies respected?

#### Security

- Are passwords or API secrets exposed?
- Is a `.env` file included?
- Is a Supabase service-role key exposed?
- Are private credentials committed?

---

### 🔁 11. Making Changes After Code Review

If the reviewer requests changes, make them on the **same feature branch**.

```bash
git checkout feature/blood-donation
git add .
git commit -m "Fix review feedback"
git push origin feature/blood-donation
```

The existing Pull Request will automatically update.

---

### 🔄 12. Keep Your Branch Updated

If `main` has changed while you are working:

```bash
git checkout main
git pull origin main
git checkout feature/blood-donation
git merge main
```

Test the project again after the merge.

If everything works:

```bash
git push origin feature/blood-donation
```

---

### 🔀 13. Handling Merge Conflicts

A merge conflict may occur when two contributors modify the same part of the same file.

Git may show:

```text
<<<<<<< HEAD
Your changes
=======
Changes from main
>>>>>>> main
```

To resolve the conflict:

1. Open the affected file.
2. Decide which changes should remain.
3. Combine the required code if necessary.
4. Remove the conflict markers.
5. Save the file.
6. Test the project.

Then:

```bash
git add .
git commit -m "Resolve merge conflicts"
git push origin feature/blood-donation
```

The Pull Request will update automatically.

---

### ✅ 14. Approving and Merging the Pull Request

Once the feature has been reviewed and tested:

```text
Feature Branch
      ↓
Pull Request
      ↓
Code Review
      ↓
Testing
      ↓
Approval
      ↓
Merge into main
```

Only approved and working code should be merged into `main`.

---

### 🗑️ 15. Deleting a Merged Branch

After a Pull Request has been successfully merged:

```bash
git branch -d feature/blood-donation
git push origin --delete feature/blood-donation
```

---

### 🔄 16. Starting a New Feature

Always start the next feature from the latest `main`:

```bash
git checkout main
git pull origin main
git checkout -b feature/new-feature
```

---

## 🚫 Important Rules for All Collaborators

### Do Not Directly Push Feature Work to `main`

Avoid:

```bash
git push origin main
```

for normal feature development.

Instead:

```bash
git checkout -b feature/your-feature
git push origin feature/your-feature
```

All feature work should go through a Pull Request.

### Do Not Upload Secrets

Never commit:

```text
.env
Passwords
Private API keys
Supabase service-role keys
Database credentials
Render secrets
Private tokens
```

### Do Not Commit Virtual Environments

Never push:

```text
venv/
venv310/
.venv/
```

### Do Not Overwrite Another Contributor's Work

Before making major changes to shared files, communicate with the team.

### Keep Commits Focused

Each commit should represent one logical change whenever possible.

### Test Before Creating a Pull Request

Do not submit untested code to the `main` branch.

### Keep `main` Stable

The `main` branch should contain only reviewed and working code.

---

## 📌 Recommended Branch Structure

```text
main
│
├── feature/user-profile
├── feature/blood-donation
├── feature/doctor-search
├── feature/health-dashboard
└── feature/donor-search
```

| Branch | Purpose |
|---|---|
| `main` | Stable and tested project |
| `feature/user-profile` | User profile development |
| `feature/blood-donation` | Blood donation functionality |
| `feature/doctor-search` | Doctor search functionality |
| `feature/health-dashboard` | Health dashboard development |
| `feature/donor-search` | Donor search functionality |

---

## 🚀 LifeLink Collaboration Workflow

```text
                     GitHub Repository
                            │
                           main
                            │
                 ┌──────────┴──────────┐
                 ↓                     ↓
         Contributor A          Contributor B
                 ↓                     ↓
          Feature Branch          Feature Branch
                 ↓                     ↓
             Develop                Develop
                 ↓                     ↓
               Test                  Test
                 ↓                     ↓
              Commit               Commit
                 ↓                     ↓
               Push                 Push
                 ↓                     ↓
          Pull Request          Pull Request
                 └──────────┬──────────┘
                            ↓
                       Code Review
                            ↓
                         Testing
                            ↓
                         Approval
                            ↓
                      Merge into main
                            ↓
                    Production Version
```

---

## 🔧 Complete Contributor Command Workflow

```bash
# Get the latest project
git checkout main
git pull origin main

# Create a feature branch
git checkout -b feature/your-feature

# Develop and test your feature

# Check your changes
git status
git diff

# Add changes
git add .

# Commit changes
git commit -m "Describe your changes"

# Push the feature branch
git push origin feature/your-feature

# Create a Pull Request on GitHub

# Make any requested review changes

# Push the updated branch

# After approval, merge the Pull Request into main

# Start the next feature from the latest main
git checkout main
git pull origin main
```

---

## 🌐 Deployment Workflow

After approved changes are merged into `main`, the updated project can be deployed through the configured deployment services.

```text
Contributor
     ↓
Feature Branch
     ↓
GitHub Pull Request
     ↓
Code Review
     ↓
Testing
     ↓
Merge into main
     ↓
Vercel / Render Deployment
     ↓
Updated LifeLink Application
```

Contributors should not directly modify production deployment settings unless they are specifically assigned deployment or DevOps responsibilities.

---

## 🎯 Collaboration Principles

The LifeLink team follows these principles:

- **`main` = stable and tested code**
- **Feature branches = individual development**
- **Pull Requests = review and integration**
- **Clear commits = easier project management**
- **Testing = required before merging**
- **Communication = important for shared files**
- **Security = never expose credentials**
- **Review = required before production integration**

Following this workflow allows multiple contributors to work on LifeLink simultaneously while reducing merge conflicts, accidental changes, broken features, and production problems.


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
