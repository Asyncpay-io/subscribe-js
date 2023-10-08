export type Customer = {
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};

export type AsyncpaySubscribeInterface = {
  publicKey: string;
  customerEmail?: string;
  customerUUID?: string;
  customer: Customer;
  subscriptionPlanUUID?: string;
  environment?: "dev" | "local" | "prod";
  successURL?: string;
  cancelURL?: string;
  onClose?: Function;
  onCancel?: Function;
  onError?: Function;
  onSuccess?: Function;
};

export type Error = {
  error: string;
  error_code: string;
  error_description: string;
};
