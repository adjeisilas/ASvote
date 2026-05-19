import axios from "axios";

export const verifyPaystackPayment = async (reference: string) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }

  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    }
  );
  return response.data;
};

export const initializePaystackCharge = async (payload: any) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error("PAYSTACK_SECRET_KEY not configured");
  }

  const response = await axios.post('https://api.paystack.co/charge', payload, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
  });
  return response.data;
};
