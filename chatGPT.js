const { gpt } = require('gpti')

const chatHistory = {}

const chatGPT = (ctx, loadingMessageToUser) => {
  const chatId = ctx.chat.id
  const userMessage = ctx.message.text
  if (!chatHistory[chatId]) {
    chatHistory[chatId] = []
  }
  const messages = chatHistory[chatId].map(({ role, content }) => ({
    role,
    content,
  }))

  messages.push({ role: 'user', content: userMessage })
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
        ctx.telegram.deleteMessage(ctx.chat.id, loadingMessageToUser.message_id)
        ctx.reply(response, { parse_mode: 'Markdown' })
        chatHistory[chatId].push({ role: 'user', content: userMessage })
        chatHistory[chatId].push({ role: 'assistant', content: response })
      }
    }
  )
}
module.exports = {
  chatGPT,
  chatHistory,
}
