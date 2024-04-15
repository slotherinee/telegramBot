const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// chat history should be like this
// chatHistory = {
// '12121414': [{
//     role: 'user',
//     content: 'Hello'
// }, {
//     role: 'assistant',
//     content: 'Hi'
// }]
// }

const chatHistorySchema = new Schema({
  chatId: {
    type: String,
    required: true,
  },
  messages: [
    {
      role: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },
  ],
});

const ChatHistory = model('ChatHistory', chatHistorySchema);
module.exports = ChatHistory;
