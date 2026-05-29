/// <reference types="expo/types" />

declare module "react-native-razorpay" {
  type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  type RazorpayOptions = Record<string, unknown>;

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<RazorpaySuccess>;
  }
}
