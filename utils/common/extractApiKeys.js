import _ from "lodash";

const extractApiKeys = (api, type = "bybit") => {
  const apiKeys = { apiKey: "" };

  if (api) {
    if (type === "bybit") {
      apiKeys["apiKey"] = _.get(api, "bybit.apiKey", "");
      apiKeys["secret"] = _.get(api, "bybit.secret", "");
    }

    return apiKeys;
  } else return apiKeys;
};

export default extractApiKeys;
