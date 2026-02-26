import { Suspense } from 'react';
import ExamResultsClient from './ExamResultsClient';

export function generateStaticParams() {
  return [];
}

export default function ExamResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    }>
      <ExamResultsClient />
    </Suspense>
  );
}
