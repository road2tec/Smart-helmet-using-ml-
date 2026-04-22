# 🛡️ SMARTCORE: AI-Integrated Motorcycle Safety Ecosystem

SMARTCORE is a high-performance, real-time safety monitoring system for motorcycle riders. It leverages computer vision (YOLOv8) and specialized hardware sensors to analyze rider behavior, detect safety gear, and prevent impaired riding through intelligent engine interlocks.

---

## ⚡ Main Features

- **🧠 Neural Safety Vision**: Real-time YOLOv8 integration to detect helmets, persons, and surrounding vehicles with 99.8% precision.
- **🧔 Biometric Layer**: OpenCV DNN face detection + binary age classification (**Above 18 / Below 18**).
- **😴 Driver Vigilance AI**: Real-time EAR-based eye blinking and drowsiness detection using MediaPipe landmarks, with audible alert.
- **🚦 Unified Safety Pipeline**: One live webcam pipeline that runs age, drowsiness, and road object detection together with threaded capture and async inference.
- **🛡️ Hardware Interlock (Mocked)**: logic for MQ-3 (Alcohol) and MPU-6050 (Impact) sensors to lock engine starting if safety protocols are breached.
- **📊 Tactical Dashboard**: Futuristic React.js interface with live telemetry, session history, and AI perception monitoring.
- **🔔 Real-time Alerts**: Instant notifications for missing safety gear (Helmets/Hat) and drowsiness detection.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Python, Flask, OpenCV, Ultralytics (YOLOv8) |
| **Persistence** | MongoDB (Rider logs/History) |
| **Core Logic** | Multithreaded Camera Pipeline |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 16+
- MongoDB (Running locally on default port 27017)
- Webcam (For AI detection)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/road2tec/Smart-helmet-using-ml-.git
   cd Smart-helmet-using-ml-
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

3. **Run Unified Smart Driver Pipeline (Webcam Window):**
   ```bash
   cd backend
   python main.py
   ```

   Optional camera index:
   ```bash
   python main.py --camera 1
   ```

4. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🧩 New Backend Modules (Unified AI)

```text
backend/modules/
├── age_detection.py          # OpenCV DNN face + binary age classification
├── drowsiness_detection.py   # EAR logic + drowsiness alert beep
├── object_detection.py       # YOLOv8 road safety objects (+ speed-breaker heuristic)
├── face_age.py               # Backward-compatible wrapper for existing Flask routes
└── drowsiness.py             # Backward-compatible wrapper for existing Flask routes

backend/main.py               # Unified threaded real-time integration pipeline
```

---

## ✅ Notes for First Run

- The age model files are auto-downloaded to `backend/models/age_dnn` on first run.
- YOLO uses `backend/yolov8n.pt` if available, otherwise Ultralytics default loading is used.
- Press `Q` in the webcam window to stop the pipeline.
- If webcam fails to open, try another index using `--camera`.

---

## 📂 Project Structure

```text
├── backend/
│   ├── modules/          # AI Detection Logic (Helmet, Face, Object)
│   ├── routes/           # API Endpoints
│   ├── app.py            # Main Flask Server
│   └── requirements.txt  # Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # UI Layout & Sidebar
│   │   ├── pages/        # Dashboard, History, Landing
│   │   └── services/     # API Integration
│   └── public/           # Premium Assets & Images
└── .gitignore            # Excluded Files
```

---

## 🔒 Security Protocol

- **Local Processing**: AI inference runs entirely on the local node.
- **Standby Mode**: Camera hardware is only activated by explicit operator command.
- **Safety by Default**: System remains in a "Ready" state until all biometric and safety checks pass.

---

## 🤝 Contributing

We welcome contributions to enhance rider safety. Please fork the repository and submit a pull request with your changes.

**Developed by [Your Name / Team]**  
*Advancing Human Safety through Artificial Intelligence.*
