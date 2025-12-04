const path = require("path");

module.exports = {
  webpack: (config) => {
    config.resolve.alias["@/components"] = path.join(__dirname, "components");
    config.resolve.alias["@/styles"] = path.join(__dirname, "styles");
    return config;
  },
};
