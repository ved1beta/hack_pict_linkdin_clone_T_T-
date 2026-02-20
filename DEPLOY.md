# Deployment Guide

## Dockerfile locations

- **Repo root** (`/Dockerfile`): Use when your platform builds from the repo root. Build context = repo root.
- **main/** (`/main/Dockerfile`): Use when your platform uses `main` as the root directory. Set "Root Directory" to `main` in your hosting platform.

## Environment variables

Set these in your hosting platform (Railway, Render, Vercel, etc.):

- `MONGODB_URI` – MongoDB connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – Clerk public key
- `CLERK_SECRET_KEY` – Clerk secret key
- `GEMINI_API_KEY` or `KIMI_K2_API_KEY` – For AI features
- `CLOUDINARY_*` – For image uploads (if used)

## Build & run locally

```bash
# From repo root (builds main/ app)
docker build -t hexjuy .
docker run -p 3000:3000 --env-file .env.local hexjuy
```
