# KorbinAI

KorbinAI is your AI co-pilot for turning ideas into products. It's a web application designed to accelerate the creation process for both non-technical creatives and developers who want to build and ship applications, websites, and other digital projects with the help of AI.

## What does it do?

KorbinAI provides an integrated suite of AI-powered tools that assist in various stages of product development. Instead of juggling multiple, disconnected services, you can move seamlessly from brainstorming to building within a single, cohesive environment.

### Key Features

Based on the application's AI flows, KorbinAI includes the following creation tools:

*   **Written Content Assistant**: Generates professional-quality text for blog posts, emails, social media updates, and more. You can specify the topic, tone, audience, and keywords. (`generate-written-content-flow.ts`)
*   **Prompt Generator**: A meta-tool that helps you craft detailed, optimized, and effective prompts for any AI model or task. (`generate-prompt-flow.ts`)
*   **Content Outlining & Drafting**: Helps you structure your content by generating outlines and then expanding sections into full drafts. (`generate-content-outline-flow.ts`, `expand-outline-section-flow.ts`)
*   **Image Generator**: Creates unique images and art from text descriptions. (`generate-image-flow.ts`)
*   **Structured Data Assistant**: Generates structured data like JSON, CSV, or XML from a plain-English description, perfect for populating components or creating datasets. (`generate-structured-data-flow.ts`)
*   **Conversational Chat**: A flexible chat interface for interacting with the AI. (`conversational-chat-flow.ts`)

All generated assets can be saved as **Projects**, allowing you to keep your work organized and accessible.

## Tech Stack

KorbinAI is built with a modern, full-stack architecture:

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
