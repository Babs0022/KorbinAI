import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact KorbinAI',
  description: 'Get in touch with the KorbinAI team.',
};

export default function ContactPage() {
  return (
    <div className="bg-background text-foreground">
      <header className="py-12 text-center">
        <h1 className="text-5xl font-bold">Contact Us</h1>
        <p className="text-xl text-muted-foreground mt-4">We'd love to hear from you.</p>
      </header>
      <main className="container mx-auto px-4 py-16">
        <section className="max-w-xl mx-auto">
          <form className="space-y-8">
            <div>
              <label htmlFor="name" className="block text-lg font-medium mb-2">Name</label>
              <input type="text" id="name" name="name" className="w-full p-4 bg-secondary border border-border rounded-lg" />
            </div>
            <div>
              <label htmlFor="email" className="block text-lg font-medium mb-2">Email</label>
              <input type="email" id="email" name="email" className="w-full p-4 bg-secondary border border-border rounded-lg" />
            </div>
            <div>
              <label htmlFor="message" className="block text-lg font-medium mb-2">Message</label>
              <textarea id="message" name="message" rows={5} className="w-full p-4 bg-secondary border border-border rounded-lg"></textarea>
            </div>
            <div className="text-center">
              <button type="submit" className="bg-primary text-primary-foreground font-bold py-3 px-6 rounded-lg">
                Send Message
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
