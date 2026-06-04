# DocuMind AI

An intelligent, full-stack document analysis platform that transforms static PDF documents into interactive, conversational AI assets. Driven by advanced Retrieval-Augmented Generation (RAG), DocuMind AI allows users to upload complex documents and instantly extract summaries, analyze data patterns, and query domain-specific information through an intuitive, real-time chat interface.

~~~text
                  ┌────────────────────────────────────────┐
                  │          Next.js Frontend              │
                  └───────────────────┬────────────────────┘
                                      │ (Secure Auth / Upload)
                                      ▼
                  ┌────────────────────────────────────────┐
                  │       Supabase Auth & Database         │
                  └───────────────────┬────────────────────┘
                                      │ (Context Retrieval)
                                      ▼
                  ┌────────────────────────────────────────┐
                  │        Gemini API Intelligence         │
                  └────────────────────────────────────────┘
~~~

<img width="1920" height="928" alt="image" src="https://github.com/user-attachments/assets/9d7a1343-64b8-49d6-9131-7790bcef69b9" />

<img width="1920" height="926" alt="image" src="https://github.com/user-attachments/assets/55bbb3bc-8b0f-4f83-a323-5f7b7e424790" />

<img width="1912" height="926" alt="image" src="https://github.com/user-attachments/assets/9c8c372a-1915-475c-a9e7-cf9942e702e9" />


---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture Overview](#️-architecture-overview)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Local Development](#-local-development)
- [Usage](#-usage)
- [Production Build & Deployment](#️-production-build--deployment)
- [Troubleshooting](#️-troubleshooting)
- [Next Steps](#-next-steps)

---

## ✨ Features

* **🔒 Secure User Authentication:** Seamless login and session management powered by Supabase Auth and protected Next.js routing middleware.
* **📄 Seamless PDF Ingestion:** Robust document uploading pipeline designed to process complex formatting and parse texts efficiently.
* **⚡ Context-Aware AI Chat:** Interactive conversations with the Google Gemini API, delivering precise context extraction and answers directly anchored in your uploaded documents.
* **💾 Persistent Thread Management:** Complete dynamic chat history persistence tied securely to individual user profiles.
* **🎨 Responsive UI/UX:** Modern, clean dual-mode interface implemented using Tailwind CSS, including a collapsible workspace sidebar.

---

## 🏗️ Architecture Overview

DocuMind AI utilizes a modern decoupled structural pattern to ensure low-latency performance:

* **Frontend Ecosystem:** Built with **Next.js**, **TypeScript**, and **Tailwind CSS**. 
* **Data & Auth Tier:** Managed through **Supabase**. Handles secure PostgreSQL relational storage for chat metadata, session IDs, and user account rules.
* **Intelligence Layer:** Anchored by the **Gemini API**, which processes ingested document context to generate grounded, intelligent answers.

---

## 📋 Prerequisites

Before starting local configuration, confirm your system includes:

* **Node.js:** Version 18.x or higher installed.
* **Package Manager:** `npm`, `pnpm`, or `yarn`.
* **Supabase Account:** Access to a live Supabase project to obtain instance credentials.
* **Google AI Studio Account:** A valid API token generated for the Gemini API.

---

## 🚀 Installation

Clone the repository and install the dependencies:

~~~bash
# Clone the repository
git clone [https://github.com/yourusername/documind-ai.git](https://github.com/yourusername/documind-ai.git)
cd documind-ai

# Install dependencies
npm install
~~~

---

## 🔐 Environment Variables

Create an `.env.local` file in your root directory and add the following keys:

~~~env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=[https://your-supabase-project.supabase.co](https://your-supabase-project.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anonymous-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Gemini AI
GEMINI_API_KEY=your-google-gemini-api-token

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
~~~

---

## 💻 Local Development

To start your client dashboard interface locally:

~~~bash
npm run dev
~~~

Open your browser and navigate to `http://localhost:3000` to interact with your local instance.

---

## 📖 Usage

### 1. Secure Login
Access the main workspace and sign in securely through the login interface.

[📸 ADD YOUR AUTH/LOGIN IMAGE HERE - DELETE THIS TEXT AND DRAG & DROP IMAGE]

### 2. Uploading PDFs
Select the file upload area inside the workspace interface, drop your target PDF document, and click process.

### 3. Asking Questions
Once processing completes, type inquiries inside the contextual chat box. The underlying system evaluates the document and returns precise citations.

[📸 ADD YOUR GENERATED RESPONSE/CHAT IMAGE HERE - DELETE THIS TEXT AND DRAG & DROP IMAGE]

### 4. Viewing Chat History
Use the interactive historical layout sidebar to locate archived analytical sessions. Rename or clear session states natively.

---

## ☁️ Production Build & Deployment

To generate a production-optimized build for platforms like Vercel:

~~~bash
npm run build
npm run start
~~~

*Note: Ensure you register your production domain address (`[https://your-app.vercel.app](https://your-app.vercel.app)`) inside the **Google Cloud Console OAuth Authorized Domains** panel.*

---

## 🛠️ Troubleshooting

| Incident | Mitigation Process |
| :--- | :--- |
| **OAuth Error** | Access Search Console, claim URL Prefix ownership, and set Cloud Console branding to a public route (`/about`). |
| **Session Redirects** | Ensure Next.js middleware is evaluating active cookies properly and exempting the root `/` path. |

---

## 🎯 Next Steps

- [ ] Integrate vector chunk embedding models natively into Postgres using pgvector.
- [ ] Add comparative cross-document analysis features.
- [ ] Introduce structural JSON export capabilities.
