import { ResetPasswordCard } from "@/features/auth/components/reset-password-card";

interface ResetPasswordPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

const ResetPasswordPage = ({ searchParams }: ResetPasswordPageProps) => {
  const rawToken = searchParams?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken ?? "";

  return (
    <div className="h-full flex items-center justify-center bg-[#5C3B58]">
      <div className="md:h-auto md:w-[420px]">
        <ResetPasswordCard token={token} />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
