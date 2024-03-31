const fs = require('fs')
const path = require('path')
require('dotenv').config()
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const { gpt, dalle } = require('gpti')
const sharp = require('sharp')

if (!process.env.TELEGRAM_TOKEN)
  throw new Error('"BOT_TOKEN" env var is required!')

const telegramToken = process.env.TELEGRAM_TOKEN
const bot = new Telegraf(telegramToken)

const {
  ALLOWED_CHAT_ID1,
  ALLOWED_CHAT_ID2,
  ALLOWED_CHAT_ID3,
  ALLOWED_CHAT_ID4,
} = process.env

const allowedChatIds = (...ids) => [...ids]
const allowedChats = allowedChatIds(
  ALLOWED_CHAT_ID1,
  ALLOWED_CHAT_ID2,
  ALLOWED_CHAT_ID3,
  ALLOWED_CHAT_ID4
)

bot.start(ctx => {
  ctx.reply('Привет! 👋')
  ctx.reply('Напиши мне что-нибудь и я постараюсь помочь! 😊')
})

bot.on(message('sticker'), ctx => ctx.reply('I dont speak stickers! 🤏'))

bot.catch((err, ctx) => {
  console.error('Ошибка:', err)
  ctx.reply('Произошла ошибка при обработке запроса.')
})

bot.on(message('text'), async ctx => {
  if (!ctx.message.text) {
    ctx.reply('Пожалуйста, отправьте текстовое сообщение!')
  }
  if (allowedChats.includes(ctx.chat.id.toString())) {
    console.log(ctx.message.from.first_name, ctx.message.text)
    const loadingMessageToUser = await ctx.reply('Генерирую...')

    if (ctx.message.text.startsWith('/dalle')) {
      dalle.mini(
        {
          prompt: ctx.message.text.replace('/dalle', '').trim(),
        },
        async (err, data) => {
          if (err != null) {
            console.log(err)
          } else {
            try {
              if (data && data.images) {
                const imageBase64 = data.images[0]
                const base64Image = imageBase64.replace(
                  /^data:image\/jpeg;base64,/,
                  ''
                )
                const imageBuffer = Buffer.from(base64Image, 'base64')
                const imagePath = path.join(__dirname, 'temp.jpg')

                fs.writeFileSync(imagePath, imageBuffer)

                await sharp(imageBuffer, { density: 300 })
                  .resize(1024, 1024)
                  .toFile(imagePath, { force: true })

                await ctx.replyWithPhoto({ source: imagePath })
                await ctx.telegram.deleteMessage(
                  ctx.chat.id,
                  loadingMessageToUser.message_id
                )
                fs.unlinkSync(imagePath)
              } else {
                ctx.reply('Не удалось сгенерировать изображение! 😔')
              }
            } catch (err) {
              ctx.reply('Не удалось сгенерировать изображение! 😔')
            }
          }
        }
      )
    } else {
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
    }
  } else {
    ctx.reply('У вас нет прав для использования этого бота!')
  }
})

bot.launch()
console.log('bot launched')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
