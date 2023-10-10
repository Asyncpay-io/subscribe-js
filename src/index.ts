import { AsyncpaySubscribeInterface } from "../types";
import { validateUUID } from "./modules/validators";
import { getBaseURL, resolveError } from "./modules/helpers";
import { svg } from "./modules/svg-strings";

const killSession = () => {
  sessionStorage.removeItem("asyncpay-subscribe-is-in-session");
  const subscribeIframeWrapper = document.getElementById(
    "asyncpay-subscribe-sdk-wrapper",
  );
  if (subscribeIframeWrapper && subscribeIframeWrapper.parentNode) {
    subscribeIframeWrapper.parentNode.removeChild(subscribeIframeWrapper);
  }
};

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
  window.addEventListener("beforeunload", function () {
    sessionStorage.removeItem("asyncpay-subscribe-is-in-session");
  });
  try {
    if (document.getElementById("asyncpay-subscribe-sdk-wrapper")) {
      throw {
        error: "SDK_ERROR_SUBSCRIBE_IN_SESSION",
        error_code: "00002",
        error_description:
          "A subscribe process has already been initiated. You cannot run multiple subscribe sessions simultaneously.",
      };
    }
    if (sessionStorage.getItem("asyncpay-subscribe-is-in-session")) {
      throw {
        error: "SDK_ERROR_SUBSCRIBE_IN_SESSION",
        error_code: "00002",
        error_description:
          "A subscribe process has already been initiated. You cannot run multiple subscribe sessions simultaneously.",
      };
    }
    let customerOBJ = {};
    if (validateUUID(customerUUID)) {
      // Validate uuid and return an object containing the UUID that we'll later spread and send into the URL
      customerOBJ = { customer_uuid: customerUUID };
    } else {
      throw {
        error: "SDK_VALIDATION_ERROR",
        error_code: "00001",
        error_description: "Please provide a valid customer UUID.",
      };
    }
    if (!validateUUID(subscriptionPlanUUID)) {
      throw {
        error: "SDK_VALIDATION_ERROR",
        error_code: "00001",
        error_description: "Please provide a valid subscription plan UUID.",
      };
    }
    if (!publicKey) {
      throw {
        error: "SDK_VALIDATION_ERROR",
        error_code: "00001",
        error_description:
          "Please provide a public key `publicKey` to the AsyncpayCheckout function.",
      };
    }

    sessionStorage.setItem("asyncpay-subscribe-is-in-session", "true");

    const response = await fetch(
      `${getBaseURL(environment)}/v1/sdk/generate-subscription-url`,
      {
        method: "POST",
        body: JSON.stringify({
          ...customerOBJ,
          subscription_uuid: subscriptionPlanUUID,
        }),
        headers: {
          Authentication: `Bearer ${publicKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    const body = await response.json();
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
      `?public_key=${publicKey}${
        successURL ? `&success_url=${successURL}` : ""
      }${cancelURL ? `&cancel_url=${cancelURL}` : ""}`;
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
      console.log(event.data);
    });
  } catch (e) {
    killSession();
    let resolvedError = resolveError(e);
    if (typeof onError === "function") {
      onError(resolvedError);
    }
    throw resolvedError;
  }
};
