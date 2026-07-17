const clerkTextPrimary = "#F2F1ED";
const clerkTextSecondary = "#D8D6D0";
const clerkTextMuted = "#B8C0C8";
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
    colorPrimary: clerkCta,
    colorForeground: clerkTextPrimary,
    colorMutedForeground: clerkTextMuted,
    colorBackground: clerkBackground,
    colorInput: clerkInput,
    colorInputForeground: clerkTextPrimary,
    colorNeutral: clerkTextSecondary,
    colorPrimaryForeground: clerkBackground,
    colorBorder: clerkInputBorder,
    colorMuted: clerkSurface,
    borderRadius: "0.75rem",
    colorText: clerkTextPrimary,
    colorTextSecondary: clerkTextMuted,
    colorInputText: clerkTextPrimary,
    colorInputBackground: clerkInput,
  },
  elements: {
    rootBox: "text-[#f2f1ed]",
    cardBox: "text-[#f2f1ed]",
    card: "shadow-sm border border-[#2e333a] bg-[#16181c] text-[#f2f1ed]",
    modalContent: "bg-[#16181c] text-[#f2f1ed]",
    modalCloseButton: "text-[#f2f1ed] hover:text-[#ffffff]",
    headerTitle: "text-[#f2f1ed]",
    headerSubtitle: "text-[#d8d6d0]",
    formHeaderTitle: "text-[#f2f1ed]",
    formHeaderSubtitle: "text-[#d8d6d0]",
    socialButtonsBlockButton: "text-[#f2f1ed] border-[#7a8a9a] bg-[#1f2328]",
    socialButtonsBlockButtonText: "text-[#f2f1ed] font-medium",
    dividerLine: "bg-[#7a8a9a]",
    dividerText: "text-[#d8d6d0]",
    formFieldLabel: "text-[#f2f1ed] font-semibold",
    formFieldHintText: "text-[#d8d6d0]",
    formFieldErrorText: "text-[#fca5a5]",
    formFieldInput: "text-[#f2f1ed] bg-[#3a424b] border-2 border-[#7a8a9a] placeholder:text-[#b8c0c8]",
    formFieldInputShowPasswordButton: "text-[#d8d6d0] hover:text-[#f2f1ed]",
    formButtonPrimary: "bg-[#e0982e] hover:bg-[#c98627] text-[#16181c] font-semibold",
    formButtonReset: "text-[#f0c070] hover:text-[#f2f1ed]",
    footer: "text-[#d8d6d0]",
    footerActionText: "text-[#d8d6d0]",
    footerActionLink: "text-[#f0c070] hover:text-[#f2f1ed] font-semibold",
    identityPreviewText: "text-[#f2f1ed]",
    identityPreviewEditButton: "text-[#f0c070] hover:text-[#f2f1ed]",
    formResendCodeLink: "text-[#f0c070] hover:text-[#f2f1ed] font-semibold",
    otpCodeField: "w-full py-2",
    otpCodeFieldInputs: "flex w-full justify-center gap-3",
    otpCodeFieldInputContainer: "flex w-full justify-center gap-3 py-2",
    otpCodeFieldInput: otpCodeFieldInputClasses,
    alternativeMethodsBlockButton: "text-[#f2f1ed] border-[#7a8a9a] bg-[#1f2328]",
    backLink: "text-[#f0c070] hover:text-[#f2f1ed] font-semibold",
    alertText: "text-[#f2f1ed]",
    navbar: "text-[#f2f1ed]",
    navbarButton: "text-[#f2f1ed]",
    formFieldAction: "text-[#f0c070] hover:text-[#f2f1ed] font-semibold",
    main: "text-[#f2f1ed]",
    scrollBox: "text-[#f2f1ed]",
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
    userButtonPopoverCard: "bg-[#16181c] border border-[#2e333a] text-[#f2f1ed]",
    userButtonPopoverActionButton: "text-[#f2f1ed] hover:bg-[#1f2328]",
    userButtonPopoverActionButtonText: "text-[#f2f1ed]",
    userButtonPopoverFooter: "text-[#d8d6d0]",
  },
};
