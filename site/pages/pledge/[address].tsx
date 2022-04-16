import { GetStaticProps } from "next";

import { PledgeDashboard } from "components/pages/Pledge/PledgeDashboard";
import { getPledgeByAddress, pledgeResolver } from "lib/moralis";
import { loadTranslation } from "lib/i18n";

export const getStaticProps: GetStaticProps = async (ctx) => {
  const translation = await loadTranslation(ctx.locale);
  const { address } = ctx.params as { address: string };
  let pledge;

  try {
    const data = await getPledgeByAddress(address.toLowerCase());

    if (!data) throw new Error("Not found");
    pledge = pledgeResolver(JSON.parse(JSON.stringify(data)));
  } catch (error) {
    pledge = null;
  }

  return {
    props: {
      pageAddress: address,
      pledge,
      translation,
    },
    revalidate: 180,
  };
};

export const getStaticPaths = async () => ({
  paths: [],
  fallback: "blocking",
});

export default PledgeDashboard;
