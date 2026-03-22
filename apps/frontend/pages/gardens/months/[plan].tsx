import { GardensManagerMonth } from '../../../components/gardens/GardensManagerMonth';

export default function GardensMonthPage({ plan }: { plan: string }) {
  return <GardensManagerMonth plan={plan} />;
}

export async function getServerSideProps({ params }: { params: { plan: string } }) {
  const raw = params.plan;
  const plan = raw.includes('-') ? raw : `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;

  return {
    props: {
      plan,
    },
  };
}
