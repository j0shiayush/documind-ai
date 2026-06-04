DocuMind AIAn intelligent, full-stack document analysis platform that transforms static PDF documents into interactive, conversational AI assets. Driven by advanced Retrieval-Augmented Generation (RAG), DocuMind AI allows users to upload complex documents and instantly extract summaries, analyze data patterns, and query domain-specific information through an intuitive, real-time chat interface.                  ┌────────────────────────────────────────┐
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
Table of ContentsFeaturesArchitecture OverviewPrerequisitesInstallationEnvironment VariablesFrontend VariablesBackend VariablesLocal DevelopmentRunning the BackendRunning the FrontendUsageUploading/Ingesting PDFsAsking QuestionsViewing Chat HistoryProduction Build & DeploymentCustomizing the AgentTroubleshootingNext StepsFeatures🔒 Secure User Authentication: Seamless login and session management powered by Supabase Auth and protected Next.js routing middleware.📄 Seamless PDF Ingestion: Robust document uploading pipeline designed to process complex formatting and parse texts efficiently.⚡ Context-Aware AI Chat: Interactive conversations with the Google Gemini API, delivering precise context extraction and answers directly anchored in your uploaded documents.💾 Persistent Thread Management: Complete dynamic chat history persistence tied securely to individual user profiles.🎨 Responsive UI/UX: Modern, clean dual-mode interface implemented using Tailwind CSS, including a collapsible workspace sidebar.Architecture OverviewDocuMind AI utilizes a modern decoupled structural pattern to ensure low-latency performance and absolute separation of concerns:Frontend Ecosystem: Built with Next.js, TypeScript, and Tailwind CSS. State management handles real-time UI components, while edge middleware intercepts unauthenticated requests to guarantee secure client pathways.Data & Auth Tier: Managed through Supabase. Handles secure PostgreSQL relational storage for chat metadata, session IDs, and user account rules.Intelligence Layer: Anchored by the Gemini API, which processes ingested document context to generate grounded, intelligent structural answers.PrerequisitesBefore starting local configuration, confirm your development system includes the following components:Node.js: Version 18.x or higher installed.Package Manager: npm, pnpm, or yarn configured globally.Supabase Account: Access to a live Supabase project to obtain instance credentials.Google AI Studio Account: A valid API token generated from Google AI Studio for the Gemini model family.InstallationClone the repository and isolate the respective configuration pathways:Bash# Clone the repository
git clone https://github.com/yourusername/documind-ai.git
cd documind-ai

# Install root dependencies (if managing a monorepo workspace)
npm install
Environment VariablesCreate an .env.local file in both your frontend and backend directories (or root directory depending on your specific layout configuration).Frontend VariablesCode snippetNEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anonymous-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
Backend VariablesCode snippetSUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-google-gemini-api-token
DATABASE_URL=your-postgresql-connection-string
Local DevelopmentRunning the BackendIf your ingestion services or database APIs are isolated inside a dedicated backend directory, navigate to it and trigger development initialization:Bashcd backend
npm install
npm run dev
Running the FrontendTo start your client dashboard interface application layer locally:Bashcd frontend
npm install
npm run dev
Open your browser and navigate to http://localhost:3000 to interact with your local instance.UsageUploading/Ingesting PDFsAccess the main workspace and sign in securely through the login interface.Select the file upload area inside the workspace interface, drop your target PDF document, and click process.Asking QuestionsOnce processing completes, type inquiries inside the contextual chat box. The underlying system evaluates the document matrix and returns precise citations.Viewing Chat HistoryUse the interactive historical layout sidebar to locate archived analytical sessions.Rename or clear session states natively using inline controls.Production Build & DeploymentTo generate an production-optimized deployment configuration for platforms like Vercel:Bash# Generate the production build output
npm run build

# Start the built application locally
npm run start
Deployment checklist:Ensure production environmental variable properties are assigned within your Vercel deployment console.Register the production domain address ([https://your-app.vercel.app](https://your-app.vercel.app)) inside the Google Cloud Console OAuth Authorized Domains panel to maintain production user onboarding capabilities.Customizing the AgentTo modify the response logic, personality style, or contextual bounds of the analytical engine, access your processing parameters module and alter the baseline model context prompt:TypeScriptconst systemInstruction = `
  You are DocuMind AI, an elite document intelligence analyst. 
  Your responses must remain strictly anchored to the extracted textual data provided. 
  If the answer cannot be verified within the context, explicitly inform the user.
`;
TroubleshootingIncident ManifestRoot CatalystMitigation ProcessOAuth Registration ErrorProject email/domain string mismatch within Google Console settings.Access Search Console, claim matching prefix ownership, and configure the Cloud console branding panel to target a fully public routing route.404 Menu Link AbsentGoogle Cloud UI deprecation updates to legacy domain menus.Execute global search parameters directly via the top navigation interface framework bar.Recursive Session RedirectsNext.js middleware evaluating incomplete active cookies.Ensure your storage hooks or state providers handle initial session hydration checks gracefully.Next Steps[ ] Integrate vector chunk embedding models natively into Postgres using pgvector.[ ] Add comparative cross-document analysis features to check multiple source arrays simultaneously.[ ] Introduce structural JSON export capabilities to easily extract structured data tables from unstructured documents.
