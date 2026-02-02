import ErrorPage from '@/components/ErrorPage';

export default function UnauthorizedPage() {
  return (
    <ErrorPage
      code={401}
      title="Unauthorized"
      message="You need to be logged in to access this page."
      showBack={false}
      showHome={true}
      showLogin={true}
    />
  );
}
