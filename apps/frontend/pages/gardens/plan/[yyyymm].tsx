export default function LegacyGardensPlanRedirect() {
  return null;
}

export async function getServerSideProps({ params }: { params: { yyyymm: string } }) {
  const raw = params.yyyymm;
  const plan = raw.includes('-') ? raw : `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;

  return {
    redirect: {
      destination: `/gardens/months/${plan}`,
      permanent: false,
    },
  };
}
