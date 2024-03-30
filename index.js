require('dotenv').config()
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const { gpt } = require('gpti')

if (!process.env.TELEGRAM_TOKEN)
  throw new Error('"BOT_TOKEN" env var is required!')

const allowedChatId1 = process.env.ALLOWED_CHAT_ID1
const allowedChatId2 = process.env.ALLOWED_CHAT_ID2
const allowedChatId3 = process.env.ALLOWED_CHAT_ID3
const allowedUsers = [allowedChatId1, allowedChatId2, allowedChatId3]
const telegramToken = process.env.TELEGRAM_TOKEN
const bot = new Telegraf(telegramToken)

bot.start(ctx => {
  ctx.reply('Привет! 👋')
  ctx.reply('Напиши мне что-нибудь и я постараюсь помочь! 😊')
})

bot.on(message('sticker'), ctx => ctx.reply('Немного не понимаю стикеры! 🤏'))

bot.catch((err, ctx) => {
  console.error('Ошибка:', err)
  ctx.reply('Произошла ошибка при обработке запроса.')
})

bot.on(message('text'), async ctx => {
  if (allowedUsers.includes(ctx.chat.id.toString())) {
    console.log(ctx.message.text)
    const loadingMessageToUser = await ctx.reply('Генерирую...')

    gpt(
      {
        messages: [
          {
            role: 'user',
            content: ctx.message.text,
          },
        ],
        model: 'GPT-4',
        markdown: false,
      },
      (err, data) => {
        if (err !== null) {
          console.log(err)
        } else {
          console.log(data)
          ctx.telegram.editMessageText(
            ctx.chat.id,
            loadingMessageToUser.message_id,
            undefined,
            data.gpt
          )
        }
      }
    )
  } else {
    ctx.reply('У вас нет прав для использования этого бота!')
  }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
