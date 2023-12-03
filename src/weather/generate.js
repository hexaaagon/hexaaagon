const fs = require("fs");
const axios = require("axios")(async () => {
  const { WEATHER_APIKEY, WEATHER_CODE } = process.env;

  const data = (
    await axios({
      method: "GET",
      url: `http://dataservice.accuweather.com/currentconditions/v1/${WEATHER_CODE}?apikey=${WEATHER_APIKEY}`,
    })
  ).data[0];

  const formattedData = {
    lastBuild: new Date(),
    dayTime: data.IsDayTime,
    weather: data.WeatherText,
    weatherIcon: data.WeatherIcon,
    temperature: {
      c: data.Temperature.Metric.Value,
      f: data.Temperature.Imperial.Value,
    },
  };

  fs.writeFileSync("./out/weather-data.json", JSON.stringify(formattedData));

  console.log("Done generating new weather data.");
})();
