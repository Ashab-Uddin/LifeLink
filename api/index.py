from disease_department import DISEASE_TO_DEPARTMENT
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import pandas as pd
import numpy as np
import pickle
import json
import os
import traceback
from pathlib import Path

# Project root: D:/LifeLink ML when this file is inside /api/index.py
BASE_DIR = Path(__file__).resolve().parent.parent


# =========================================================
# FastAPI App
# =========================================================

app = FastAPI(
    title="LifeLink Health Diagnostics API",
    description="Machine Learning Based Disease Prediction API",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# Model Files
# =========================================================

model_files = {
    "RandomForest": {
        "file": "RandomForest.pkl",
        "type": "pickle"
    },
    "SVC": {
        "file": "SVC.pkl",
        "type": "pickle"
    },
    "GradientBoosting": {
        "file": "GradientBoosting.pkl",
        "type": "pickle"
    },
    "KNeighbors": {
        "file": "KNeighbors.pkl",
        "type": "pickle"
    },
    "MultinomialNB": {
        "file": "MultinomialNB.pkl",
        "type": "pickle"
    },
    "DecisionTree": {
        "file": "DecisionTree.pkl",
        "type": "pickle"
    },
    "XGBClassifier": {
        "file": "XGBClassifier.pkl",
        "type": "pickle"
    },
    "LGBMClassifier": {
        "file": "LGBMClassifier.pkl",
        "type": "pickle"
    },
    "LRegression": {
        "file": "LRegression.pkl",
        "type": "pickle"
    }
}


# =========================================================
# Load Encoder
# =========================================================

print("=" * 60)
print("Starting LifeLink Health Diagnostics API")
print("=" * 60)

print("Loading encoder.pkl...")

try:
    with open(BASE_DIR / "encoder.pkl", "rb") as f:
        le = pickle.load(f)

    print("Encoder loaded successfully.")

except Exception as e:
    print("ERROR loading encoder.pkl:")
    print(e)
    raise


# =========================================================
# Load Symptoms
# =========================================================

print("Loading symptoms_list.pkl...")

try:
    with open(BASE_DIR / "symptoms_list.pkl", "rb") as f:
        symptoms = pickle.load(f)

    symptoms = list(symptoms)

    print("Symptoms loaded successfully.")
    print("Number of symptoms:", len(symptoms))

except Exception as e:
    print("ERROR loading symptoms_list.pkl:")
    print(e)
    raise


# =========================================================
# Load Health Information
# =========================================================

print("Loading CSV files...")

try:
    sym_des = pd.read_csv(BASE_DIR / "symtoms_df.csv")
    precautions = pd.read_csv(BASE_DIR / "precautions_df.csv")
    workout = pd.read_csv(BASE_DIR / "workout_df.csv")
    description = pd.read_csv(BASE_DIR / "description.csv")
    medications = pd.read_csv(BASE_DIR / "medications.csv")
    diets = pd.read_csv(BASE_DIR / "diets.csv")
    labaid_doctors = pd.read_csv(
        BASE_DIR / "LABAID_Specialized_Hospital_Doctors.csv",
        dtype={"Phone Number": str})

    print("CSV files loaded successfully.")

except Exception as e:
    print("ERROR loading CSV files:")
    print(e)
    raise


print("Loading doctors CSV...")

try:
    doctors_df = pd.read_csv(
        BASE_DIR / "LABAID_Specialized_Hospital_Doctors.csv",
        dtype={"Phone Number": str})
    print("Doctors CSV loaded successfully. Rows:", len(doctors_df))
except Exception as e:
    print("ERROR loading doctors CSV:")
    print(e)
    doctors_df = pd.DataFrame()

# =========================================================
# Model Accuracies
# =========================================================

accuracy_file = BASE_DIR / "all_accuracies.json"

if os.path.exists(accuracy_file):

    try:
        with open(accuracy_file, "r") as f:
            model_accuracies = json.load(f)

        print("Model accuracies loaded.")

    except Exception as e:
        print("Could not load all_accuracies.json:")
        print(e)
        model_accuracies = {}

else:
    print("all_accuracies.json not found.")
    model_accuracies = {}


# =========================================================
# Model Loader
# =========================================================

def load_dynamic_model(model_name):

    print()
    print("-" * 50)
    print("Loading model:", model_name)
    print("-" * 50)

    info = model_files.get(model_name)

    if not info:
        raise ValueError(
            f"Model '{model_name}' not found."
        )

    model_path = BASE_DIR / info["file"]

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Model file not found: {model_path}"
        )

    if info["type"] == "pickle":

        with open(model_path, "rb") as f:
            model = pickle.load(f)

        print(model_name, "loaded successfully.")

        return model

    raise ValueError(
        f"Unsupported model type: {info['type']}"
    )


