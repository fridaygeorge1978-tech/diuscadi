import { AuthCard } from "./components/AuthCard";
import { AuthHeader } from "./components/AuthHeader";
import { SigninForm } from "./components/SigninForm";
import { AuthFooter } from "./components/Authfooter";

interface SigninPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SigninPage({ searchParams }: SigninPageProps) {

  const { redirect } = await searchParams;

  // Validate server-side too — only pass through internal paths
  const safeRedirect =
    redirect && redirect.startsWith("/") && !redirect.startsWith("//")
      ? decodeURIComponent(redirect)
      : undefined;
  
  return (
    <AuthCard>
      <AuthHeader
        title="Welcome Back"
        subtitle="Sign in to your DIUSCADI vault"
      />

      <SigninForm redirectTo={safeRedirect} />

      <AuthFooter type="signin" />
    </AuthCard>
  );
}
