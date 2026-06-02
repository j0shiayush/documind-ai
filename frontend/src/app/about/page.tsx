export default function AboutPage() {
    return (
      <div className="min-h-screen p-8 max-w-3xl mx-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <h1 className="text-3xl font-bold mb-6">About DocuMind AI</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">App Purpose</h2>
          <p>
            DocuMind AI is an intelligent document analysis platform. Our application allows users to upload PDF documents and interact with an AI assistant to summarize, extract information, and answer questions based strictly on the uploaded text.
          </p>
        </section>
  
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Privacy Policy</h2>
          <p className="mb-2">
            <strong>1. Information Collection:</strong> We request basic profile information (Name and Email) solely for the purpose of creating your account and saving your chat history.
          </p>
          <p className="mb-2">
            <strong>2. Data Usage:</strong> Your documents and chat logs are completely private. We do not sell your data, and your Google account information is strictly used for authentication.
          </p>
          <p>
            <strong>3. Third-Party Access:</strong> We use Supabase for secure database management and Google for authentication. Your data is secured according to industry standards.
          </p>
        </section>
      </div>
    );
}