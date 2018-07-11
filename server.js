const path = require("path");

const express = require("express");
const app = express();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "static")));

const session = require("express-session");
app.use(session({
	secret: "herropreash",
	resave: false,
	saveUninitialized: true,
	cookie: { maxAge: 600000 }
}))

const flash = require("express-flash");
app.use(flash());

const bcrypt = require("bcryptjs");

const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
require("mongoose-type-email");
mongoose.connect("mongodb://localhost:27017/logreg", { useNewUrlParser: true });

var UserSchema = new mongoose.Schema({
	first: { 
		type: String, 
		required: [true, "First name can not be blank!"], 
		minlength: [3, "First name must be more than 3 characters"] 
	},
	last: { 
		type: String, 
		required: [true, "Last name can not be blank!"],
		minlength: [3, "Last name must be more than 3 characters"] 
	},
	email: { 
		type: mongoose.SchemaTypes.Email, 
		unique: [true, "Email is already in use"], 
		required: [true, "Email can not be blank!"],
	},
	password: { 
		type: String, 
		required: [true, "Password can not be blank"], 
		minlength: [6, "Password must be more than 6 characters"], 
	}
})
UserSchema.plugin(uniqueValidator);
mongoose.model("User", UserSchema);
var User = mongoose.model("User");

app.get("/", function(req, res){
	res.render("index");
})

app.post("/register", function(req, res){
	if (req.body.password != req.body.confirmation){
		req.flash("errors", "Passwords do not match");
	}
	var user = new User({ runValidators: true, first: req.body.first_name, last: req.body.last_name, email: req.body.email, password: req.body.password});
	user.validate(function(err){
		if(err){
			for(var key in err.errors){
				req.flash("errors", err.errors[key].message);
			}
			res.redirect("/");
		}
		else{
			bcrypt.hash(req.body.password, 10).then(result =>{
				var user = new User({ first: req.body.first_name, last: req.body.last_name, email: req.body.email, password: result });
				user.save(function(err){
					if(err){
						for (var key in err.errors){
							req.flash("errors", err.errors[key].message);
						}
						res.redirect("/");
					}
					else{
						req.flash("success", "You hav successfully registered!")
						res.redirect("/");
					}	
				})
			})
		}
	})
})

app.post("/login", function(req, res){
	User.findOne( {email: req.body.email}, function(err, user){
		bcrypt.compare(req.body.password, user["password"]).then(result =>{
			req.session["_id"] = user["_id"],
			req.session["name"] = user["first"],
			req.session["logged_in"] = true
			console.log(req.session['_id'])
			console.log(req.session["name"])
			console.log(req.session["logged_in"])
		})
		res.redirect("/");
	})
})

app.listen(1337);