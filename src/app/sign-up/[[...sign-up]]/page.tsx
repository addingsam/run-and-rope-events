import { SignUp } from "@clerk/nextjs";

export const metadata = {
  title: "Create account",
};

export default function SignUpPage() {
  return (
    <div className="mx-auto flex max-w-md justify-center px-4 py-16 sm:px-6">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/subscribe"
        fallbackRedirectUrl="/subscribe"
      />
    </div>
  );
}
