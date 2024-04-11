const { gpt } = require('gpti')

const chatHistory = {}

const chatGPT = (ctx, loadingMessageToUser, tesseractResponse) => {
  const chatId = ctx.chat.id
  const userMessage = ctx.message.text || ctx.message.caption || ''

  if (!chatHistory[chatId]) {
    chatHistory[chatId] = []
  }
  const messages = chatHistory[chatId].map(({ role, content }) => ({
    role,
    content,
  }))

  const fullUserMessage = tesseractResponse
    ? `${userMessage} ${tesseractResponse}`
    : userMessage

  messages.push({ role: 'user', content: fullUserMessage })
  gpt(
    {
      messages,
      model: 'GPT-4',
      markdown: false,
    },
    (err, data) => {
      if (err !== null) {
        ctx.reply('Не удалось сгенерировать ответ! Попробуйте еще раз. 😔')
      } else {
        const response = data.gpt
        console.log(response)
        if (loadingMessageToUser && 'message_id' in loadingMessageToUser) {
          ctx.telegram.deleteMessage(
            ctx.chat.id,
            loadingMessageToUser.message_id
          )
        }
        ctx.reply(response, { parse_mode: 'Markdown' })
        chatHistory[chatId].push({ role: 'user', content: fullUserMessage })
        chatHistory[chatId].push({ role: 'assistant', content: response })
      }
    }
  )
}
module.exports = {
  chatGPT,
  chatHistory,
}
