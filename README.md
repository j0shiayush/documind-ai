# 🧠 DocuMind AI

An intelligent, full-stack document analysis platform that transforms static PDF documents into interactive, conversational AI assets. Driven by advanced Retrieval-Augmented Generation (RAG), DocuMind AI allows users to upload complex documents and instantly extract summaries, analyze data patterns, and query domain-specific information through an intuitive, real-time chat interface.

```text
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
