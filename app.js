//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require('ejs')
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://j.banuelos00@gmail.com:!Sc10nof1nt!@cluster0.jlgba.mongodb.net/todolistDB?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

const itemsSchema = new mongoose.Schema ({
  name: {
    type: String,
    required: [true, "Please make sure to input a list item."]
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todo list!"
});

const item2 = new Item ({
  name: "Hit the + button ot add a new item."
});

const item3 = new Item ({
  name: "<=== Hit this to delete an item."
});

const defaultItems = [item1, item2, item3]

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added to the todo list.");
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems });
    }
  })


});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function (err, foundList) {
    if (!err) {
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName)
      } else {
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect('/');
  } else {
      List.findOne({name: listName}, function(err, foundList){
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      });
  }

});

app.post('/delete', function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted an item from the todo list.");
        res.redirect('/');
      };
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if(!err) {
          res.redirect('/' + listName);
        }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
