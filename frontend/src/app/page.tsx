import Link from 'next/link';
import Navbar from '@/components/Navbar';

const certifications = [
  { name: 'CompTIA A+', code: 'A+', color: 'from-red-500 to-orange-500' },
  { name: 'CompTIA Network+', code: 'N+', color: 'from-blue-500 to-cyan-500' },
  { name: 'CompTIA Security+', code: 'S+', color: 'from-green-500 to-emerald-500' },
  { name: 'AWS Cloud', code: 'AWS', color: 'from-amber-500 to-yellow-500' },
  { name: 'Microsoft 365', code: 'MS', color: 'from-purple-500 to-pink-500' },
  { name: 'Cisco CCNA', code: 'CCNA', color: 'from-indigo-500 to-blue-500' },
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-sky-500/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-sm font-medium text-primary mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Free Practice Exams Available
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              Ace Your{' '}
              <span className="bg-gradient-to-r from-primary to-sky-600 bg-clip-text text-transparent">
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
                className="px-8 py-4 bg-gradient-to-r from-primary to-sky-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
              >
                Start Practicing Free
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 border-2 border-primary/20 rounded-xl font-semibold hover:bg-primary/5 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-8">
            PREPARE FOR POPULAR CERTIFICATIONS
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {certifications.map((cert) => (
              <div
                key={cert.code}
                className="flex items-center gap-3 px-5 py-3 bg-card rounded-xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cert.color} flex items-center justify-center text-white font-bold text-sm`}>
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-sky-500/10 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
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
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Create Account', desc: 'Sign up for free' },
              { step: '2', title: 'Choose Exam', desc: 'Pick your certification' },
              { step: '3', title: 'Practice', desc: 'Take timed exams' },
              { step: '4', title: 'Review', desc: 'Learn from results' },
            ].map((item, i) => (
              <div key={item.step} className="flex items-center">
                <div className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary to-sky-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-3 mx-auto shadow-lg shadow-primary/25">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block w-16 h-0.5 bg-gradient-to-r from-primary/50 to-sky-500/50 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-br from-primary/10 via-sky-500/5 to-primary/10 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Certified?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of IT professionals preparing for their certifications
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-gradient-to-r from-primary to-sky-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
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
              <span className="text-xl">🎓</span>
              <span className="font-semibold">IT Cert Simulator</span>
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
