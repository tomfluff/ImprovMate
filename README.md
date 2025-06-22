# ImprovMate

AI-assisted imporvisation practice tool for actors. Based on the [MyStoryKnight](https://tomfluff.github.io/MyStoryKnight/) project. 

## Description

ImprovMate is an AI-powered improvisation practice tool designed to help actors refine their skills in a dynamic and engaging way. By leveraging advancements in artificial intelligence, particularly large language models (LLMs), ImprovMate provides a seamless and intuitive platform for individual improv training, addressing the limitations of traditional group-based methods.

The system uses multimodal input, such as an actor’s audiovisual performance, to generate characters, objects, and scenarios that mimic the unpredictability of live performances. It tracks narrative elements throughout a session, ensuring coherence while reducing cognitive load. ImprovMate also incorporates structured exercises inspired by traditional improv training techniques, fostering creativity and supporting actors of all experience levels.

Key features of ImprovMate include:

- **Dynamic Scenario Generation**: AI-generated characters, objects, and plot points to simulate real-time improvisation challenges.
- **Narrative Coherence**: Tracks and maintains consistent plot threads throughout the session.
- **Structured Training**: Exercises based on proven improv techniques to enhance creativity and adaptability.
- **Seamless Integration**: Requires no additional equipment for speech or motion recording, ensuring minimal setup and overhead.
- **Accessibility**: Supports both traditional improv practice and AI-driven randomness to inspire new ideas.

ImprovMate is designed to empower actors by providing a flexible, creative, and effective tool for honing their improvisational skills, whether they are beginners or seasoned professionals.

---

## Running the application

### Prerequisites

- Docker Desktop

### Steps

1. Clone the repository
2. Inside `backend` and `frontend`, copy `.env.example` to `.env` and fill in the necessary environment variables.
3. Run the following command in the root directory of the repository

```bash
docker-compose up
```

1. Open a web browser and navigate to `http://localhost:3000`
2. Access the backend API at `http://localhost:5000/api`

## Structure

```
ImprovMate/
├── frontend                # Frontend code (React)
|  ├── Dockerfile           # Dockerfile for frontend
├── backend                 # Backend code (Flask)
|  ├── Dockerfile           # Dockerfile for backend
├── docker-compose.yml      # Docker compose file
└── README.md               # This file
```

## Dockerizing

### Backend

In `app.py`, need to set the host to `0.0.0.0` to allow the container to access the host's network.

```python
if __name__ == '__main__':
    app.run(host='0.0.0.0')
```

### Frontend

In `vite.config.ts` need to set the following settings:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react()],
  preview: {
    port: 8080,
    strictPort: true,
  },
  server: {
    port: 8080,
    strictPort: true,
    host: true,
    origin: "http://127.0.0.1:8080", // Correctly load assets
  },
});
```
## Deployment
### Backend
1. Navigate to the `backend` directory
2. Deploy the backend using the following command
```bash
gcloud run deploy SERVICE --source .
```
3. Set the environment variables in the Google Cloud Console

#### Notes
- Make sure the active project is the correct one with the following commands
```bash
gcloud projects list
gcloud config get project
gcloud config set project PROJECT_ID
```
- The Cloud run service name should be `improvmate-be`.
- The region should be set to `us-central1`.
  
### Frontend
1. Navigate to the `frontend` directory
2. Make sure to update the `.env` file with the correct `VITE_API_BASE_URL` based on the backend service URL.
3. Deploy the frontend using the following commands
```bash
npm run predeploy
npm run deploy
```
1. This will deploy to the `gh-pages` branch of the repository.

