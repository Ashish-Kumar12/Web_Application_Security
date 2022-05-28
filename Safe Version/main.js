
var express = require("express");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var User = require("./models/user");
var Blog = require("./models/blog");
var Comment = require("./models/comment");
var Note = require("./models/note");
var seedDB = require("./seeds");
var methodOverride = require('method-override');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var passport = require("passport");
var LocalStrategy = require("passport-local");
const port = 3000 || process.env.PORT;

var app = express();
mongoose.connect("mongodb://localhost:27017/blog_app", {useNewUrlParser: true});
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public/'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
mongoose.set("useFindAndModify", false);

var dbo;
MongoClient.connect(url, function(err, db) {
    dbo = db.db("blog_app");
});

seedDB();

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Blog App!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	next();
});

// Validation of user input

function validateData(data)
{
    return JSON.stringify(data);
}

// Routes

app.get("/", function(req, res){
    res.redirect("/blogs");
});

app.get("/blogs", function(req, res){
    Note.find({}, function(err, notes){
        Blog.find({}, function(err, blogs){
            if(err){
                console.log(err);
            } else {
                res.render("home", {blogs: blogs, notes: notes}); 
            }
        });
    });
});

app.get("/blogs/new", function(req, res){
    if (req.isUnauthenticated())
    {
        res.redirect("/login");
    }

    res.render("newBlog"); 
});

app.post("/blogs", function(req, res){

    if (req.isUnauthenticated())
    {
        res.redirect("/login");
    }

    var blog = req.body.blog;
    var formData = {
        title: blog.title,
        image: blog.image,
        body: blog.body,
        author: req.user,
        authorName: req.user.username,
        Comments: []
    };

    Blog.create(formData, function(err, newBlog){
        if(err){
            res.render("newBlog");
        } else {
            res.redirect("/blogs");
        }
    });

});

app.get("/blogs/:id", function(req, res){
    
    Blog.findById(req.params.id, function(err, blog){
        var comments = [];

        blog.Comments.forEach(function(commentID, index){
            Comment.findById(commentID, function(err, foundComment){
                comments.push(foundComment);

                if (index == blog.Comments.length-1)
                {
                    setTimeout(function(){
                        res.render("show", {blog: blog, comments: comments});
                    }, 500);
                }
            });
        });

        if (blog.Comments.length == 0)
        {
            setTimeout(function(){
                res.render("show", {blog: blog, comments: comments});
            }, 500);
        }
    });

});

app.get("/blogs/:id/edit", function(req, res){

    Blog.findById(req.params.id, function(err, blog){
        if(err){
            console.log(err);
            res.redirect("/")
        } else {
            res.render("edit", {blog: blog});
        }
    });

});

app.put("/blogs/:id", function(req, res){
    if (req.isUnauthenticated())
    {
        res.redirect("/login");
    }

    var blog = req.body.blog;
    var formData = {
        title: blog.title,
        image: blog.image,
        body: blog.body,
        author: req.user,
        authorName: req.user.username,
        Comments: blog.Comments
    };

    Blog.findByIdAndUpdate(req.params.id, formData, function(err, blog){
        if(err){
            console.log(err);
        } else {
            var showUrl = "/blogs/" + blog._id;
            res.redirect(showUrl);
        }
    });

});

app.delete("/blogs/:id", function(req, res){
    Blog.findById(req.params.id, function(err, blog){
        if(err){
            console.log(err);
        } else {
            blog.remove();
            res.redirect("/");
        }
    }); 

});

app.post("/blogs/:id/newComment", function(req, res){
    var blogID = req.params.id;

    Blog.findById(blogID, function(err, foundBlog){
        User.findById(req.user, function(err, foundUser){
            var formComment = {
                text: req.body.text,
                author: foundUser._id,
                authorName: foundUser.username,
                blog: foundBlog._id,
                blogName: foundBlog.title
            };

            Comment.create(formComment, function(err, createdComment){
                foundBlog.Comments.push(createdComment._id);
                foundUser.Comments.push(createdComment._id);
                foundBlog.save();
                foundUser.save();

                setTimeout(function(){
                    var url = "/blogs/" + blogID;
                    res.redirect(url);
                }, 500);
            });
        });
    });
});

app.post("/search", function(req, res){

    // title : {"$gt" : ""}

    var title = req.body.title;
    title = validateData(title);

    dbo.collection("blogs").find({
        title : title
    }).toArray(function(err, result) {
        if (err) throw err;
        res.render("searchResult", {blogs: result, title: title});
    });

});

app.get("/user/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        res.render("userInfo", {user: foundUser});
    });
});

app.put("/updateUser/:id", function(req, res){
    var user = req.body.user;

    User.findById(req.params.id , function(err, foundUser){
        var updatedUser = {
            username: user.username,
            image: user.image,
            password: foundUser.password,
            Blogs: foundUser.Blogs,
            Comments: foundUser.Comments
        }

        User.findByIdAndUpdate(req.params.id, updatedUser, function(err, result){
            var url = "/";
            res.redirect(url);
        });
    });
});

app.get("/user/:id/blogsAndComments", function(req, res){
    User.findById(req.params.id , function(err, foundUser){
        var blogs = [];
        var comments = [];

        foundUser.Blogs.forEach(function(blog){
            Blog.findById(blog, function(err, foundBlog){
                blogs.push(foundBlog);
            });
        });

        foundUser.Comments.forEach(function(comment){
            Comment.findById(comment, function(err, foundComment){
                comments.push(foundComment);
            });
        });

        setTimeout(function(){
            res.render("userBlogsAndComments", {
                author: foundUser.username,
                blogs: blogs,
                comments: comments
            });
        }, 500);
    });
});

// =================
// Authentication
// =================

app.get("/login",function(req,res){
	res.render("login");
});

app.get("/signup",function(req,res){
	res.render("signup");
});

app.post("/signup",function(req,res){
	var newUser = new User(
		{
			username: req.body.username,
            image: req.body.image,
            Blogs: [],
            Comments: []
		}
	)

	User.register(newUser, req.body.password, function(err, user){
		if(err)
        {
			console.log(err);
			return res.render("signup");
		}
		
        passport.authenticate("local")(req, res, function(){
			res.redirect("/");
		});
	});
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.post("/login", passport.authenticate("local", 
{
	successRedirect: "/",
	failureRedirect: "/login"
}), function(req, res){

});

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	}
	res.redirect("/login");
}

// =========
// Attacks
// =========

app.get("/reflectedXSS", function(req, res){    
    var user = req.query.username;

    if (user == "")
    {
        user = "Null";
    }

    res.render("reflectedXSS", {user: user});
});

app.get("/mongoDBInjection", function(req, res){

    // title : {'$gt' : ""}

    dbo.collection("blogs").find({
        title : req.param.title
    }).toArray(function(err, result) {
        if (err) throw err;
        res.render("InjectionMongoDB", {blogs: result});
    });

});

app.listen(port, function(){
    console.log("Blog App server is live!");
})
