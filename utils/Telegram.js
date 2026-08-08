const TelegramBot = require("node-telegram-bot-api").default || require("node-telegram-bot-api");
const bot = new TelegramBot(
  process.env.TELEGRAM_TOKEN,
  { polling: false }
);

const sendTelegramMessage = async (message) => {
  try {
    await bot.sendMessage(
      process.env.TELEGRAM_CHAT_ID,
      message
    );

    console.log("✅ Telegram notification sent");

  } catch (error) {
    console.log("❌ Telegram error:", error.message);
  }
};

module.exports = sendTelegramMessage;