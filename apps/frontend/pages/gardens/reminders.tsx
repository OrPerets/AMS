export default function LegacyGardensRemindersRedirect() {
  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/gardens',
      permanent: false,
    },
  };
}
