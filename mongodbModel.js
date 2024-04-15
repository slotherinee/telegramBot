const mongoose = require('mongoose');
const { Schema, model } = mongoose;

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
