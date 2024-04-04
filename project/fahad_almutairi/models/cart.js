const mongoose = require('mongoose');


const cartSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },

    product_id: {
        type: String,
        required: true
    },

    quantity: {
        type: Number,
        required:true
    }
})

const cart = mongoose.model('Cart', cartSchema, 'cart');

module.exports = cart;