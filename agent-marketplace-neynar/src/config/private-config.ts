import "server-only";
import { z } from "zod";

const privateConfigSchema = z.object({
  neynarApiKey: z
    .string()
    .min(1, "NEYNAR_API_KEY environment variable is required"),
  coingeckoApiKey: z.string(),
  privyAppId: z.string(),
  privyAppSecret: z.string(),
});

export const privateConfig = privateConfigSchema.parse({
  neynarApiKey: process.env.NEYNAR_API_KEY || "",
  coingeckoApiKey:
    // demo coingecko key, not sensitive
    process.env.COINGECKO_API_KEY || "CG-UviYfmkExfr86X5JFTZfaVbb",
  privyAppId: process.env.PRIVY_APP_ID || "cmnzht0mt011g0cl8cr6w03bt",
  privyAppSecret:
    process.env.PRIVY_APP_SECRET ||
    "privy_app_secret_2aHL8amFG7V4dCDM2tjoKmRrGXAaNk8evfZfTFiVxJHrx6GRrdrbiL7A6fDiYwo6EwFD2wa4szSFMEiStuWzYDCi",
});
