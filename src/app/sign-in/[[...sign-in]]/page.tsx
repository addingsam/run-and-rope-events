import { SignIn } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk/appearance";

export const metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-md justify-center px-4 py-16 sm:px-6">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/events"
        fallbackRedirectUrl="/events"
        appearance={clerkAppearance}
      />
    </div>
  );
}
