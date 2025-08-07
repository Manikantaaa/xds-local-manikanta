"use client";

import React, { useEffect } from "react";

type StripePricingTableProps = {
  customerEmail: string;
};
const StripePricingTable = ({ customerEmail }: StripePricingTableProps) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return React.createElement("stripe-pricing-table", {
    "publishable-key": process.env.NEXT_PUBLIC_XDS_STRIPE_PUBLIC_KEY,
    "pricing-table-id": process.env.NEXT_PUBLIC_XDS_STRIPE_PRICING_TABLE_ID,
    "customer-email": customerEmail,
    "redirect-url": "http://localhost:3000/password",
  });
};

export default StripePricingTable;
