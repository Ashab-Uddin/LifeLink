LifeLink Modern Frontend

1. Copy the index, styles, and js folders into your existing LifeLink frontend.
2. Keep your image folder if you want to preserve the existing image assets.
3. Start FastAPI:
   python -m uvicorn backend:app --reload --log-level debug
4. Start the frontend from the frontend root:
   python -m http.server 5500
5. Open:
   http://127.0.0.1:5500/index/index.html

The AI Prediction page connects to:
   http://127.0.0.1:8000/symptoms
   http://127.0.0.1:8000/predict

The current design uses a professional healthcare visual system, responsive layout, animations, prediction loading state, result cards, and browser-local prediction history.
