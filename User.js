const { Schema, model } = require('mongoose');

const itemsSchema = new Schema({
    name: String
});

const Item = model('Item', itemsSchema);

const listSchema = new Schema({
    name: String,
    items: [itemsSchema]
});

const List = model('List', listSchema);

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    list: [itemsSchema]
});

const User = model('User', userSchema);

module.exports = { Item, List, User };