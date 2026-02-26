import Link from 'next/link';
import Navbar from '@/components/Navbar';

const features = [
  {
    tag: 'timed_exams',
    title: 'Timed Exams',
    description: 'Realistic exam conditions with countdown timers that mirror actual certification tests.',
  },
  {
    tag: 'randomized_q',
    title: 'Randomized Questions',
    description: 'Questions and answers shuffle every attempt so you never memorize patterns.',
  },
  {
    tag: 'progress',
    title: 'Progress Tracking',
    description: 'Track your scores, review history, and monitor improvement over time.',
  },
  {
    tag: 'anti_cheat',
    title: 'Anti-Cheating',
    description: 'Tab monitoring and activity tracking for honest practice sessions.',
  },
  {
    tag: 'explanations',
    title: 'Explanations',
    description: 'Detailed answer breakdowns so you learn why, not just what.',
  },
  {
    tag: 'practice_mode',
    title: 'Practice Mode',
    description: 'No timer, instant feedback, free navigation — learn at your own pace.',
  },
];

const stats = [
  { label: 'certifications', value: '6' },
  { label: 'questions', value: '500+' },
  { label: 'exam_modes', value: '2' },
  { label: 'pass_rate', value: '85%' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
              <div className="flex-1">
                <span className="inline-block font-mono text-sm text-primary/70 mb-6">
                  {'// free & open'}
                </span>

                <h1 className="font-mono text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
                  {'> ace your'}
                  <br />
                  <span className="text-primary">{'IT certs'}</span>
                  <span className="animate-blink text-primary">_</span>
                </h1>

                <p className="text-lg text-muted-foreground mb-10 max-w-lg">
                  Practice with realistic exam simulations. Timed tests,
                  randomized questions, instant feedback, and detailed explanations.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/register"
                    className="px-6 py-3 bg-primary text-primary-foreground font-mono text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                  >
                    <span className="text-primary-foreground/60">$</span> start-practicing
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-3 border border-border font-mono text-sm font-medium hover:border-primary hover:text-primary transition-colors inline-flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">$</span> sign-in
                  </Link>
                </div>
              </div>

              {/* Decorative terminal */}
              <div className="flex-1 mt-12 lg:mt-0">
                <div className="border border-border bg-card">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/50">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 bg-destructive/60" />
                      <div className="w-3 h-3 bg-chart-4/60" />
                      <div className="w-3 h-3 bg-chart-3/60" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground ml-2">~/cert-simulator</span>
                  </div>
                  <div className="p-5 font-mono text-sm space-y-2">
                    <p className="text-muted-foreground">
                      <span className="text-primary">$</span> cert-sim --status
                    </p>
                    <p className="text-foreground/80">
                      ✓ 6 certifications loaded
                    </p>
                    <p className="text-foreground/80">
                      ✓ 500+ practice questions
                    </p>
                    <p className="text-foreground/80">
                      ✓ exam mode: <span className="text-primary">active</span>
                    </p>
                    <p className="text-foreground/80">
                      ✓ practice mode: <span className="text-primary">active</span>
                    </p>
                    <p className="text-muted-foreground mt-3">
                      <span className="text-primary">$</span> <span className="animate-blink">▌</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center divide-x divide-border">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 md:px-10 py-3">
                <p className="font-mono text-sm text-muted-foreground">
                  <span className="text-primary mr-2">{'>'}</span>
                  {stat.label}:{' '}
                  <span className="text-foreground font-bold">{stat.value}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-mono text-2xl md:text-3xl font-bold mb-3">
              <span className="text-primary">{'>'}</span> features
            </h2>
            <p className="text-muted-foreground">
              Everything you need to pass, nothing you don&apos;t.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.tag}
                className="border border-border bg-card hover:border-primary transition-colors group"
              >
                <div className="px-4 py-2 border-b border-border bg-muted/50 flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    [{feature.tag}]
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-mono text-base font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="border border-border bg-card p-10">
              <p className="font-mono text-sm text-muted-foreground mb-6">
                <span className="text-primary">$</span> register --free --start-now
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to get certified?
              </h2>
              <p className="text-muted-foreground mb-8">
                Create a free account and start practicing today.
              </p>
              <Link
                href="/register"
                className="inline-block px-8 py-4 bg-primary text-primary-foreground font-mono text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-mono font-bold text-xs">IT</span>
              </div>
              <span className="font-mono text-sm font-semibold">cert-simulator</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              // built for learning — {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
