import { auth } from "../../utils/firebase";
import { sendEmailVerification } from "firebase/auth";

const EmailVerification = () => {
  const handleResend = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
      alert("Verification email resent!");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded text-center">
      <h2 className="text-2xl font-bold mb-4">Verify Your Email</h2>
      <p>Please check your inbox and verify your email address.</p>
      <button
        onClick={handleResend}
        className="mt-3 bg-blue-500 text-white py-2 px-4 rounded"
      >
        Resend Verification Email
      </button>
    </div>
  );
};

export default EmailVerification;
