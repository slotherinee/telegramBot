const mongoose = require('mongoose')
const { Schema, model } = mongoose

const messageSchema = new Schema({
  role: String,
  content: Schema.Types.Mixed,
})

const ChatHistorySchema = new Schema({
  chatId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  messages: [messageSchema],
})

const ChatHistory = model('ChatHistory', ChatHistorySchema)
module.exports = ChatHistory
