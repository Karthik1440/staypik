# Staypik - Production Deployment Guide

This guide details the configurations and steps required to build and deploy the Staypik application in a production environment.

## 1. Backend Deployment (Django API)

Deploy the directory `staypik/backend/core` to a web application service (such as Render, Railway, or Heroku).

### Build Command
```bash
pip install -r requirements.txt && python manage.py migrate
```

### Start Command (defined in `Procfile`)
```bash
gunicorn core.wsgi
```

### Environment Variables
Configure the following variables in your hosting provider's dashboard:

| Variable Name | Description | Example / Default Value |
| :--- | :--- | :--- |
| `DEBUG` | Disables django development debug mode in production. | `False` |
| `SECRET_KEY` | A long, secure, randomized string for cryptographic signing. | `your-secure-random-key` |
| `DATABASE_URL` | The PostgreSQL database connection URI. | `postgres://user:password@host:port/dbname` |
| `REQUIRE_OWNER_APPROVAL` | Determines if owner registrations need admin approval. | `True` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name for media file storage. | `your_cloudinary_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key. | `your_cloudinary_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret. | `your_cloudinary_api_secret` |
| `FIREBASE_CREDENTIALS` | The entire Firebase service account JSON object parsed as a string. | `{"type": "service_account", ...}` |

---

## 2. Frontend Deployment (Vite + React)

Deploy the directory `staypik/frontend` to a static web hosting platform (such as Vercel, Netlify, Render Static Site, or Firebase Hosting).

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `build` (defined in `vite.config.js`)

### Environment Variables
Configure the following variable in your hosting provider's static environment:

| Variable Name | Description | Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Points to the live backend URL. | `https://your-backend-app.render.com/api` |
