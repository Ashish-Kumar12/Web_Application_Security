
var express = require("express");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var Blog = require("./models/blog");
var User = require("./models/user");
var Comment = require("./models/comment");
var Note = require("./models/note");

var app = express();

app.use(require("express-session")({
    secret: "Blog App",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

var notesData = [
    {
        text: 'With reference to the below mentioned vulnerablities this Blog app prooves to be <b>Un Safe</b>.'
    },
    {
        text: 'For <b>Cross Site Scripting</b> attacker can post infected scripts in the form of new blog posts.'
    },
    {
        text: 'For <b>MongoDB Injection</b> to retrieve all the blog posts search for "{"$gt" : ""}" or "{"$ne" : 1}" without starting and ending quotes.'
    },
    {
        text: 'For <b>Broken Authentication</b> attacker can login into admin\'s account by using default credentials of username=Admin and password=Admin'
    },
    {
        text: '<b>Session stealing</b> might be possible if a user does not logout of the current and simply closes the browser window. The same session might be reused by the attacker and the attacker need not to login again.'
    },
    {
        text: 'Attacker can have access to all <b>Sensitive Information</b> of published blogs and comments from the user\'s information page. For example attacker can use broken authentication to gain access to all the admin\'s blogs and comments.'
    }
]

var data = [
    {
        username: "Admin",
        password: "Admin",
        image: "https://cdn1.iconfinder.com/data/icons/ecommerce-and-business-icon-set/128/admin.png",
        Blogs: [
            {
                title: "Admin Blog",
                image: "https://cdn3.iconfinder.com/data/icons/zeir-data-internet-vol-1/25/admin_panel_dashboard-128.png",
                body: "An Admin is a person responsible for carrying out the administration of a business or organization.",
                Comments: [
                    {
                        text: "Admin manages whole system of organization.",
                        author: {}
                    }
                ]
            }
        ]
    },
    {
        username: "Normal User",
        password: "password",
        image: "https://cdn2.iconfinder.com/data/icons/people-flat-design/64/Man-Person-People-Avatar-User-Happy-512.png",
        Blogs : [          
            {
                title: "What are Blogs",
                image: "https://media.istockphoto.com/vectors/cheerful-female-enjoying-time-on-social-media-blogger-creative-people-vector-id1224664031?b=1&k=6&m=1224664031&s=170x170&h=p3oP_ZAh5-l7hcagp6zqLwH_Wdrx5LcZo5WW7Gk5_oI=",
                body: "A blog (a shortened version of “weblog”) is an online journal or informational website displaying information. It is a platform where a writer or a group of writers share their views on an individual subject.",
                author: {},
                Comments: [
                    {
                        text: "People use blogs mainly for sharing personal information, such as their experiences and interests or to educate others on a specific subject or build a professional online presence.",
                        author: {}
                    }
                ]
            }
        ]
    },
    {
        username: "Attacker",
        password: "attacker",
        image: "https://cdn0.iconfinder.com/data/icons/cyber-crime-or-threats-blue-set/120/hacker_cyber_crime-256.png",
        Blogs : [
            
            {
                title: "Stored Cross Site Scripting Blog",
                image: "https://cdn4.iconfinder.com/data/icons/eon-ecommerce-i-1/32/exclamation_danger_caution-128.png",
                body: "A malicious user posting malicious script which will be viewed by other users. \n\n <script> alert(\"Hacked alert from stored script\"); </script> ",
                author: {},
                Comments: [
                    {
                        text: "Hacker has stored an alert box in the body of the Blog",
                        author: {}
                    }
                ]
            },
            {
                title: "Reflected Cross Site Scripting Blog",
                image: "https://cdn3.iconfinder.com/data/icons/ui-thick-outline-3-of-5/100/ui_05_of_9-06-128.png",
                body: "This script will redirect the user to a infected url => \"/reflectedXSS?username=<%= currentUser.username %>\" in 10 seconds to <b>steal user credentials</b> \n\n <script type=\"text/javascript\">setTimeout(function(){ let userName = document.getElementById(\"userName\").innerText; let infectedParagraph = document.getElementById(\"infectedParagraph\"); url = '/reflectedXSS?username=' + userName ; location.href = url; }, 10000); </script> ",
                author: {},
                Comments: [
                    {
                        text: "Payload used by the attacker \n\n <script> setTimeout(function(){ let userName = document.getElementById(\"userName\").innerText; let infectedParagraph = document.getElementById(\"infectedParagraph\"); url = '/reflectedXSS?username=' + userName ; location.href = url; }, 10000); </script> ",
                        author: {}
                    }
                ]
            },
            {
                title: "DOM Cross Site Scripting Blog",
                image: "https://cdn3.iconfinder.com/data/icons/file-document-15/512/file_danger_alert_warning-128.png",
                body: "Attacker can manipulate DOM of the client's web browser. \n\n\n <p class=\"h1 d-flex justify-content-center\" id=\"infectedParagraph\"></p> \n\n <script> let userName = document.getElementById(\"userName\").innerText; let infectedParagraph = document.getElementById(\"infectedParagraph\"); infectedParagraph.innerHTML = \"Current User is '\" + userName + \" '\"; </script>",
                author: {},
                Comments: [
                    {
                        text: "Payload used by the attacker to get information about current user. \n\n <p class=\"h1\" id=\"infectedParagraph\"></p> \n\n <script> let userName = document.getElementById(\"userName\").innerText; let infectedParagraph = document.getElementById(\"infectedParagraph\"); infectedParagraph.innerHTML = \"Current User is '\" + userName + \"'\"; </script>",
                        author: {}
                    }
                ]
            }

        ]
    }
]

function seedDB()
{
    User.deleteMany({}, function(err){
        Blog.deleteMany({}, function(err){
            Comment.deleteMany({}, function(err){

                data.forEach(function(user){

                    var tempUser = new User( {
                        username: user.username,
                        image: user.image,
                        Blogs: [],
                        Comments: []
                    });
                    
                    // User.create(tempUser, function(err, createdUser){
                    User.register(tempUser, user.password, function(err, createdUser){
                        
                        // console.log("Created User = " + createdUser.username);

                        user.Blogs.forEach(function(blog){

                            var tempBlog = {
                                title: blog.title,
                                image: blog.image,
                                body: blog.body,
                                author: createdUser,
                                authorName: createdUser.username,
                                Comments: []
                            }
                            
                            Blog.create(tempBlog, function(err, createdBlog){
                                
                                // console.log("Created Blog = " + createdBlog.title + " for User = " + createdUser.username);

                                createdUser.Blogs.push(createdBlog._id);

                                var updatedUser = {
                                    username: createdUser.username,
                                    image: createdUser.image,
                                    Blogs: createdUser.Blogs,
                                    Comments: []
                                };

                                User.findByIdAndUpdate(createdUser._id, updatedUser, function(err, resultUser){

                                    blog.Comments.forEach(function(comment){

                                        var tempComment = {
                                            text: comment.text,
                                            author: createdUser,
                                            blog: createdBlog,
                                            authorName: createdUser.username,
                                            blogName: createdBlog.title
                                        }
    
                                        Comment.create(tempComment, function(err, createdComment){
    
                                            // console.log("Created Comment = " + createdComment.text + " for Blog = " + createdBlog.title);

                                            createdBlog.Comments.push(createdComment._id);
    
                                            var updatedBlog = {
                                                title: createdBlog.title,
                                                image: createdBlog.image,
                                                body: createdBlog.body,
                                                author: createdBlog.author,
                                                authorName: createdUser.username,
                                                Comments: createdBlog.Comments
                                            };
    
                                            Blog.findByIdAndUpdate(createdBlog._id, updatedBlog, function(err, resultBlog){

                                                createdUser.Comments.push(createdComment._id);

                                                var updatedUser = {
                                                    username: createdUser.username,
                                                    image: createdUser.image,
                                                    Blogs: createdUser.Blogs,
                                                    Comments: createdUser.Comments
                                                };

                                                User.findByIdAndUpdate(createdUser._id, updatedUser, function(err, result){
                            
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
        console.log("Seeding DB done!");
    });

    Note.deleteMany({}, function(err){
        notesData.forEach(function(note){
            Note.create(note, function(err, createdNote)
            {
                
            });
        });
    });
}

module.exports = seedDB
