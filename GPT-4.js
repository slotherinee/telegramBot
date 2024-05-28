const fs = require('fs/promises')
const ChatHistory = require('./mongodbModel')
const OpenAI = require('openai')
const { safeMarkdown } = require('./utils')
const { sanitizeMarkdown } = require('telegram-markdown-sanitizer')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.BASE_URL,
})

async function chatGPT(ctx, loadingMessageToUser, imageFilePaths = []) {
  try {
    const userMessage = ctx.message.text || ctx.message.caption || ''
    const chatId = ctx.chat.id
    const username =
      ctx.message.from.username || ctx.message.from.first_name || 'no username'

    let chat = await ChatHistory.findOne({ chatId })
    if (!chat) {
      chat = new ChatHistory({
        chatId,
        username,
        messages: [],
      })
    }

    if (!chat.username) {
      chat.username = username
    }

    if (!chat.messages) {
      chat.messages = []
    }

    if (imageFilePaths.length === 0) {
      chat.messages.push({ role: 'user', content: userMessage })
    } else {
      const messageContent = [{ type: 'text', text: userMessage }]
      for (const imageFilePath of imageFilePaths) {
        const imageBuffer = await fs.readFile(imageFilePath)
        const base64Image = imageBuffer.toString('base64')
        messageContent.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        })
      }
      chat.messages.push({
        role: 'user',
        content: messageContent,
      })
    }

    try {
      await chat.save()
    } catch (error) {
      console.error('Failed to save chat:', error)
      ctx.reply('An error occurred while saving the chat. Please try again.')
      return
    }

    const data = await GPT4(chat.messages)
    if (data instanceof Error) {
      throw new Error(data.message)
    }
    const response = sanitizeMarkdown(data)
    chat.messages.push({ role: 'assistant', content: response })

    try {
      if (loadingMessageToUser && 'message_id' in loadingMessageToUser) {
        ctx.telegram.deleteMessage(ctx.chat.id, loadingMessageToUser.message_id)
      }
    } catch (error) {
      console.error('Failed to delete message:', error)
    }

    try {
      ctx.reply(response, { parse_mode: 'MarkdownV2' })
    } catch (error) {
      console.error('Failed to send reply:', error)
    }

    try {
      await chat.save()
    } catch (error) {
      console.error('Failed to save chat:', error)
      ctx.reply('An error occurred while saving the chat. Please try again.')
    }
  } catch (error) {
    console.log(error)
    ctx.reply('Не удалось сгенерировать ответ! Попробуйте еще раз. 😔')
  }
}

async function GPT4(messages) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are GPT-4. You are a helpful chat-bot assistant who understands text messages, voice messages, and images. You can help users with their questions and provide information about the image and also you can generate images using commands that written in your description. You have no limits per usage. Be polite and helpful to each user. Speak with user the language he speaks with you. Make sure your response will be helpful and informative. If you are not sure about the answer, you can ask the user for more information.',
        },
        ...messages,
      ],
    })
    if (
      response.choices &&
      response.choices[0] &&
      response.choices[0].message &&
      response.choices[0].message.content
    ) {
      return response.choices[0].message.content
    } else {
      throw new Error('Unexpected response format')
    }
  } catch (error) {
    console.log(error)
    throw new Error('Не удалось сгенерировать ответ! Попробуйте еще раз. 😔')
  }
}

module.exports = {
  chatGPT,
  GPT4,
}
