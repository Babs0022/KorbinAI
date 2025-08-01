# BrieflyAI

BrieflyAI is your AI co-pilot for turning ideas into products. It's a web application designed to accelerate the creation process for both non-technical creatives and developers who want to build and ship applications, websites, and other digital projects with the help of AI.

## What does it do?

BrieflyAI provides an integrated suite of AI-powered tools that assist in various stages of product development. Instead of juggling multiple, disconnected services, you can move seamlessly from brainstorming to building within a single, cohesive environment.

### Core Features

BrieflyAI provides a suite of powerful tools to accelerate your creative workflow. Here are some of the core features and best practices for using them:

*   **Written Content Assistant**
    *   **Purpose:** To generate high-quality written content for various use cases, such as blog posts, marketing copy, or technical documentation.
    *   **Best Practices:**
        *   Be specific in your request. Instead of "write a blog post about cars," try "write a blog post about the benefits of electric cars for city dwellers."
        *   Specify the desired tone (e.g., professional, casual, witty) and target audience (e.g., developers, marketers, general consumers).
        *   Provide keywords to guide the content generation and improve SEO.

*   **Prompt Generator**
    *   **Purpose:** To help you create effective prompts for any AI model. This is a "meta" tool that assists you in the art of prompt engineering.
    *   **Best Practices:**
        *   Start with a simple idea and let the generator expand on it.
        *   Experiment with different prompt structures and see how they affect the outcome.
        *   Use the generated prompts as a starting point and refine them to fit your specific needs.

*   **Content Outlining & Drafting**
    *   **Purpose:** To help you structure your content and generate drafts section by section. This is particularly useful for long-form content like articles or reports.
    *   **Best Practices:**
        *   Start by generating an outline to ensure a logical flow.
        *   Review and refine the outline before generating the full draft.
        *   Generate drafts for each section individually to maintain control over the content.

*   **Image Generator**
    *   **Purpose:** To create unique images and illustrations from text descriptions.
    *   **Best Practices:**
        *   Be descriptive in your prompts. Include details about the subject, style, colors, and composition.
        *   Use negative prompts to exclude unwanted elements from the image.
        *   Iterate on your prompts to refine the generated images.

*   **Structured Data Assistant**
    *   **Purpose:** To generate structured data in formats like JSON, CSV, or XML. This is useful for creating datasets, populating databases, or generating configuration files.
    *   **Best Practices:**
        *   Clearly define the schema of the desired data, including field names and data types.
        *   Provide examples of the data you want to generate to guide the AI.
        *   Validate the generated data to ensure it meets your requirements.

*   **Conversational Chat**
    *   **Purpose:** To provide a flexible and interactive way to communicate with the AI. This is useful for brainstorming, asking questions, or getting quick answers.
    *   **Best Practices:**
        *   Be clear and concise in your questions.
        *   Provide context to help the AI understand your request.
        *   Use the chat history to build on previous conversations and maintain context.

## How It Works

BrieflyAI operates on a decoupled architecture that separates the frontend, AI logic, and backend services. This allows for a scalable and maintainable system.

1.  **Frontend (Next.js):** The user interacts with a Next.js application that provides the user interface for all the AI tools. When a user makes a request (e.g., "generate a blog post"), the frontend calls the appropriate Genkit AI flow.

2.  **AI Layer (Genkit):** The AI flows are defined in the `src/ai/flows` directory and are managed by Genkit. When a flow is triggered, Genkit interacts with the configured AI model (in this case, Google AI) to perform the requested task. The flows are designed to be modular and can be easily extended or modified.

3.  **Backend Services (Firebase Functions):** For tasks that require server-side logic beyond the scope of the AI flows (e.g., payment processing), the application uses Firebase Functions. These are small, single-purpose functions that can be triggered by HTTP requests or other Firebase events.

4.  **Database (PostgreSQL via Data Connect):** All data, such as user projects and generated content, is stored in a PostgreSQL database on Google Cloud SQL. Firebase Data Connect provides a secure GraphQL API layer on top of the database, allowing the frontend to query and mutate data in a structured way.

