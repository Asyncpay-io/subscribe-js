import { AsyncpaySubscribeInterface } from "../types";
import { validateUUID } from "./modules/validators";
import { getBaseURL, resolveError } from "./modules/helpers";
import { svg } from "./modules/svg-strings";

export const AsyncpaySubscribe = async ({
  publicKey,
  customerUUID,
  subscriptionPlanUUID,
  environment = "prod",
  successURL,
  cancelURL,
  onClose,
  onCancel,
  onError,
  onSuccess,
}: AsyncpaySubscribeInterface) => {
  const unsetSubscribeSession = (error: any = null) => {
    sessionStorage.removeItem("asyncpay-subscribe-is-in-session");
    const subscribeIframeWrapper = document.getElementById(
      "asyncpay-subscribe-sdk-wrapper",
    );
    if (subscribeIframeWrapper && subscribeIframeWrapper.parentNode) {
      subscribeIframeWrapper.parentNode.removeChild(subscribeIframeWrapper);
    }
    if (error) {
      if (typeof onError === "function") {
        if (!(typeof error === "object" && error.doNotThrow)) {
          onError(resolveError(error));
        }
      }
      if (typeof error === "string") {
        throw {
          ...resolveError(error),
          doNotThrow: true,
        };
      } else {
        throw {
          ...error,
          doNotThrow: true,
        };
      }
    }
  };
  window.addEventListener("beforeunload", function () {
    sessionStorage.removeItem("asyncpay-subscribe-is-in-session");
  });
  try {
    if (document.getElementById("asyncpay-subscribe-sdk-wrapper")) {
      unsetSubscribeSession({
        error: "SDK_ERROR_SUBSCRIBE_IN_SESSION",
        error_code: "00002",
        error_description:
          "A subscribe process has already been initiated. You cannot run multiple subscribe sessions simultaneously.",
      });
    }
    if (sessionStorage.getItem("asyncpay-subscribe-is-in-session")) {
      unsetSubscribeSession({
        error: "SDK_ERROR_SUBSCRIBE_IN_SESSION",
        error_code: "00002",
        error_description:
          "A subscribe process has already been initiated. You cannot run multiple subscribe sessions simultaneously.",
      });
    }
    let customerOBJ = {};
    if (validateUUID(customerUUID)) {
      // Validate uuid and return an object containing the UUID that we'll later spread and send into the URL
      customerOBJ = { customer_uuid: customerUUID };
    } else {
      unsetSubscribeSession({
        error: "SDK_VALIDATION_ERROR",
        error_code: "00001",
        error_description: "Please provide a valid customer UUID.",
      });
    }
    if (!validateUUID(subscriptionPlanUUID)) {
      unsetSubscribeSession({
        error: "SDK_VALIDATION_ERROR",
        error_code: "00001",
        error_description: "Please provide a valid subscription plan UUID.",
      });
    }
    if (!publicKey) {
      unsetSubscribeSession({
        error: "SDK_VALIDATION_ERROR",
        error_code: "00001",
        error_description:
          "Please provide a public key `publicKey` to the AsyncpaySubscribe function.",
      });
    }

    sessionStorage.setItem("asyncpay-subscribe-is-in-session", "true");

    const response = await fetch(
      `${getBaseURL(environment)}/v1/sdk/generate-subscription-url`,
      {
        method: "POST",
        body: JSON.stringify({
          ...customerOBJ,
          subscription_plan_uuid: subscriptionPlanUUID,
        }),
        headers: {
          Authentication: `Bearer ${publicKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    const body = await response.json();
    console.log("Response is", body);
    if (!response.ok) {
      throw body;
    }

    const subscribeIframeWrapper = document.createElement("div");
    subscribeIframeWrapper.id = "asyncpay-subscribe-sdk-wrapper";
    subscribeIframeWrapper.style.position = "fixed";
    subscribeIframeWrapper.style.top = "0";
    subscribeIframeWrapper.style.left = "0";
    subscribeIframeWrapper.style.width = "100%";
    subscribeIframeWrapper.style.height = "100%";
    subscribeIframeWrapper.style.zIndex = "99999999999";
    subscribeIframeWrapper.style.border = "none";
    subscribeIframeWrapper.style.background = "rgba(0,0,0,0.5)";
    const loader = document.createElement("div");
    loader.style.display = "flex";
    loader.style.alignItems = "center";
    loader.style.justifyContent = "center";
    loader.style.position = "fixed";
    loader.style.top = "0";
    loader.style.left = "0";
    loader.style.zIndex = "99999";
    loader.style.height = "100%";
    loader.style.width = "100%";
    loader.innerHTML = svg;
    subscribeIframeWrapper.appendChild(loader);
    const iframe = document.createElement("iframe");
    iframe.style.opacity = "0";
    iframe.style.transition = ".8s";
    iframe.src =
      body.data.link +
      `&public_key=${publicKey}${
        successURL ? `&success_redirect_url=${successURL}` : ""
      }${cancelURL ? `&cancel_redirect_url=${cancelURL}` : ""}`;
    iframe.width = "100%";
    iframe.height = "100%";
    iframe.style.border = "none";
    iframe.onload = () => {
      loader.style.display = "none";
      iframe.style.opacity = "1";
    };
    subscribeIframeWrapper.appendChild(iframe);
    document.body.appendChild(subscribeIframeWrapper);

    window.addEventListener("message", function (event) {
      let eventData = event.data;
      console.log(eventData);
      if (typeof eventData === "string") {
        eventData = JSON.parse(eventData);
      }

      switch (eventData.eventType) {
        case "closeIframe":
          if (eventData.intent === "cancel") {
            if (cancelURL) {
              location.href = cancelURL;
            } else {
              if (onCancel && typeof onCancel === "function") {
                onCancel();
              }
            }
          }
          if (onClose && typeof onClose === "function") {
            onClose();
          }
          break;
        case "successfulSubscription":
          if (successURL) {
            unsetSubscribeSession();

            location.href = successURL;
          } else {
            unsetSubscribeSession();

            if (onSuccess && typeof onSuccess === "function") {
              onSuccess(eventData.planDetails);
            }
          }
          break;
      }
    });
  } catch (err) {
    unsetSubscribeSession(err);
  }
};
