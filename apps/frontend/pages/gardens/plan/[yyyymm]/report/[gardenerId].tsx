export default function LegacyGardensReportRedirect() {
  return null;
}

export async function getServerSideProps({
  params,
  query,
}: {
  params: { yyyymm: string; gardenerId: string };
  query: { download?: string };
}) {
  const raw = params.yyyymm;
  const plan = raw.includes('-') ? raw : `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;
  const suffix = query.download === '1' ? '?download=1' : '';

  return {
    redirect: {
      destination: `/gardens/months/${plan}/report/${params.gardenerId}${suffix}`,
      permanent: false,
    },
  };
}
