import { db } from "@/config/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { schema } from "@/config/schema";
import {
  polar,
  checkout,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
// import { nextCookies } from "better-auth/next-js";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "3e095640-1d68-4577-a605-f18b7de72e47", // ID of Product from Polar Dashboard
              slug: "free", // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
            },
            {
              productId: "9f5af569-6947-45f1-a94b-1e3e664cc199",
              slug: "pro",
            },
          ],
          successUrl: "/",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_ACCESS_TOKEN,
        }),
      ],
    }),
  ],
});
