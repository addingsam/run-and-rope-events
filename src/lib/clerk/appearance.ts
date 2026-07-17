const clerkTextPrimary = "#F2F1ED";
const clerkTextMuted = "#9BA3AC";
const clerkBackground = "#16181C";
const clerkSurface = "#1F2328";
const clerkInput = "#3A424B";
const clerkBorder = "#2E333A";
const clerkInputBorder = "#7A8A9A";
const clerkPrimary = "#3D6D8C";
const clerkCta = "#E0982E";

const otpCodeFieldInputClasses =
  "flex items-center justify-center min-h-[3.25rem] min-w-[2.75rem] flex-none text-2xl font-bold text-center text-[#f2f1ed] bg-[#3a424b] border-2 border-[#7a8a9a] rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)] data-[status=selected]:border-[#e0982e] data-[status=cursor]:border-[#e0982e] data-[status=hovered]:border-[#9ba3ac] data-[status=selected]:shadow-[0_0_0_3px_rgba(224,152,46,0.28)] data-[status=cursor]:shadow-[0_0_0_3px_rgba(224,152,46,0.28)]";

export const clerkAppearance = {
  variables: {
    colorPrimary: clerkPrimary,
    colorForeground: clerkTextPrimary,
    colorMutedForeground: clerkTextMuted,
    colorBackground: clerkBackground,
    colorInput: clerkInput,
    colorInputForeground: clerkTextPrimary,
    colorNeutral: clerkTextMuted,
    colorPrimaryForeground: clerkTextPrimary,
    colorBorder: clerkInputBorder,
    colorMuted: clerkSurface,
    borderRadius: "0.75rem",
    // Deprecated aliases — keep for older Clerk UI paths.
    colorText: clerkTextPrimary,
    colorTextSecondary: clerkTextMuted,
    colorInputText: clerkTextPrimary,
    colorInputBackground: clerkInput,
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
    formFieldLabel: "text-[#f2f1ed] font-semibold",
    formFieldInput: "text-[#f2f1ed] bg-[#3a424b] border-2 border-[#7a8a9a]",
    formFieldInputShowPasswordButton: "text-[#9ba3ac]",
    formButtonPrimary: "bg-[#e0982e] hover:bg-[#c98627] text-[#16181c]",
    footerActionText: "text-[#9ba3ac]",
    footerActionLink: "text-[#3d6d8c] hover:text-[#2a4f66]",
    identityPreviewText: "text-[#f2f1ed]",
    identityPreviewEditButton: "text-[#3d6d8c]",
    formResendCodeLink: "text-[#3d6d8c] hover:text-[#2a4f66]",
    otpCodeField: "w-full py-2",
    otpCodeFieldInputs: "flex w-full justify-center gap-3",
    otpCodeFieldInputContainer: "flex w-full justify-center gap-3 py-2",
    otpCodeFieldInput: otpCodeFieldInputClasses,
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
