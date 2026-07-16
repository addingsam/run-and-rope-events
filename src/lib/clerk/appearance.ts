const clerkTextPrimary = "#F2F1ED";
const clerkTextMuted = "#9BA3AC";
const clerkBackground = "#16181C";
const clerkSurface = "#1F2328";
const clerkBorder = "#2E333A";
const clerkPrimary = "#3D6D8C";
const clerkCta = "#E0982E";

export const clerkAppearance = {
  variables: {
    colorPrimary: clerkPrimary,
    colorForeground: clerkTextPrimary,
    colorMutedForeground: clerkTextMuted,
    colorBackground: clerkBackground,
    colorInput: clerkSurface,
    colorInputForeground: clerkTextPrimary,
    colorNeutral: clerkTextMuted,
    colorPrimaryForeground: clerkTextPrimary,
    colorBorder: clerkBorder,
    colorMuted: clerkSurface,
    borderRadius: "0.75rem",
    // Deprecated aliases — keep for older Clerk UI paths.
    colorText: clerkTextPrimary,
    colorTextSecondary: clerkTextMuted,
    colorInputText: clerkTextPrimary,
    colorInputBackground: clerkSurface,
  },
  elements: {
    card: "shadow-sm border border-[#2e333a] bg-[#16181c] text-[#f2f1ed]",
    modalContent: "bg-[#16181c] text-[#f2f1ed]",
    modalCloseButton: "text-[#f2f1ed] hover:text-[#d8d6d0]",
    headerTitle: "text-[#f2f1ed]",
    headerSubtitle: "text-[#9ba3ac]",
    socialButtonsBlockButton: "text-[#f2f1ed] border-[#2e333a] bg-[#1f2328]",
    socialButtonsBlockButtonText: "text-[#f2f1ed]",
    dividerLine: "bg-[#2e333a]",
    dividerText: "text-[#9ba3ac]",
    formFieldLabel: "text-[#f2f1ed]",
    formFieldInput: "text-[#f2f1ed] bg-[#1f2328] border-[#2e333a]",
    formFieldInputShowPasswordButton: "text-[#9ba3ac]",
    formButtonPrimary: "bg-[#e0982e] hover:bg-[#c98627] text-[#16181c]",
    footerActionText: "text-[#9ba3ac]",
    footerActionLink: "text-[#3d6d8c] hover:text-[#2a4f66]",
    identityPreviewText: "text-[#f2f1ed]",
    identityPreviewEditButton: "text-[#3d6d8c]",
    formResendCodeLink: "text-[#3d6d8c] hover:text-[#2a4f66]",
    otpCodeFieldInput: "text-[#f2f1ed] bg-[#1f2328] border-[#2e333a]",
    alternativeMethodsBlockButton: "text-[#f2f1ed]",
    backLink: "text-[#3d6d8c] hover:text-[#2a4f66]",
    alertText: "text-[#f2f1ed]",
  },
};

export const clerkHeaderAppearance = {
  variables: {
    colorText: clerkPrimary,
    colorNeutral: clerkPrimary,
  },
  elements: {
    userButtonTrigger: "text-[#3D6D8C] focus:shadow-none",
    userButtonAvatarBox:
      "border border-[#3D6D8C] ring-0 [&_svg]:text-[#3D6D8C] [&_svg]:fill-[#3D6D8C]",
  },
};
