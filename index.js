require("dotenv").config();
const fs = require("fs").promises;
const mongoose = require("mongoose");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const generateModel = require("./generateModels");
const commandToModelData = require("./commands");
const { v4: uuidv4 } = require("uuid");
const googleIt = require("google-it");
const {
  generateTextFromImage,
  processVoiceMessage,
  splitMessage,
} = require("./utils");
const ChatHistory = require("./mongodbModel");
const { chatGPT, GPT4, getPercentage } = require("./GPT-4");
const { markdownToTxt } = require("markdown-to-txt");

if (!process.env.TELEGRAM_TOKEN)
  throw new Error('"BOT_TOKEN" env var is required!');

const telegramToken = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(telegramToken);

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
    ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
  }
};
connectToDB();

bot.start(async (ctx) => {
  try {
    await ctx.reply(
      "*Привет!* 👋\n\n" +
        "Напиши мне что-нибудь и я постараюсь помочь! 😊\n\n" +
        "Также можешь отправить мне *голосовое сообщение* или *изображение*. Я попробую его понять и помочь с вашим вопросом 😉\n\n" +
        "Или используй команды: \n" +
        "/pg, /dalle, /prodia, /xlprodia, /xxlprodia,\n" +
        "/emi, /diffusion, /real, /render /journey,\n" +
        "/cyber, /pixelart, /anime, /anima для генерации картинок!\n\n" +
        "*Пример:*\n" +
        "*/pg spider-man*\n\n" +
        "Подобным запросом ты сгенерируешь фото человека паука!🕸 ️\n\n" +
        "Хочу заметить, что нейросеть лучше понимает запросы на генерации изображений на *английском языке*.",
      { parse_mode: "Markdown" }
    );
  } catch(e) {}
});

bot.command("clear", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
  await ChatHistory.findOneAndUpdate({ chatId }, { messages: [] });
  await ctx.reply("Контекст очищен! 🧹");
  } catch (e) {}
});

const rateLimitMap = new Map();

bot.on(message("text"), async (ctx) => {
 try {
  const userId = ctx.chat.id;
  const currentTime = Date.now();
  const requestLimit = 5;
  const timeWindow = 60000; // 60 seconds * 1000 milliseconds

  let loadingMessageToUser;
  try {
    if (rateLimitMap.has(userId)) {
      const userData = rateLimitMap.get(userId);
      if (currentTime - userData.timestamp < timeWindow) {
        if (userData.count >= requestLimit) {
          return await ctx.reply("Пожалуйста, подождите минуту и повторите снова.");
        }
        userData.count += 1;
      } else {
        userData.count = 1;
        userData.timestamp = currentTime;
      }
    } else {
      rateLimitMap.set(userId, { count: 1, timestamp: currentTime });
    }

    if (!ctx.message.text) {
      await ctx.reply("Пожалуйста, отправьте текстовое сообщение!");
    }
    try {
      loadingMessageToUser = await ctx.reply("Генерирую...🙂");
    } catch(e) {}
    const command = `${ctx.message.text.split(" ")[0]}`;
    if (command in commandToModelData) {
      await generateModel(
        ctx,
        loadingMessageToUser,
        commandToModelData[command]
      );
    } else {
      await chatGPT(ctx, loadingMessageToUser);
    }
  } catch (error) {
    try {
      console.error("Error handling message:", error);
   await ctx.reply("Произошла ошибка при обработке запроса. 😔");
    if (loadingMessageToUser) {
      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        loadingMessageToUser.message_id
      );
    }
    ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
    } catch(e) {}
  }
 } catch (e) {}
});

const mediaGroupStore = new Map();

