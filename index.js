require('dotenv').config()
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const modelsData = require('./models')
const chatGPT = require('./chatGPT')
const generateModel = require('./generateModels')

if (!process.env.TELEGRAM_TOKEN)
  throw new Error('"BOT_TOKEN" env var is required!')

const telegramToken = process.env.TELEGRAM_TOKEN
const bot = new Telegraf(telegramToken)

const {
  ALLOWED_CHAT_ID1,
  ALLOWED_CHAT_ID2,
  ALLOWED_CHAT_ID3,
  ALLOWED_CHAT_ID4,
  ALLOWED_CHAT_ID5,
} = process.env

const allowedChatIds = (...ids) => [...ids]
const allowedChats = allowedChatIds(
  ALLOWED_CHAT_ID1,
  ALLOWED_CHAT_ID2,
  ALLOWED_CHAT_ID3,
  ALLOWED_CHAT_ID4,
  ALLOWED_CHAT_ID5
)

bot.start(ctx => {
  ctx.reply('Привет! 👋')
  ctx.reply('Напиши мне что-нибудь и я постараюсь помочь! 😊')
  ctx.reply(
    'Или используй команды /dalle, /prodia, /render, /pixelart, /emi, /diffusion, /xlprodia'
  )
})

bot.on(message('sticker'), ctx => ctx.reply('I dont speak stickers! 🤏'))

bot.catch((err, ctx) => {
  console.error('Ошибка:', err)
  ctx.reply('Произошла ошибка при обработке запроса. 😔')
})

bot.on(message('text'), async ctx => {
  if (!ctx.message.text) {
    ctx.reply('Пожалуйста, отправьте текстовое сообщение!')
  }
  if (allowedChats.includes(ctx.chat.id.toString())) {
    console.log(ctx.message.from.first_name, ctx.message.text)
    const loadingMessageToUser = await ctx.reply('Генерирую...')

    if (ctx.message.text.startsWith('/dalle')) {
      generateModel(ctx, loadingMessageToUser, modelsData[0])
    } else if (ctx.message.text.startsWith('/prodia')) {
      generateModel(ctx, loadingMessageToUser, modelsData[1])
    } else if (ctx.message.text.startsWith('/render')) {
      generateModel(ctx, loadingMessageToUser, modelsData[2])
    } else if (ctx.message.text.startsWith('/pixelart')) {
      generateModel(ctx, loadingMessageToUser, modelsData[3])
    } else if (ctx.message.text.startsWith('/emi')) {
      generateModel(ctx, loadingMessageToUser, modelsData[4])
    } else if (ctx.message.text.startsWith('/diffusion')) {
      generateModel(ctx, loadingMessageToUser, modelsData[5])
    } else if (ctx.message.text.startsWith('/xlprodia')) {
      generateModel(ctx, loadingMessageToUser, modelsData[6])
    } else {
      chatGPT(ctx, loadingMessageToUser)
    }
  } else {
    ctx.reply('У вас нет прав для использования этого бота!')
  }
})

bot.launch()
console.log('bot launched')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
