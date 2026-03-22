export default function LegacyGardensApprovalDetailRedirect() {
  return null;
}

export async function getServerSideProps({
  params,
}: {
  params: { yyyymm: string; gardenerId: string };
}) {
  const raw = params.yyyymm;
  const plan = raw.includes('-') ? raw : `${raw.slice(0, 4)}-${raw.slice(4, 6)}`;

  return {
    redirect: {
      destination: `/gardens/months/${plan}/workers/${params.gardenerId}`,
      permanent: false,
    },
  };
}
