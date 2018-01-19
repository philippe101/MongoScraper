//Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var path = require("path");
var methodOverride = require("method-override");

var Note = require("./models/note.js");
var Article = require("./models/article.js");

var request = require("request");
var cheerio = require("cheerio");
//JS ES6 Promises
mongoose.Promise = Promise;


var app = express();
var PORT = process.env.PORT || 3000;


app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(methodOverride('_method'));

app.use(express.static("./public"));

//Handlebars
var exphbs = require("express-handlebars");


app.set('views', __dirname + '/views');
app.engine("handlebars", exphbs({ defaultLayout: "main", layoutsDir: __dirname + "/views/layouts"}));
app.set("view engine", "handlebars");

//DB config mongoose

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/MongoScraper";

mongoose.connect(MONGODB_URI);

// var databaseUri = "mongodb://localhost/MongoScrape";
// if (process.env.MONGODB_URI) {
// 	mongoose.connect(process.env.MONGODB_URI);
// }else {
// 	mongoose.connect(databaseUri);
// }

var db = mongoose.connection;


// mongoose.connect("mongodb://heroku_2x26j0p1:tl6u19977q2tb1t8pd68kqhp0a@ds245337.mlab.com:45337/heroku_2x26j0p1");


db.on("error", function(error) {
	console.log("Mongoose Error: ", error);
});

db.once("open", function() {
	console.log("Mongoose connection successful");
});


//Routes

// db.getCollection('articles').find({})

app.get("/", function(req, res) {
	Article.find({},function (error, data) {
		if (error) {
			res.send(error);			
		}
		else {
			var newsObj = {
				Article: data
			};
			res.render("index", newsObj);
		}
	});
});

app.get("/scrape", function(req, res) {
	request("http://nypost.com/sports/", function(error, response, html){
		var $ = cheerio.load(html);

		$("h4.headline-link").each(function(i, element) {

			var result = {};

			result.title = $(this).text();
			result.link = $(this).parent("a").attr("href");

			var entry = new Article(result);

			entry.save(function(err, doc) {
				if(err) {
					console.log(err);
				}
				else {
					console.log(doc);
				}
			});
		});
		res.redirect("/");
		console.log("Successfully Scraped");
	});
});

app.post("/notes/:id", function(req, res) {
	var newNote = new Note(req.body);
	newNote.save(function (error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			console.log("this is the DOC " + doc);
			Article.findOneAndUpdate({
				"_id": req.params.id 
			},
				{ $push: { "note": doc._id } }, {new: true}, function(err, doc) {
					if (err) {
						console.log(err);
					}
					else {
						console.log("note saved: " + doc);
						res.redirect("/notes/" + req.params.id);
					}
			});
		}
	});
});

app.get("/notes/:id", function(req, res) {
	console.log("This is the req.params: " + req.params.id);
	Article.find({
		"_id": req.params.id
	})
	.populate("note")
	.exec(function(error, doc) {
		if (error) {
			console.log(error);
		}
		else {

			var notesObj = {
				Article: doc
			};
			console.log(notesObj);
		}
	});
});


app.post("/delete/:id", function(req, res) {
	Article.remove({
		"_id": req.params.id
	})
	.exec(function(error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			console.log("note deleted");
			res.redirect("/");
		}
	});
});

app.listen(PORT, function() {
	console.log("App running on PORT" + PORT + "|");
});




























