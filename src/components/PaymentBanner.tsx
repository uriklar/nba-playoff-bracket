import React, { useState } from "react";

interface PaymentBannerProps {
  paymentInstructions: string | null;
  isPaid: boolean;
  isAdmin: boolean;
}

const PaymentBanner: React.FC<PaymentBannerProps> = ({
  paymentInstructions,
  isPaid,
  isAdmin,
}) => {
  const [dismissed, setDismissed] = useState(false);

  // Don't show if: no instructions set, user already paid, user is admin, or dismissed this session
  if (!paymentInstructions || isPaid || isAdmin || dismissed) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="container mx-auto px-4 py-3 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">Payment Required</p>
          <p className="text-sm text-amber-700 mt-1 whitespace-pre-line">
            {paymentInstructions}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-600 hover:text-amber-800 flex-shrink-0"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PaymentBanner;