# Disease terms are matched to the closest Labaid department. Medicine is the
# fallback for conditions that do not need a narrower specialty.
DOCTOR_DEPARTMENT_RULES = [
    ("gynaecology & obstetrics", ("pregnan", "pregnancy", "menstrual", "period",
     "ovarian", "uterine", "vaginal", "cervical", "endometriosis", "infertility", "pcos")),
    ("paediatrics", ("chickenpox", "measles",
     "mumps", "pediatric", "paediatric", "child")),
    ("cardiology", ("heart", "cardiac", "cardiovascular", "hypertension", "cholesterol")),
    ("neurology", ("migraine", "epilepsy", "paralysis",
     "parkinson", "neurolog", "headache", "dizziness")),
    ("neurosurgery", ("brain tumor", "brain tumour", "spinal", "stroke")),
    ("nephrology", ("kidney", "renal", "urinary tract", "uti")),
    ("hepatology", ("hepatitis", "liver", "jaundice")),
    ("gastroenterology", ("gastric", "gastro",
     "stomach", "ulcer", "intestinal", "digestive")),
    ("dermatology", ("skin", "acne", "dermat", "rash", "psoriasis", "impetigo")),
    ("ophthalmology", ("eye", "vision", "cataract", "glaucoma")),
    ("ent", ("ear", "nose", "throat", "sinus", "tonsill", "hearing")),
    ("orthopaedic surgery", ("bone", "joint",
     "arthritis", "fracture", "orthop", "muscle")),
    ("pain medicine & rheumatology", ("rheumat", "gout", "back pain", "neck pain")),
    ("urology", ("prostate", "urolog", "bladder")),
    ("oncology", ("cancer", "tumor", "tumour", "leukemia", "lymphoma")),
    ("pulmonology / medicine", ("asthma", "lung",
     "pneumonia", "bronch", "tuberculosis", "tb")),
]


def get_recommended_doctors(disease=None):
    disease_text = str(disease or "").strip().lower()
    department = "medicine"

    for candidate_department, terms in DOCTOR_DEPARTMENT_RULES:
        if any(term in disease_text for term in terms):
            department = candidate_department
            break

    department_aliases = {
        "gynaecology & obstetrics": "gynaecology",
        "paediatrics": "paediatric",
        "ent": "ent",
    }
    department_term = department_aliases.get(department, department)
    department_series = labaid_doctors["Department"].str.lower()
    if department == "ent":
        department_matches = labaid_doctors[department_series ==
                                            department_term]
    else:
        department_matches = labaid_doctors[
            department_series.str.contains(department_term, na=False)
        ]
    if department_matches.empty:
        department_matches = labaid_doctors[
            labaid_doctors["Department"].str.lower(
            ).str.contains("medicine", na=False)
        ]

    return [
        {
            "department": str(row["Department"]),
            "name": str(row["Doctor Name"]),
            "specialty": str(row["Specialty"]),
            "designation": str(row["Designation"]),
            "phone": str(row["Phone Number"]) if "Phone Number" in row else None,
        }
        for _, row in department_matches.iterrows()
    ]


# =========================================================
# Request Model
# =========================================================

class PredictionRequest(BaseModel):

    symptoms: list[str]

    model: str = "RandomForest"


# =========================================================
# Root
# =========================================================

@app.get("/api")
def root():

    return {
        "success": True,
        "message": "LifeLink Health Diagnostics API is running"
    }


# =========================================================
# Health Check
# =========================================================

@app.get("/api/health")
def health():

    return {
        "success": True,
        "status": "API is running",
        "python_environment": "Python 3.10 + scikit-learn 1.2.2"
    }


# =========================================================
# Get Symptoms
# =========================================================

@app.get("/api/symptoms")
def get_symptoms():

    return {
        "success": True,
        "count": len(symptoms),
        "symptoms": list(symptoms)
    }


# =========================================================
# Get Models
# =========================================================

@app.get("/api/models")
def get_models():

    return {
        "success": True,
        "models": list(model_files.keys())
    }


# =========================================================
# Prediction
# =========================================================

@app.get("/api/doctors")
def get_doctors(disease: str = None, department: str = None,
                hospital: str = None):

    try:
        if doctors_df.empty:
            return {"success": False, "message": "Doctor data not available."}

        target_hospital = str(hospital or "LABAID Hospital").strip()
        if "Hospital" in doctors_df.columns:
            matches = doctors_df[
                doctors_df["Hospital"].str.casefold(
                ) == target_hospital.casefold()
            ]
        elif target_hospital.casefold() == "labaid hospital":
            matches = doctors_df
        else:
            matches = doctors_df.iloc[0:0]

        target_department = department

        if disease and not target_department:
            target_department = DISEASE_TO_DEPARTMENT.get(disease)

        if target_department:
            matches = matches[
                matches["Department"].str.contains(
                    target_department, case=False, na=False)
            ]

        if matches.empty:
            matches = matches[
                matches["Department"].str.contains(
                    "Medicine", case=False, na=False)
            ]

        doctor_list = matches.to_dict(orient="records")

        return {
            "success": True,
            "disease": disease,
            "hospital": target_hospital,
            "matched_department": target_department,
            "count": len(doctor_list),
            "doctors": doctor_list
        }

    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": type(e).__name__, "message": str(e)}