const handleMedia = async (ctx, generateTextFromImage) => {
  try {
    const mediaGroupId = ctx.message.media_group_id;
    const largestPhoto = ctx.message.photo.pop();
    const fileId = largestPhoto.file_id;

    if (mediaGroupId) {
      if (!mediaGroupStore.has(mediaGroupId)) {
        mediaGroupStore.set(mediaGroupId, { fileIds: [] });
      }

      mediaGroupStore.get(mediaGroupId).fileIds.push(fileId);

      setTimeout(async () => {
        const mediaGroupData = mediaGroupStore.get(mediaGroupId);
        if (!mediaGroupData) return;

        const { fileIds } = mediaGroupData;

        mediaGroupStore.delete(mediaGroupId);

        const imageFilePaths = [];
        for (const fileId of fileIds) {
          let fileLink;
          try {
            fileLink = await bot.telegram.getFileLink(fileId);
          } catch (error) {
            console.error("Failed to get file link:", error);
           await ctx.reply(
              "An error occurred while getting the file link. Please try again."
            );
            ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
            return;
          }

          const response = await fetch(fileLink.href);
          const photoData = await response.arrayBuffer();
          const pathname = new URL(fileLink.href).pathname;
          const format = pathname.split("/").pop().split(".").pop();
          const inputFileName = `${uuidv4()}.${format}`;

          try {
            await fs.writeFile(inputFileName, new Uint8Array(photoData));
          } catch (error) {
            console.error("Failed to write file:", error);
           await ctx.reply(
              "An error occurred while writing the file. Please try again."
            );
            ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
            return;
          }

          imageFilePaths.push(inputFileName);
        }

        const loadingMessage = await ctx.reply("Генерирую...🙂");

        const userCaption = ctx.message.caption;
        if (userCaption) {
          const command = userCaption.split(" ")[0];
          if (command in commandToModelData) {
            const generatedText = await generateTextFromImage(
              imageFilePaths[0]
            );
            generateModel(
              ctx,
              loadingMessage,
              commandToModelData[command],
              `${generatedText} ${userCaption}`
            );
          } else {
            await chatGPT(ctx, loadingMessage, imageFilePaths);
          }
        } else {
          await chatGPT(ctx, loadingMessage, imageFilePaths);
        }

        for (const imageFilePath of imageFilePaths) {
          try {
            await fs.unlink(imageFilePath);
          } catch (error) {
            console.error("Failed to delete file:", error);
            ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
          }
        }
      }, 500);
    } else {
      let fileLink;
      try {
        fileLink = await bot.telegram.getFileLink(fileId);
      } catch (error) {
        console.error("Failed to get file link:", error);
      await ctx.reply(
          "An error occurred while getting the file link. Please try again."
        );
        ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
        return;
      }

      const response = await fetch(fileLink.href);
      const photoData = await response.arrayBuffer();
      const pathname = new URL(fileLink.href).pathname;
      const format = pathname.split("/").pop().split(".").pop();
      const inputFileName = `${uuidv4()}.${format}`;

      try {
        await fs.writeFile(inputFileName, new Uint8Array(photoData));
      } catch (error) {
        console.error("Failed to write file:", error);
        await ctx.reply(
          "An error occurred while writing the file. Please try again."
        );
        ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
        return;
      }

      const loadingMessage = await ctx.reply("Генерирую...🙂");

      const userCaption = ctx.message.caption;
      if (userCaption) {
        const command = userCaption.split(" ")[0];
        if (command in commandToModelData) {
          const generatedText = await generateTextFromImage(inputFileName);
          generateModel(
            ctx,
            loadingMessage,
            commandToModelData[command],
            `${generatedText} ${userCaption}`
          );
        } else {
          await chatGPT(ctx, loadingMessage, [inputFileName]);
        }
      } else {
        await chatGPT(ctx, loadingMessage, [inputFileName]);
      }

      try {
        await fs.unlink(inputFileName);
      } catch (error) {
        console.error("Failed to delete file:", error);
        ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
      }
    }
  } catch (error) {
    try {
      console.log(error);
    await ctx.reply("Произошла ошибка при обработке запроса. 😔");
    await ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
    } catch (e) {}
  }
};

bot.on(message("sticker"), async (ctx) => {
  try {
    await ctx.reply("Извините, я не говорю на языке стикеров! 😔");
  } catch (e) {}
});

bot.on("photo", async (ctx) => {
  try {
    await handleMedia(ctx, generateTextFromImage);
  } catch (e) {}
});

bot.on("voice", async (ctx) => {
  try {
    const chatId = ctx.chat.id;
  const username =
    ctx.message.from.username || ctx.message.from.first_name || "no username";

  let chat = await ChatHistory.findOne({ chatId });
  if (!chat) {
    chat = new ChatHistory({ chatId, username, messages: [] });
  }

  if (!chat.username) {
    chat.username = username;
  }

  if (!chat.messages) {
    chat.messages = [];
  }

  const loadingMessageToUser = await ctx.reply(
    "Пытаюсь распознать сообщение...👂"
  );
  const fileId = ctx.message.voice.file_id;
  const voiceLink = await bot.telegram.getFileLink(fileId);
  const response = await fetch(voiceLink.href);
  const voiceData = await response.arrayBuffer();
  const fileName = `${uuidv4()}.mp3`;
  await fs.writeFile(fileName, new Uint8Array(voiceData));

  try {
    const voiceResponse = await processVoiceMessage(fileName);
    const gotVoiceResponse = await ctx.reply("Генерирую ответ...🙂");
    const { chances } = await getPercentage(voiceResponse);
    const googleResult =
      chances > 75
        ? await googleIt({
            query: voiceResponse,
            "no-display": true,
          })
        : "";
    chat.messages.push({
      role: "user",
      content:
        googleResult !== ""
          ? voiceResponse +
            ". " +
            "\n\n" +
            "Google search results: " +
            JSON.stringify(googleResult)
          : voiceResponse,
    });
    await chat.save();

    const data = await GPT4(chat.messages);
    if (data instanceof Error) {
      throw new Error(data.message);
    }
    const response = markdownToTxt(data);
    chat.messages.push({ role: "assistant", content: response });

    ctx.telegram.deleteMessage(ctx.chat.id, loadingMessageToUser.message_id);
    ctx.telegram.deleteMessage(ctx.chat.id, gotVoiceResponse.message_id);

    if (response.length > 4096) {
      const chunks = splitMessage(response);
      for (const chunk of chunks) {
        await ctx.reply(chunk);
      }
    } else {
      await ctx.reply(response);
    }
    await chat.save();
  } catch (err) {
    console.log(err);
   await ctx.reply("Произошла ошибка при обработке голосового сообщения. 😔");
    ctx.telegram.sendMessage(process.env.ADMIN_ID, `${err}`);
  } finally {
    if (fileName) {
      await fs.unlink(fileName);
    }
  }
  } catch (e) {}
});

bot.catch(async (err, ctx) => {
  try {
    console.error("Ошибка:", err);
    await ctx.reply("Произошла ошибка при обработке запроса. 😔");
    ctx.telegram.sendMessage(process.env.ADMIN_ID, `${err}`);
  } catch (e) {}
});

try {
  bot.launch();
  console.log("Bot launched successfully");
} catch (error) {
  console.log(error);
  ctx.telegram.sendMessage(process.env.ADMIN_ID, `${error}`);
}

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
