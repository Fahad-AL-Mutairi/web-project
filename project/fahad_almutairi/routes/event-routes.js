const express = require("express")
const router = express.Router();
const path = require('path');
const cart = require('../models/cart');
const Event = require('../models/Evnet')
const {
    check,
    validationResult
} = require('express-validator/check')
const moment = require('moment');
moment().format();
const User = require('../models/User');
const {
    error
} = require("jquery");


// middleware to check if user is loged in
isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next()
    res.redirect('/users/login')

}

// shopping cart GET
router.get('/cart', isAuthenticated, async (req, res) => { // Display web
    let userCart = [];

    let allItems = [];
    await cart.find({ user_id: req.user._id }, async function(err, res) {
        //console.log(res);
        if(res)
            allItems = res;
    });

    for(let items of allItems) {
        await Event.find({ product_id: items.product_id }, async function(err1, res1) {
            console.log(res1);
            if(res1)
                userCart.push({
                    productImage: res1[0].image_url,
                    productName: res1[0].title,
                    quantity: items.quantity,
                    productPrice: res1[0].price
                });
        })
    }

    res.render('event/cart',{
        title:'cart',
        items: userCart,
    })
});

// Add to cart POST
router.post('/cart', isAuthenticated, async(req, res) => {
    const newEvent = new cart({
        user_id: req.user._id,
        quantity: 1,
        product_id: req.body.product_id
    });

    newEvent.save((err) => {
        if (!err) {
            console.log('cart item was added')
            req.flash('info', ' The car has been added to the cart')
            res.redirect('/events')
        } else {
            console.log(err)
        }
    })
});

// check admin ? 
isAdmin = async (id) => {
    // User.find({id: req.user._id}).then(error,result)
    let admin = false
    await User.findById(id, function (err, res) {
        console.log(res)
        admin = res.admin

    })
    return admin


}

//create new events
router.get('/create', isAuthenticated, async (req, res) => {
    if (!(await isAdmin(req.user._id))) {
        res.status(400).send({
            message: 'not authorized'
        })
        return
    }

    res.render('event/create', {
        errors: req.flash('errors')
    })
})




// route to home events
router.get('/:pageNo?', (req, res) => {
    let pageNo = 1

    if (req.params.pageNo) {
        pageNo = parseInt(req.params.pageNo)
    }
    if (req.params.pageNo == 0) {
        pageNo = 1
    }

    let q = {
        skip: 6 * (pageNo - 1),
        limit: 6
    }
    //find totoal documents
    let totalDocs = 0

    Event.countDocuments({}, (err, total) => {

    }).then((response) => {
        totalDocs = parseInt(response)
        Event.find({}, {}, q, (err, events) => {
            //     res.json(events)
            let chunk = []
            let chunkSize = 3
            for (let i = 0; i < events.length; i += chunkSize) {
                chunk.push(events.slice(i, chunkSize + i))
            }
            //res.json(chunk)
            res.render('event/index', {
                chunk: chunk,
                message: req.flash('info'),
                total: parseInt(totalDocs),
                pageNo: pageNo
            })
        })
    })


})

// Multer upload system
const multer = require("multer");
const {
    title
} = require("process");
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/events')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + Date.now() + '.png')
    }
});

let upload = multer({
    storage: storage
})

// save event to db

router.post('/create', upload.single("image"), (req, res) => {
    const dateNow = Date.now();
    let newEvent = new Event({
        title: req.body.title,
        description: req.body.description,
        date: req.body.date,
        location: req.body.location,
        user_id: req.user.id,
        product_id: dateNow,
        created_at: dateNow,
        price: req.body.price,
        image_url: 'assets/' + (req.file ? req.file.filename.slice(0, -4) : "placeholder")
    })

    newEvent.save((err) => {
        if (!err) {
            console.log('event was added')
            req.flash('info', ' The event was created successfuly')
            res.redirect('/events')
        } else {
            console.log(err)
        }
    })

})

// show single event
router.get('/show/:id', (req, res) => {
    Event.findOne({
        _id: req.params.id
    }, (err, event) => {

        if (!err) {

            res.render('event/show', {
                event: event
            })

        } else {
            console.log(err)
        }

    })

})




// edit route

router.get('/edit/:id', isAuthenticated, (req, res) => {

    Event.findOne({
        _id: req.params.id
    }, (err, event) => {

        if (!err) {

            res.render('event/edit', {
                event: event,
                eventDate: moment(event.date).format('YYYY-MM-DD'),
                errors: req.flash('errors'),
                message: req.flash('info')
            })

        } else {
            console.log(err)
        }

    })

})

// update the form

router.post('/update', [
    check('title').isLength({
        min: 3
    }).withMessage('Title should be more than 5 char'),
    check('description').isLength({
        min: 5
    }).withMessage('Description should be more than 3 char'),
    check('location').isLength({
        min: 3
    }).withMessage('Location should be more than 5 char'),
    check('date').isLength({
        min: 5
    }).withMessage('Date should valid Date'),

], isAuthenticated, (req, res) => {

    const errors = validationResult(req)
    if (!errors.isEmpty()) {

        req.flash('errors', errors.array())
        res.redirect('/events/edit/' + req.body.id)
    } else {
        // crete obj
        let newfeilds = {
            title: req.body.title,
            description: req.body.description,
            location: req.body.location,
            date: req.body.date,
            price: req.body.price
        }
        let query = {
            _id: req.body.id
        }

        Event.updateOne(query, newfeilds, (err) => {
            if (!err) {
                req.flash('info', " The event was updated successfuly"),
                    res.redirect('/events/edit/' + req.body.id)
            } else {
                console.log(err)
            }
        })
    }

})

//delete event

router.delete('/delete/:id', isAuthenticated, (req, res) => {

    let query = {
        _id: req.params.id
    }

    Event.deleteOne(query, (err) => {

        if (!err) {
            res.status(200).json('deleted')
        } else {
            res.status(404).json('There was an error .event was not deleted')
        }
    })
});

//search

router.get('/assets/:image_id', (req, res) => {
    res.sendFile(path.join(__dirname, "../uploads/events/" + req.params.image_id + ".png"));
});


module.exports = router;