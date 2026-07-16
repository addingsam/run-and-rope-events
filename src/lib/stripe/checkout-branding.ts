import { APP_NAME } from "@/lib/constants";

export function getStripeCheckoutCustomText(message?: string) {
  return {
    submit: {
      message: message ?? `Complete checkout to activate your ${APP_NAME} subscription.`,
    },
  } as const;
}
