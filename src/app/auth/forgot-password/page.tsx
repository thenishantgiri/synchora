import { ForgotPasswordCard } from "@/features/auth/components/forgot-password-card";

const ForgotPasswordPage = () => {
  return (
    <div className="h-full flex items-center justify-center bg-[#5C3B58]">
      <div className="md:h-auto md:w-[420px]">
        <ForgotPasswordCard />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
