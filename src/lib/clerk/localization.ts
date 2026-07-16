import { APP_NAME } from "@/lib/constants";

export const clerkLocalization = {
  signIn: {
    start: {
      title: `Sign in to ${APP_NAME}`,
      subtitle: "Welcome back! Please sign in to continue.",
      titleCombined: `Continue to ${APP_NAME}`,
      subtitleCombined: "Welcome back! Please sign in to continue.",
    },
    password: {
      title: `Sign in to ${APP_NAME}`,
      subtitle: "Enter the password associated with your account",
    },
    passkey: {
      title: `Sign in to ${APP_NAME}`,
      subtitle: "Use your passkey to continue",
    },
    emailCode: {
      title: "Check your email",
      subtitle: `Enter the verification code sent to your email for ${APP_NAME}.`,
      formTitle: "Verification code",
    },
    emailLink: {
      title: "Check your email",
      subtitle: `Use the verification link sent to your email for ${APP_NAME}.`,
      formSubtitle: `Finish signing in to ${APP_NAME}.`,
      verified: {
        title: `Signed in to ${APP_NAME}`,
      },
    },
    phoneCode: {
      title: "Check your phone",
      subtitle: `Enter the verification code sent to your phone for ${APP_NAME}.`,
      formTitle: "Verification code",
    },
    emailCodeMfa: {
      title: "Check your email",
      subtitle: `Enter the verification code sent to your email for ${APP_NAME}.`,
    },
    phoneCodeMfa: {
      title: "Check your phone",
      subtitle: `Enter the verification code sent to your phone for ${APP_NAME}.`,
    },
    newDeviceVerificationNotice: `We need to verify this device before you can sign in to ${APP_NAME}.`,
    alternativeMethods: {
      title: `Use another method to sign in to ${APP_NAME}`,
      subtitle: "Having trouble signing in? Try another option.",
    },
    forgotPassword: {
      title: "Reset password",
      subtitle: `Reset the password for your ${APP_NAME} account`,
    },
    resetPassword: {
      title: "Set new password",
      successMessage: `Your ${APP_NAME} password has been updated.`,
    },
  },
  signUp: {
    start: {
      title: `Create your ${APP_NAME} account`,
      subtitle: "Welcome! Fill in the details to get started.",
      titleCombined: `Create your ${APP_NAME} account`,
      subtitleCombined: "Welcome! Fill in the details to get started.",
    },
    emailCode: {
      title: "Check your email",
      subtitle: `Enter the verification code sent to your email for ${APP_NAME}.`,
      formTitle: "Verification code",
    },
    emailLink: {
      title: "Check your email",
      subtitle: `Use the verification link sent to your email for ${APP_NAME}.`,
      verified: {
        title: `Welcome to ${APP_NAME}`,
      },
    },
    phoneCode: {
      title: "Check your phone",
      subtitle: `Enter the verification code sent to your phone for ${APP_NAME}.`,
      formTitle: "Verification code",
    },
    continue: {
      title: `Finish setting up your ${APP_NAME} account`,
      subtitle: "Add any remaining details to complete your account.",
    },
    restrictedAccess: {
      title: `Access to ${APP_NAME}`,
      subtitle: `Sign-ups for ${APP_NAME} are currently restricted.`,
    },
  },
  reverification: {
    emailCode: {
      title: "Verify your email",
      subtitle: `Enter the verification code sent to your email for ${APP_NAME}.`,
    },
    phoneCode: {
      title: "Verify your phone",
      subtitle: `Enter the verification code sent to your phone for ${APP_NAME}.`,
    },
  },
  userProfile: {
    navbar: {
      title: APP_NAME,
      description: "Manage your account",
    },
  },
  billing: {
    checkout: {
      title: `Subscribe to ${APP_NAME}`,
      title__subscriptionSuccessful: `Welcome to ${APP_NAME}`,
      description__subscriptionSuccessful: `Your ${APP_NAME} subscription is now active.`,
    },
    subscribe: `Subscribe to ${APP_NAME}`,
    manageSubscription: `Manage your ${APP_NAME} subscription`,
  },
};
