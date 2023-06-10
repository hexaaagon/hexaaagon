const {
  WebhookClient,
  EmbedBuilder,
  Colors,
  AttachmentBuilder,
} = require("discord.js");
const fs = require("fs");
(async () => {
  /// Fetching Information
  console.log("Fetch some information to build...");
  // Weather
  const axios = require("axios");

  let info = {};

  const weatherApi = "http://dataservice.accuweather.com";
  const weatherIcon = "https://developer.accuweather.com/sites/default/files";
  const weatherCode = "3430611";
  const env = process.env;

  const weatherBody = (
    await axios.default({
      method: "GET",
      url: `${weatherApi}/currentconditions/v1/${weatherCode}?apikey=${env.WEATHER_APIKEY}`,
    })
  ).data[0];

  info.weather = {
    degree: {
      C: weatherBody.Temperature.Metric.Value,
      F: weatherBody.Temperature.Imperial.Value,
    },
    condition: weatherBody.IsDayTime ? "Day" : "Night",
    icon: `${weatherIcon}/${("0" + weatherBody.WeatherIcon).slice(-2)}-s.png`,
    text: weatherBody.WeatherText,
  };

  // Last Workflows Build
  const moment = require("moment");
  require("moment-duration-format");

  info.utcTime = moment.utc().format("hh:mm");

  // Local Time
  require("moment-timezone");
  info.localTime = moment().tz("Asia/Jakarta");

  // Birthday
  const date = moment("2023-08-02").tz("Asia/Jakarta");
  const dateRightNow = moment().tz("Asia/Jakarta");

  const checkBirthday = () =>
    new Promise((res) => {
      if (dateRightNow.isSame(date, "day")) {
        date.add(1, "year");
        info.birthdayRelative = "Happening in this day! (WIB)";
        res(true);
      } else if (dateRightNow.isAfter(date, "day")) {
        date.add(1, "year");
        checkBirthday();
      } else {
        info.birthdayRelative = `${date.fromNow()}`;
        res(true);
      }
    });
  checkBirthday();

  /// Load & Generate Images
  console.log("Fetching information done! generating image...");
  const { createCanvas, loadImage, registerFont, Image } = require("canvas");
  const canvas = createCanvas(550, 350);
  const ctx = canvas.getContext("2d");

  registerFont("./src/Poppins.ttf", { family: "Poppins" });

  loadImage("./src/base-image.png").then(async (image) => {
    ctx.drawImage(image, 0, 0);

    // Last Workflows build
    ctx.font = "12.5px Poppins";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(`${info.utcTime} UTC`, 486, 48);

    // Weather
    ctx.font = "12.2px Poppins";
    ctx.textAlign = "left";
    ctx.fillText(
      `${info.weather.text}! (${info.weather.degree.C}°C | ${info.weather.degree.F}°F)`,
      163,
      155.5
    );

    // Local Time
    ctx.font = "12.2px Poppins";
    ctx.fillText(
      `${info.localTime.format("ha z")} (${info.localTime.format(
        "[Around ≈≈] hh:mm"
      )})`,
      272,
      216
    );

    // Birthday
    ctx.font = "12.2px Poppins";
    ctx.fillText(`(${info.birthdayRelative})`, 239, 249);

    // Save Image

    const data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(data, "base64");
    require("fs").writeFileSync("./out/image.png", buf);
  });

  /// Sending the data into the discord webhook
  console.log(
    "Creating the image done! Sending data to the discord using webhook."
  );
  const lastMessageExist = fs.existsSync("./src/lastMessageID.json");
  const webhook = new WebhookClient({ url: process.env.WEBHOOK_URL });

  const attachment = new AttachmentBuilder("./out/image.png");

  const body = {
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setDescription(
          `About Me Image just updated <t:${Math.floor(Date.now() / 1000)}:R>.`
        )
        .setImage("attachment://image.png"),
    ],
    files: [attachment],
  };

  if (lastMessageExist) {
    await webhook.editMessage(
      JSON.parse(fs.readFileSync("./src/lastMessageID.json")),
      body
    );
  } else {
    const { id } = await webhook.send(body);
    fs.writeFileSync("./src/lastMessageID.json", JSON.stringify(id));
  }

  // Print Done
  console.log("Done! You're good to go.");
})();
