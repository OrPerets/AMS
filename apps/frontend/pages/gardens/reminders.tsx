import { GardensRemindersCenter } from '../../components/gardens/GardensRemindersCenter';

export default function GardensRemindersPage({ initialPlan }: { initialPlan?: string | null }) {
  return <GardensRemindersCenter initialPlan={initialPlan} />;
}

export async function getServerSideProps({ query }: { query: { plan?: string } }) {
  return {
    props: {
      initialPlan: typeof query.plan === 'string' ? query.plan : null,
    },
  };
}
