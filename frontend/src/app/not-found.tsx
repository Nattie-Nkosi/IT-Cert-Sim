import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-primary/20 font-medium hover:bg-primary/5 transition-all"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
