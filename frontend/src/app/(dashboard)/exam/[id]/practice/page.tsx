import { PracticeModeClient } from '../PracticeModeClient';

export default function PracticeModePage({ params }: { params: { id: string } }) {
  return <PracticeModeClient examId={params.id} />;
}
