require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');
const { message } = require('telegraf/filters');
const { chatGPT } = require('./chatGPT');
const generateModel = require('./generateModels');
const commandToModelData = require('./commands');
const { v4: uuidv4 } = require('uuid');
const { gpt } = require('gpti');
const {
  generateTextFromImage,
  processVoiceMessage,
  processReadingFromImage,
} = require('./utils');
const { allowedChats } = require('./allowedChats');
const ChatHistory = require('./mongodbModel');

if (!process.env.TELEGRAM_TOKEN)
  throw new Error('"BOT_TOKEN" env var is required!');

const telegramToken = process.env.TELEGRAM_TOKEN;
const bot = new Telegraf(telegramToken);

const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    console.log('Connected to MongoDB');
  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
  }
};
connectToDB();

bot.start((ctx) => {
  ctx.reply('Привет! 👋');
  ctx.reply('Напиши мне что-нибудь и я постараюсь помочь! 😊');
  ctx.reply(
    'Также можешь отправить мне голосовое сообщение. Я попробую его понять и ответить на него 😉'
  );
  ctx.reply(
    'Или используй команды /pg, /dalle, /prodia, /xlprodia, /xxlprodia, /emi, /diffusion, /real, /render /journey, /cyber, /pixelart, /anime, /anima'
  );
});

bot.command('clear', async (ctx) => {
  const chatId = ctx.chat.id;
  await ChatHistory.findOneAndUpdate({ chatId }, { messages: [] });
  ctx.reply('Контекст очищен! 🧹');
});

bot.on(message('text'), async (ctx) => {
  if (!ctx.message.text) {
    ctx.reply('Пожалуйста, отправьте текстовое сообщение!');
  }
  if (allowedChats.includes(ctx.chat.id.toString())) {
    console.log(ctx.message.from.first_name, ctx.message.text);
    const loadingMessageToUser = await ctx.reply('Генерирую...🙂');
    const command = `${ctx.message.text.split(' ')[0]}`;
    if (command in commandToModelData) {
      generateModel(ctx, loadingMessageToUser, commandToModelData[command]);
    } else {
      chatGPT(ctx, loadingMessageToUser);
    }
  } else {
    ctx.reply('У вас нет прав для использования этого бота!');
  }
});

const handleMedia = async (
  ctx,
  fileId,
  loadingMessage,
  generateTextFromImage
) => {
  let inputFileName;
  try {
    const largestPhoto = ctx.message.photo.pop();
    const fileLink = await bot.telegram.getFileLink(largestPhoto.file_id);
    const response = await fetch(fileLink.href);
    const photoData = await response.arrayBuffer();
    const pathname = new URL(fileLink.href).pathname;
    const format = pathname.split('/').pop().split('.').pop();
    inputFileName = `${uuidv4()}.${format}`;
    fs.writeFileSync(inputFileName, new Uint8Array(photoData));

    const userCaption = ctx.message.caption;
    console.log('user caption', userCaption);

    if (userCaption) {
      const command = userCaption.split(' ')[0];
      if (command in commandToModelData) {
        const generatedText = await generateTextFromImage(inputFileName);
        console.log('ai caption', generatedText);
        generateModel(
          ctx,
          loadingMessage,
          commandToModelData[command],
          `${generatedText} ${userCaption}`
        );
      } else {
        const tesseractResponse = await processReadingFromImage(
          `${inputFileName}`
        );
        chatGPT(ctx, loadingMessage, tesseractResponse);
      }
    } else {
      const tesseractResponse = await processReadingFromImage(
        `${inputFileName}`
      );

      chatGPT(ctx, loadingMessage, tesseractResponse);
    }
  } catch (error) {
    console.log(error);
    ctx.reply('Произошла ошибка при обработке запроса. 😔');
  } finally {
    if (inputFileName) {
      fs.unlinkSync(inputFileName);
    }
  }
};

bot.on(message('sticker'), async (ctx) => {
  const loadingMessageToUser = await ctx.reply('Генерирую фото...');
  await handleMedia(
    ctx,
    ctx.message.sticker.file_id,
    loadingMessageToUser,
    generateTextFromImage
  );
});

bot.on('photo', async (ctx) => {
  const loadingMessageToUser = await ctx.reply('Генерирую...🙂');
  await handleMedia(
    ctx,
    ctx.message.photo[0].file_id,
    loadingMessageToUser,
    generateTextFromImage
  );
});

bot.on('voice', async (ctx) => {
  const chatId = ctx.chat.id;

  let chat = await ChatHistory.findOne({ chatId });
  if (!chat) {
    chat = new ChatHistory({ chatId, messages: [] });
  }

  const loadingMessageToUser = await ctx.reply(
    'Пытаюсь распознать сообщение...👂'
  );
  const fileId = ctx.message.voice.file_id;
  const voiceLink = await bot.telegram.getFileLink(fileId);
  const response = await fetch(voiceLink.href);
  const voiceData = await response.arrayBuffer();
  const fileName = `${uuidv4()}.mp3`;
  fs.writeFileSync(fileName, new Uint8Array(voiceData));

  try {
    const voiceResponse = await processVoiceMessage(fileName);
    console.log('voice response', voiceResponse);
    const gotVoiceResponse = await ctx.reply('Генерирую ответ...🙂');
    chat.messages.push({ role: 'user', content: voiceResponse });
    await chat.save();

    gpt(
      {
        messages: chat.messages,
        model: 'GPT-4',
        markdown: false,
      },
      async (err, data) => {
        if (err) {
          console.log(err);
          ctx.reply('Произошла ошибка при обработке запроса. 😔');
        } else {
          ctx.reply(data.gpt, { parse_mode: 'Markdown' });
          console.log('голосовое сообщение', data.gpt);
          ctx.telegram.deleteMessage(
            ctx.chat.id,
            loadingMessageToUser.message_id
          );
          ctx.telegram.deleteMessage(ctx.chat.id, gotVoiceResponse.message_id);
          fs.unlinkSync(fileName);
        }
        chat.messages.push({ role: 'assistant', content: data.gpt });
        await chat.save();
      }
    );
  } catch (err) {
    console.log(err);
    ctx.reply('Произошла ошибка при обработке голосового сообщения. 😔');
  }
});

bot.catch((err, ctx) => {
  console.error('Ошибка:', err);
  ctx.reply('Произошла ошибка при обработке запроса. 😔');
});

bot.launch();
console.log('bot launched');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
