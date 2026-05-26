export { auth, signIn, signOut, handlers } from "@/modules/auth/config";
export { requireUser, requireRole, getOptionalUser } from "@/modules/auth/rbac";
export { signInAction, type SignInState } from "@/modules/auth/actions/sign-in";
export { signUpAction, type SignUpState } from "@/modules/auth/actions/sign-up";
export { SignInForm } from "@/modules/auth/components/SignInForm";
export { SignUpForm } from "@/modules/auth/components/SignUpForm";
export { AuthHealthNotice } from "@/modules/auth/components/AuthHealthNotice";
export {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/modules/auth/schemas/credentials";
