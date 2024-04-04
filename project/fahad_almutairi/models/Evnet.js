const mongoose = require('mongoose')
const eventSchema = new mongoose.Schema({
    
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    user_id : {
        type: String,
        required: true
    },

    created_at: {
        type: Date,
        required: true
    },

    product_id: {
        type: String,
        required: true
    },

    image_url: {
        type: String,
        required: false
    },
    price: {
        type: Number,
        required: false
    }
})

let Event = mongoose.model('Event', eventSchema, 'events')

module.exports = Event