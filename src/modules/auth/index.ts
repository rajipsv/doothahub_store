export { auth, signIn, signOut, handlers } from "@/modules/auth/config";
export { requireUser, requireRole, getOptionalUser } from "@/modules/auth/rbac";
export { signInAction, type SignInState } from "@/modules/auth/actions/sign-in";
export { signUpAction, type SignUpState } from "@/modules/auth/actions/sign-up";
export { signOutAction } from "@/modules/auth/actions/sign-out";
export { SignInForm } from "@/modules/auth/components/SignInForm";
export { SignUpForm } from "@/modules/auth/components/SignUpForm";
export { SignOutButton } from "@/modules/auth/components/SignOutButton";
export { AuthHealthNotice } from "@/modules/auth/components/AuthHealthNotice";
export {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/modules/auth/schemas/credentials";
