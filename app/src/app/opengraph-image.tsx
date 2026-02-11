import { generateOGImage } from "@/lib/og-image";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export const runtime = "nodejs";

export const alt = "multisig.social - On-chain trust, powered by vouching";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return generateOGImage(
    {
      title: SITE_NAME,
      subtitle: SITE_TAGLINE,
    },
    size
  );
}
