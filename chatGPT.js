const { gpt } = require('gpti');
const ChatHistory = require('./mongodbModel');

const chatGPT = async (ctx, loadingMessageToUser, tesseractResponse) => {
  const chatId = ctx.chat.id;
  const userMessage = ctx.message.text || ctx.message.caption || '';

  let chat = await ChatHistory.findOne({ chatId });
  if (!chat) {
    chat = new ChatHistory({ chatId, messages: [] });
  }

  const fullUserMessage = tesseractResponse
    ? `${userMessage} ${tesseractResponse}`
    : userMessage;

  chat.messages.push({ role: 'user', content: fullUserMessage });
  await chat.save();

  await chat.save();
  gpt(
    {
      messages: chat.messages,
      model: 'GPT-4',
      markdown: false,
    },
    async (err, data) => {
      if (err !== null) {
        ctx.reply('Не удалось сгенерировать ответ! Попробуйте еще раз. 😔');
      } else {
        const response = data.gpt;
        console.log(response);
        if (loadingMessageToUser && 'message_id' in loadingMessageToUser) {
          ctx.telegram.deleteMessage(
            ctx.chat.id,
            loadingMessageToUser.message_id
          );
        }
        ctx.reply(response, { parse_mode: 'Markdown' });
        chat.messages.push({ role: 'assistant', content: response });
        await chat.save();
      }
    }
  );
};
module.exports = {
  chatGPT,
};
