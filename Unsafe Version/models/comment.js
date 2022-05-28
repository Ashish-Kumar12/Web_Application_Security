
var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    authorName: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    blogName: String,
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog"
    }
});

module.exports = mongoose.model("Comment", commentSchema);
