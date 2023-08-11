//importing the important dependencies
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// setting the view engine
app.set("view engine", "ejs");
app.use(express.static("public"));

// connecting to mongoDB server
mongoose
  .connect("mongodb://127.0.0.1:27017/todolistDB")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("mongoDB error", err));
// creating a Schema for the items to be stored
const itemSchema = new mongoose.Schema({
  name: String,
});

// creating model for the item Schema
const Item = mongoose.model("Item", itemSchema);

// creating default items
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button add item",
});
const item3 = new Item({
  name: "<--- Hit this to delete an item.",
});

// Inserting the default items in a constant
const defaultItems = [item1, item2, item3];

// Creating a list Schema
const listSchema = {
  name: String,
  items: [itemSchema],
};
// Model for List Schema
const List = mongoose.model("List", listSchema);

// Getting the Home route using '/' route handler
app.get("/", function (req, res) {
  Item.find() // to find the default items and adding them
    .then(function (foundItem) {
      if (foundItem.length === 0) {
        Item.insertMany(defaultItems);

        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItem: foundItem });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

//Creating a Post route for the '/' route
app.post("/", async function (req, res) {
  const listName = req.body.list;
  let itemName = req.body.newItem;
  const item = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    await List.findOne({ name: listName })
      .exec()
      .then((foundList) => {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

// When the item is checked it get deleted from the database using "/delete" route
app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    if (checkedItemId != undefined) {
      await Item.findByIdAndRemove(checkedItemId);

      res.redirect("/");
    }
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );
    res.redirect("/" + listName);
  }
});

//Creating a route for the about page
app.get("/about", function (req, res) {
  res.render("about");
});

//Creating a route for custom pages
app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });

        list.save();
        console.log("saved");
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItem: foundList.items,
        });
      }
    })
    .catch(function (err) {});
});

app.listen(3000, function () {
  console.log("The server is running on port 3000");
});
