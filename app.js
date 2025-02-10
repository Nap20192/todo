const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { default: mongoose } = require('mongoose');
const { Item, List } = require('./models.js');
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
        await mongoose.connect('mongodb+srv://kogay20192:B5jbj5XAFzeL1vIC@back.mqvfn.mongodb.net/todo?retryWrites=true&w=majority&appName=back', {
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

app.get('/user', controller.getUser);

app.use(authMiddleware);

const item1 = new Item({ name: "Welcome" });
const item2 = new Item({ name: "Create" });
const item3 = new Item({ name: "Read" });

const defaultItems = [item1, item2, item3];

app.get("/", async function (req, res) {
    try {
        const userID = req.user.id;
        const foundItems = await List.find({userID: userID});
        if (foundItems.length === 0) {
            const list = new List({
                name: "Today",
                items: defaultItems,
                userID: userID
            });
            await list.save();
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems[0].items });
        }
    } catch (err) {
        console.log(err);
    }
});

app.post("/", async function (req, res) {
    try {
        const itemName = req.body.newItem;
        const listName = req.body.list;
        const userID = req.user.id;
        const item = new Item({
            name: itemName
        });
        if (listName === "Today"){
            await item.save();
            const foundList = await List.findOne({ name: "Today", userID: userID });
            console.log(foundList);
            console.log(item);
            foundList.items.push(item);
            await foundList.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({name: listName, userID: userID});
            console.log("ds",foundList);
            foundList.items.push(item);
            await foundList.save();
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.log(err);
    }
});


app.post("/delete", async function(req, res){
    try {
        const checkedItemId = req.body.checkbox;
        const listName = req.body.listName; // Make sure to retrieve the listName from the request
        const userID = req.user.id;

        if (listName === "Today") {
            await Item.findByIdAndDelete(checkedItemId);
            const foundList = await List.findOne({ name: "Today", userID: userID });
            await List.findOneAndUpdate({ name: "Today", userID: userID }, { items: foundList.items.filter(item => item._id != checkedItemId)});
            console.log("successfully deleted");
            res.redirect("/");
        } else {
            await List.findOneAndUpdate(
                { name: listName, userID: userID },
                { $pull: { items: { _id: checkedItemId } } }
            );
            console.log("successfully deleted from custom list");
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.log(err);
    }
});

app.get("/:customListName", async function(req, res){
    try {
        const userID = req.user.id;
        const customListName = _.capitalize(req.params.customListName);
        const foundList = await List.findOne({ name: customListName }).exec();

        if (!foundList){
            const list = new List({
                name: customListName,
                items: defaultItems,
                userID: userID
            });
            await list.save();
            res.redirect("/" + customListName);
        } else {
              res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
    } catch (err) {
        console.log(err);
    }
});




const PORT = process.env.PORT || 3000;  
app.listen(PORT, function(){
    console.log("Server is running on port 3000");
});