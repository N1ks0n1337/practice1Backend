const { Schema, model } = require('mongoose');

const itemSchema = new Schema({
    name: { type: String, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = model('Item', itemSchema);
