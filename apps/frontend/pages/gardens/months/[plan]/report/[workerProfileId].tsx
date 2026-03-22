import { GardensWorkerReport } from '../../../../../components/gardens/GardensWorkerReport';

export default function GardensWorkerReportPage({
  plan,
  workerProfileId,
}: {
  plan: string;
  workerProfileId: number;
}) {
  return <GardensWorkerReport plan={plan} workerProfileId={workerProfileId} />;
}

export async function getServerSideProps({
  params,
}: {
  params: { plan: string; workerProfileId: string };
}) {
  const raw = params.plan;
  const plan = raw.includes('-') ? raw : `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;

  return {
    props: {
      plan,
      workerProfileId: Number.parseInt(params.workerProfileId, 10),
    },
  };
}
