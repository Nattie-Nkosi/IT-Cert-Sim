import Link from 'next/link';
import Navbar from '@/components/Navbar';

const certifications = [
  { name: 'CompTIA A+', code: 'A+', bg: 'bg-red-500' },
  { name: 'CompTIA Network+', code: 'N+', bg: 'bg-sky-500' },
  { name: 'CompTIA Security+', code: 'S+', bg: 'bg-emerald-600' },
  { name: 'AWS Cloud', code: 'AWS', bg: 'bg-amber-500' },
  { name: 'Microsoft 365', code: 'MS', bg: 'bg-purple-600' },
  { name: 'Cisco CCNA', code: 'CCNA', bg: 'bg-indigo-600' },
];

const features = [
  {
    icon: '⏱️',
    title: 'Timed Exams',
    description: 'Realistic exam conditions with countdown timers',
  },
  {
    icon: '🔀',
    title: 'Randomized Questions',
    description: 'Questions and answers shuffle every attempt',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    description: 'Track scores and review your exam history',
  },
  {
    icon: '🔒',
    title: 'Anti-Cheating',
    description: 'Tab monitoring and activity tracking',
  },
  {
    icon: '💡',
    title: 'Explanations',
    description: 'Learn from detailed answer explanations',
  },
  {
    icon: '📱',
    title: 'Responsive',
    description: 'Practice on any device, anywhere',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-8">
              <span className="w-2 h-2 bg-sky-500 block" />
              Free Practice Exams Available
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              Ace Your{' '}
              <span className="text-primary">
                IT Certification
              </span>{' '}
              Exams
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Practice with realistic exam simulations featuring timed tests,
              randomized questions, and detailed explanations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-primary text-primary-foreground font-semibold hover:bg-sky-600 transition-colors"
              >
                Start Practicing Free
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 border-2 border-primary font-semibold hover:bg-primary/5 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-semibold tracking-widest text-muted-foreground mb-8 uppercase">
            Prepare for Popular Certifications
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {certifications.map((cert) => (
              <div
                key={cert.code}
                className="flex items-center gap-3 px-5 py-3 bg-card border hover:border-primary transition-colors"
              >
                <div className={`w-10 h-10 ${cert.bg} flex items-center justify-center text-white font-bold text-sm`}>
                  {cert.code}
                </div>
                <span className="font-medium">{cert.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Pass
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our simulator provides a complete exam preparation experience
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 border-r border-b bg-card hover:bg-primary/5 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center text-2xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-center gap-0 max-w-4xl mx-auto border-l border-t">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up for free' },
              { step: '02', title: 'Choose Exam', desc: 'Pick your certification' },
              { step: '03', title: 'Practice', desc: 'Take timed exams' },
              { step: '04', title: 'Review', desc: 'Learn from results' },
            ].map((item) => (
              <div key={item.step} className="flex-1 p-8 border-r border-b">
                <div className="text-4xl font-bold text-primary/20 mb-3">{item.step}</div>
                <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center p-10 border-2 border-primary">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Certified?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of IT professionals preparing for their certifications
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground font-semibold hover:bg-sky-600 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">IT</span>
              </div>
              <span className="font-semibold">Cert Simulator</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for learning. Practice exams for educational purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