@app.post("/api/predict")
def predict(data: PredictionRequest):

    print()
    print("=" * 60)
    print("PREDICT ENDPOINT CALLED")
    print("=" * 60)

    print("Received symptoms:", data.symptoms)
    print("Selected model:", data.model)

    try:

        # -------------------------------------------------
        # Get input
        # -------------------------------------------------

        selected_symptoms = data.symptoms
        selected_model = data.model

        # -------------------------------------------------
        # Validate symptoms
        # -------------------------------------------------

        if not selected_symptoms:

            return {
                "success": False,
                "message": "Please select at least one symptom."
            }

        invalid_symptoms = [
            symptom
            for symptom in selected_symptoms
            if symptom not in symptoms
        ]

        if invalid_symptoms:

            return {
                "success": False,
                "message": "Some symptoms are not recognized.",
                "invalid_symptoms": invalid_symptoms
            }

        # -------------------------------------------------
        # Validate model
        # -------------------------------------------------

        if selected_model not in model_files:

            return {
                "success": False,
                "message": "Invalid model selected.",
                "available_models": list(model_files.keys())
            }

        # -------------------------------------------------
        # Create binary feature vector
        # -------------------------------------------------

        print("Creating binary symptom vector...")

        input_data = [
            1 if symptom in selected_symptoms else 0
            for symptom in symptoms
        ]

        print("Feature count:", len(input_data))

        # -------------------------------------------------
        # Create DataFrame
        # -------------------------------------------------

        df = pd.DataFrame(
            [input_data],
            columns=symptoms
        )

        print("DataFrame shape:", df.shape)

        # -------------------------------------------------
        # Load selected model
        # -------------------------------------------------

        model = load_dynamic_model(
            selected_model
        )

        # -------------------------------------------------
        # Prediction
        # -------------------------------------------------

        print("Running model.predict()...")

        predicted_class_index = model.predict(df)[0]

        print(
            "Predicted class:",
            predicted_class_index
        )

        # -------------------------------------------------
        # Decode Disease
        # -------------------------------------------------

        disease = le.inverse_transform(
            [predicted_class_index]
        )[0]

        print(
            "Predicted disease:",
            disease
        )

        # -------------------------------------------------
        # Accuracy
        # -------------------------------------------------

        accuracy = model_accuracies.get(
            selected_model,
            None
        )

        # =================================================
        # Description
        # =================================================

        desc = description[
            description["Disease"] == disease
        ]["Description"].values

        if len(desc):
            disease_description = desc[0]
        else:
            disease_description = "No description available."

        # =================================================
        # Precautions
        # =================================================

        pre = precautions[
            precautions["Disease"] == disease
        ]

        if not pre.empty:

            precaution_list = (
                pre.iloc[0, 1:]
                .dropna()
                .tolist()
            )

        else:
            precaution_list = []

        # =================================================
        # Medications
        # =================================================

        meds = medications[
            medications["Disease"] == disease
        ]

        if not meds.empty:

            medication_list = (
                meds.iloc[0, 1:]
                .dropna()
                .tolist()
            )

        else:
            medication_list = []

        # =================================================
        # Diet
        # =================================================

        diet = diets[
            diets["Disease"] == disease
        ]

        if not diet.empty:

            diet_list = (
                diet.iloc[0, 1:]
                .dropna()
                .tolist()
            )

        else:
            diet_list = []

        # =================================================
        # Workout
        # =================================================

        wrk = workout[
            workout["disease"] == disease
        ]

        if not wrk.empty:

            workout_list = (
                wrk.iloc[0, 1:]
                .dropna()
                .tolist()
            )

        else:
            workout_list = []

        # =================================================
        # Final Response
        # =================================================

        result = {

            "success": True,

            "disease": str(disease),

            "model": str(selected_model),

            "accuracy": (
                float(accuracy)
                if accuracy is not None
                else None
            ),

            "symptoms": [
                str(item)
                for item in selected_symptoms
            ],

            "description": str(
                disease_description
            ),

            "precautions": [
                str(item)
                for item in precaution_list
            ],

            "medications": [
                str(item)
                for item in medication_list
            ],

            "diet": [
                str(item)
                for item in diet_list
            ],

            "workout": [
                str(item)
                for item in workout_list
            ],

            "doctors": get_recommended_doctors(disease)
        }

        print()
        print("PREDICTION SUCCESSFUL")
        print("Disease:", disease)
        print("Model:", selected_model)
        print("=" * 60)
        print()

        return result

    except Exception as e:

        print()
        print("=" * 60)
        print("!!! PREDICTION ERROR !!!")
        print("=" * 60)

        print("Error type:", type(e).__name__)
        print("Error message:", str(e))

        print()
        print("Full traceback:")

        traceback.print_exc()

        print("=" * 60)
        print()

        return {
            "success": False,
            "error": type(e).__name__,
            "message": str(e)
        }
