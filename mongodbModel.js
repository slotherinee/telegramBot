const mongoose = require('mongoose')
const { Schema, model } = mongoose

const chatHistorySchema = new Schema({
  chatId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  messages: [Schema.Types.Mixed],
})

const ChatHistory = model('ChatHistory', chatHistorySchema)
module.exports = ChatHistory
