import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">IT Certification Simulator</h1>
        <p className="text-xl mb-8 text-muted-foreground">
          Practice and master your IT certification exams
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-border rounded-md hover:bg-accent"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