This architecture ensures that the application is robust, scalable, and easy to develop for.

## Tech Stack

BrieflyAI is built with a modern, full-stack architecture:

*   **Framework:** [Next.js](https://nextjs.org/) (v15 with Turbopack)
*   **AI Integration:** [Genkit](https://firebase.google.com/docs/genkit) with the Google AI plugin.
*   **Backend Services:** [Firebase Functions](https://firebase.google.com/docs/functions)
*   **Database:** [PostgreSQL](https://www.postgresql.org/) on Google Cloud SQL, accessed via [Firebase Data Connect](https://firebase.google.com/docs/data-connect) (GraphQL).
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn/UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
*   **Deployment:** [Firebase Hosting](https://firebase.google.com/docs/hosting)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)

## Project Structure

The repository is organized as a monorepo containing the frontend, backend functions, AI flows, and database configuration.

```
.
├── src
│   ├── app/                # Next.js app routes and pages
│   ├── components/         # Shared React components
│   ├── ai/                 # Genkit AI flows, tools, and configuration
│   │   ├── flows/          # All the AI features are defined here
│   │   └── genkit.ts       # Genkit plugin configuration
│   ├── lib/                # Utility functions and libraries
│   └── services/           # Services for interacting with external APIs
├── functions/              # Firebase Functions for backend logic (e.g., payments)
│   └── src/index.ts
├── dataconnect/            # Firebase Data Connect configuration
│   ├── schema/schema.gql   # GraphQL schema for the PostgreSQL database
│   └── connector/          # Queries and mutations
├── firebase.json           # Firebase project configuration
├── package.json            # Root package configuration and scripts
└── ...
```

**Note on the `brieflyai` directory:** You may notice a directory named `brieflyai` which also contains Firebase Functions code. This appears to be a legacy or unused directory. The active and deployed functions are sourced from the `functions` directory as defined in `firebase.json`.

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

*   Node.js (v20 or later)
*   npm
*   [Firebase CLI](https://firebase.google.com/docs/cli#install-cli-npm) (`npm install -g firebase-tools`)

### Installation & Setup

1.  **Clone the repo:**
    ```sh
    git clone https://github.com/your_username/your_project.git
    cd your_project
    ```

2.  **Install NPM packages:**
    This project uses a single `package.json` at the root.
    ```sh
    npm install
    ```

3.  **Set up Firebase:**
    *   Log in to the Firebase CLI: `firebase login`
    *   Set up a new Firebase project in the [Firebase Console](https://console.firebase.google.com/).
    *   Initialize Firebase in the project directory: `firebase use --add` and select your new project.

4.  **Configure Environment Variables:**
    *   Create a `.env.local` file in the root of the project: `touch .env.local`
    *   Add the following environment variables to the file. You will need to get these from your Firebase project settings and Google AI.

    ```env
    # Google AI API Key
    GOOGLE_AI_API_KEY="YOUR_GOOGLE_AI_API_KEY"

    # Firebase Client SDK Configuration
    # Get this from your Firebase project settings (Project Settings > General > Your apps > Web app)
    NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"
    ```

### Running the Application

This application requires two separate processes to run concurrently in your local development environment.

1.  **Start the Next.js Development Server:**
    This runs the frontend application.
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

2.  **Start the Genkit Development Server:**
    This runs the AI flows and makes them available for the frontend to call.
    ```sh
    npm run genkit:dev
    ```
    This will start the Genkit development UI, typically on `http://localhost:4000`.

You will need to have both servers running to use the AI features of the application.

## Deployment

This project is configured for deployment on Firebase.

*   **Hosting:** The Next.js application is deployed to Firebase Hosting.
*   **Functions:** The backend functions in the `functions` directory are deployed to Firebase Functions.
*   **Data Connect:** The `dataconnect` service is deployed as part of the Firebase suite.

The `firebase.json` file contains the configuration for all these services. To deploy the entire project, you can use the `firebase deploy` command.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
