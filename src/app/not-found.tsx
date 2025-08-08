
"use client";

import Link from 'next/link';
import { Suspense } from 'react';

// Since the build process is failing on this page during prerendering,
// we convert it to a client component to ensure hooks like useSearchParams
// can be used without causing build-time errors.

export default function NotFound() {
    return (
        <div className="bg-background text-foreground flex flex-col min-h-screen">
          <main className="flex-grow flex flex-col items-center justify-center text-center p-4 sm:p-6 md:p-8">
            <div className="max-w-md w-full">
                <img src="/icon.png" alt="Project Logo" className="w-32 h-32 mx-auto mb-8" />
                <h1 className="text-8xl font-bold text-red-600">404</h1>
                <h2 className="text-2xl font-semibold mt-4 mb-2">Page Not Found</h2>
                <p className="text-muted-foreground mb-8">
                  The page you are looking for does not exist or has been moved. Please check the URL and try again.
                </p>
                <Link href="/" className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  Back to Home
                </Link>
            </div>
          </main>

          <footer className="bg-gray-900/50 border-t border-border w-full py-8">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8 text-left">
                    <div>
                        <div className="flex items-center space-x-3 mb-4">
                            <img src="/icon.png" alt="KorbinAI Logo" className="w-8 h-8 object-contain"/>
                            <span className="text-xl font-semibold tracking-tight">Korbin<span className="text-green-400">AI</span></span>
                        </div>
                        <p className="text-muted-foreground mb-4 font-light">The AI copilot for creators and developers.</p>
                        <div className="flex space-x-4">
                            <a href="mailto:Elijah@korbinai.com" className="text-muted-foreground hover:text-green-400 transition-colors" aria-label="Email KorbinAI">
                               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                            </a>
                            <a href="https://twitter.com/trykorbinai" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-green-400 transition-colors" aria-label="KorbinAI Twitter">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 tracking-tight">Product</h4>
                        <div className="space-y-2 text-muted-foreground">
                            <a href="https://korbinai.com/#features" className="block hover:text-green-400 transition-colors font-light">Features</a>
                            <a href="https://korbinai.com/#solutions" className="block hover:text-green-400 transition-colors font-light">Solutions</a>
                            <a href="https://korbinai.com/pricing" className="block hover:text-green-400 transition-colors font-light">Pricing</a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 tracking-tight">Company</h4>
                        <div className="space-y-2 text-muted-foreground">
                            <a href="mailto:Elijah@korbinai.com" className="block hover:text-green-400 transition-colors font-light">Contact</a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4 tracking-tight">Legal</h4>
                        <div className="space-y-2 text-muted-foreground">
                            <a href="https://korbinai.com/privacy" className="block hover:text-green-400 transition-colors font-light">Privacy Policy</a>
                            <a href="https://korbinai.com/terms" className="block hover:text-green-400 transition-colors font-light">Terms of Service</a>
                        </div>
                    </div>
                </div>
                <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
                    <p className="font-light">© 2025 KorbinAI. All rights reserved.</p>
                    <p className="mt-2 text-sm font-light">Questions? Contact us at <a href="mailto:Elijah@korbinai.com" className="text-green-400 hover:text-green-300">Elijah@korbinai.com</a></p>
                </div>
            </div>
          </footer>
        </div>
    );
}
