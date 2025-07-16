# BrieflyAI

BrieflyAI is your AI co-pilot for turning ideas into products. It's a web application designed to accelerate the creation process for both non-technical creatives and developers who want to build and ship applications, websites, and other digital projects with the help of AI.

## What does it do?

BrieflyAI provides an integrated suite of AI-powered tools that assist in various stages of product development. Instead of juggling multiple, disconnected services, you can move seamlessly from brainstorming to building within a single, cohesive environment.

### Key Features

Based on the current application, BrieflyAI includes the following creation tools:

*   **Written Content Assistant**: Generates professional-quality text for blog posts, emails, social media updates, and more. You can specify the topic, tone, audience, and keywords.
*   **Prompt Generator**: A meta-tool that helps you craft detailed, optimized, and effective prompts for any AI model or task.
*   **Application Wizard**: Builds multi-file, production-ready web pages and applications using Next.js, ShadCN, and Tailwind CSS from a simple description.
*   **Image Generator**: Creates unique images and art from text descriptions. It also supports providing context images for editing, style transfer, and more.
*   **Structured Data Assistant**: Generates structured data like JSON, CSV, KML, or XML from a plain-English description, perfect for populating components or creating datasets.

All generated assets can be saved as **Projects**, allowing you to keep your work organized and accessible.

## What is the Value Proposition?

The core value of BrieflyAI is **accelerating the product creation lifecycle**. It streamlines the entire workflow—from ideation to execution—within one intelligent platform. By integrating the tools needed to generate text, images, data, and code, BrieflyAI empowers you to bring your digital ideas to life faster and more efficiently than ever before.

To get started, simply visit the dash.brieflyai.xyz and choose what you'd like to create today.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v20 or later)
*   npm

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username/your_project.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```

### Running the Application

1.  Start the development server
    ```sh
    npm run dev
    ```
2.  Start the Genkit development server
    ```sh
    npm run genkit:dev
    ```
3.  Open your browser and navigate to `http://localhost:9002`

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **AI Integration:** [Genkit](https://firebase.google.com/docs/genkit)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn/UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
*   **Deployment:** [Firebase](https://firebase.google.com/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)

## Project Structure

<pre>
.
├── src
│   ├── app
│   │   ├── (api)
│   │   ├── (auth)
│   │   └── (dashboard)
│   ├── components
│   │   ├── (auth)
│   │   ├── (dashboard)
│   │   ├── (layout)
│   │   └── (ui)
│   ├── lib
│   └── services
├── public
└── ...
</pre>

*   **`src/app`**: Contains the main application routes and pages.
*   **`src/components`**: Contains all the React components used in the application.
*   **`src/lib`**: Contains utility functions and libraries.
*   **`src/services`**: Contains services for interacting with external APIs.
*   **`public`**: Contains static assets like images and fonts.

## Deployment

This project is deployed on Firebase. The `firebase.json` and `apphosting.yaml` files configure the deployment.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
