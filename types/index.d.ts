export type AsyncpaySubscribeInterface = {
  publicKey: string;
  customerUUID: string;
  subscriptionPlanUUID: string;
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
