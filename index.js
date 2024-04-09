require('dotenv').config()
const fs = require('fs')
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters')
const { chatGPT, chatHistory } = require('./chatGPT')
const generateModel = require('./generateModels')
const commandToModelData = require('./commands')
const { v4: uuidv4 } = require('uuid')
const { gpt } = require('gpti')
const { generateTextFromImage, processVoiceMessage } = require('./utils')
const { allowedChats } = require('./allowedChats')

if (!process.env.TELEGRAM_TOKEN)
  throw new Error('"BOT_TOKEN" env var is required!')

const telegramToken = process.env.TELEGRAM_TOKEN
const bot = new Telegraf(telegramToken)

bot.start(ctx => {
  ctx.reply('Привет! 👋')
  ctx.reply('Напиши мне что-нибудь и я постараюсь помочь! 😊')
  ctx.reply(
    'Также можешь отправить мне голосовое сообщение. Я попробую его понять и ответить на него 😉'
  )
  ctx.reply(
    'Или используй команды /pg, /dalle, /prodia, /xlprodia, /xxlprodia, /emi, /diffusion, /real, /render /journey, /cyber, /pixelart, /anime, /anima'
  )
})

const handleMedia = async (
  ctx,
  fileId,
  loadingMessage,
  generateTextFromImage
) => {
  let inputFileName
  try {
    const fileLink = await bot.telegram.getFileLink(fileId)
    const response = await fetch(fileLink.href)
    const photoData = await response.arrayBuffer()
    const pathname = new URL(fileLink.href).pathname
    const format = pathname.split('/').pop().split('.').pop()
    inputFileName = `${uuidv4()}.${format}`
    fs.writeFileSync(inputFileName, new Uint8Array(photoData))
    const generatedText = await generateTextFromImage(inputFileName)
    const userCaption = ctx.message.caption
    console.log('user caption', userCaption)
    console.log('ai caption', generatedText)
    if (userCaption) {
      const command = userCaption.split(' ')[0]
      if (command in commandToModelData) {
        generateModel(
          ctx,
          loadingMessage,
          commandToModelData[command],
          `${generatedText} ${userCaption}`
        )
        return
      } else {
        generateModel(
          ctx,
          loadingMessage,
          commandToModelData['/pg'],
          `${generatedText} ${userCaption}`
        )
        return
      }
    }
    generateModel(
      ctx,
      loadingMessage,
      commandToModelData['/pg'],
      generatedText,
      true
    )
  } catch (error) {
    console.log(error)
    ctx.reply('Произошла ошибка при обработке запроса. 😔')
  } finally {
    if (inputFileName) {
      fs.unlinkSync(inputFileName)
    }
  }
}

bot.on(message('sticker'), async ctx => {
  const loadingMessageToUser = await ctx.reply('Генерирую фото...')
  await handleMedia(
    ctx,
    ctx.message.sticker.file_id,
    loadingMessageToUser,
    generateTextFromImage
  )
})

bot.on('photo', async ctx => {
  const loadingMessageToUser = await ctx.reply('Генерирую фото...')
  await handleMedia(
    ctx,
    ctx.message.photo[0].file_id,
    loadingMessageToUser,
    generateTextFromImage
  )
})

bot.on('voice', async ctx => {
  const chatId = ctx.chat.id
  if (!chatHistory[chatId]) {
    chatHistory[chatId] = []
  }
  const messages = chatHistory[chatId].map(({ role, content }) => ({
    role,
    content,
  }))

  const loadingMessageToUser = await ctx.reply(
    'Пытаюсь распознать сообщение...👂'
  )
  const fileId = ctx.message.voice.file_id
  const voiceLink = await bot.telegram.getFileLink(fileId)
  const response = await fetch(voiceLink.href)
  const voiceData = await response.arrayBuffer()
  const fileName = `${uuidv4()}.mp3`
  fs.writeFileSync(fileName, new Uint8Array(voiceData))
  try {
    const voiceResponse = await processVoiceMessage(fileName)
    console.log('voice response', voiceResponse)
    const gotVoiceResponse = await ctx.reply('Генерирую ответ...🙂')
    messages.push({ role: 'user', content: voiceResponse })
    gpt(
      {
        messages,
        model: 'GPT-4',
        markdown: false,
      },
      (err, data) => {
        if (err) {
          console.log(err)
          ctx.reply('Произошла ошибка при обработке запроса. 😔')
        } else {
          ctx.reply(data.gpt, { parse_mode: 'Markdown' })
          console.log('голосовое сообщение', data.gpt)
          ctx.telegram.deleteMessage(
            ctx.chat.id,
            loadingMessageToUser.message_id
          )
          ctx.telegram.deleteMessage(ctx.chat.id, gotVoiceResponse.message_id)
          fs.unlinkSync(fileName)
        }
        chatHistory[chatId].push({ role: 'user', content: voiceResponse })
        chatHistory[chatId].push({ role: 'assistant', content: data.gpt })
      }
    )
  } catch (err) {
    console.log(err)
    ctx.reply('Произошла ошибка при обработке голосового сообщения. 😔')
  }
})

bot.command('clear', ctx => {
  chatHistory[ctx.chat.id] = []
  ctx.reply('Контекст очищен! 🧹')
})

bot.on(message('text'), async ctx => {
  if (!ctx.message.text) {
    ctx.reply('Пожалуйста, отправьте текстовое сообщение!')
  }
  if (allowedChats.includes(ctx.chat.id.toString())) {
    console.log(ctx.message.from.first_name, ctx.message.text)
    const loadingMessageToUser = await ctx.reply('Генерирую...🙂')
    const command = `${ctx.message.text.split(' ')[0]}`
    if (command in commandToModelData) {
      generateModel(ctx, loadingMessageToUser, commandToModelData[command])
    } else {
      chatGPT(ctx, loadingMessageToUser)
    }
  } else {
    ctx.reply('У вас нет прав для использования этого бота!')
  }
})

bot.catch((err, ctx) => {
  console.error('Ошибка:', err)
  ctx.reply('Произошла ошибка при обработке запроса. 😔')
})

bot.launch()
console.log('bot launched')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
