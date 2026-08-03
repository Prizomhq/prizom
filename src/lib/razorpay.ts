import Razorpay from 'razorpay';

const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

export const razorpayClient = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
});

export function isRazorpayConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) &&
    Boolean(process.env.RAZORPAY_KEY_SECRET) &&
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== 'rzp_test_placeholder'
  );
}
