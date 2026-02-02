import ErrorPage from '@/components/ErrorPage';

export default function ForbiddenPage() {
  return (
    <ErrorPage
      code={403}
      title="Access Denied"
      message="You don't have permission to access this resource."
      showBack={true}
      showHome={true}
      showLogin={false}
    />
  );
}
