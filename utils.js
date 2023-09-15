const axios = require("axios");

async function convertTZ(fromTz, toTz, dateString) {
  const result = await axios.post(
    "https://timeapi.io/api/Conversion/ConvertTimeZone",
    (json = {
      fromTimeZone: fromTz,
      dateTime: dateString,
      toTimeZone: toTz,
      dstAmbiguity: "",
    })
  );

  return new Date(result.data.conversionResult.dateTime);
}

function getTZ() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

module.exports = {
  convertTZ,
  getTZ,
};
