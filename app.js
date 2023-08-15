const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todo List!"
});
const item2 = new Item({
    name: "For adding an item, click on + button"
});
const item3 = new Item({
    name: "For deleting an item, click on checkbox"
});

const defaultItems = [item1, item2, item3]; 

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/",function(req,res){
    Item.find().then(function(findItems){
        if(findItems.length == 0){
            Item.insertMany(defaultItems).then(function(items){
                console.log("Items sucessfylly added!");
            }).catch(function(err){
                console.log(err);
            });
        }
        res.render("list",{listTitle : "Today", newListItems:findItems});
    });
    
    // res.send("Hello There!");
});



app.get("/:customListName",function(req,res){
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}).then(function(foundList){
        if(!foundList){
            console.log("Doesn't exists");
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        }
        else{
            res.render("list",{listTitle : customListName, newListItems:foundList.items});
            console.log("Exists")
        }
    }).catch(function(err){
        console.log(err);
    });
    
});


app.post("/",function(req,res){
    // console.log("Post request received");
    console.log(req.body);
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });
    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        }).catch(function(err){
            console.log(err);
        });
    }
    
});

app.post("/delete",function(req,res){
    const checkeditemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkeditemId).then(function(){
            console.log("sucessfully deleted the checked item");
            res.redirect("/");
        }).catch(function(err){
            console.log(err);
        });
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkeditemId}}}).then(function(foundList){
            res.redirect("/" + listName)
        }).catch(function(err){
            console.log(err);
        });
    }
    
});




app.get("/about",function(req,res){
    res.render("about");
})


app.listen(3000,function(){
    console.log("server has started at port 3000")
});