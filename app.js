const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { default: mongoose } = require('mongoose');
const { Item, List, User } = require('./User.js');
const _ = require('lodash');
const authMiddleware = require('./AuthMiddleware.js');
const controller = require('./AuthController.js');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(session({
    secret: "1234567",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

const startDBConnection = async () => {
    try {
        await mongoose.connect('mongodb+srv://kogay20192:OyyMFJDqCPTwyYAZ@users.mqvfn.mongodb.net/?retryWrites=true&w=majority&appName=users', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

startDBConnection();
app.get('/auth', (req, res) => {
    res.render('validation');
});


app.post('/login', controller.login);
app.post('/register', controller.register);

const sessionAuthMiddleware = (req, res, next) => {
    if (!req.session.user) {
        console.error('User not authenticated');
        return res.redirect('/auth');
    }
    req.user = req.session.user;
    next();
};


app.get('/user', controller.getUser);

app.use(sessionAuthMiddleware)

const item1 = new Item({ name: "Welcome" });
const item2 = new Item({ name: "Create" });
const item3 = new Item({ name: "Read" });

const defaultItems = [item1, item2, item3];




app.get("/", async function (req, res) {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).populate('list.items').exec();

        if (!user) {
            console.error('User not found');
            return res.redirect('/auth');
        }

        if (!user.list || user.list.length === 0) {
            user.list = defaultItems;
            await user.save();
            console.log("successfully added default items to user list");
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: user.list });
        }
    } catch (err) {
        console.log(err);
    }
});

app.post("/", async function (req, res) {
    try {
        const userId = req.user._id;
        const itemName = req.body.newItem;
        const listName = req.body.list;

        const item = new Item({ name: itemName });

        if (listName === "Today") {
            const user = await User.findById(userId);
            if (!user) {
                console.error('User not found');
                return res.redirect('/auth');
            }
            user.list.push(item);
            await user.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({ name: listName });
            foundList.items.push(item);
            await foundList.save();
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.log(err);
    }
});

app.post("/delete", async function (req, res) {
    try {
        const userId = req.user._id;
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName;

        if (listName === "Today") {
            const user = await User.findById(userId);
            if (!user) {
                console.error('User not found');
                return res.redirect('/auth');
            }
            user.list.id(checkedItemId).remove();
            await user.save();
            console.log("successfully deleted");
            res.redirect("/");
        } else {
            await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: checkedItemId } } }
            );
            console.log("successfully deleted from custom list");
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.log(err);
    }
});

app.get("/:customListName", async function (req, res) {
    try {
        const customListName = _.capitalize(req.params.customListName);
        const foundList = await List.findOne({ name: customListName }).exec();

        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            await list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    } catch (err) {
        console.log(err);
    }
});

app.listen(3000, function () {
    console.log("Server is running on port 3000");
});