
var mongoose = require("mongoose");

var noteSchema = mongoose.Schema({
    text: String,
});

module.exports = mongoose.model("Note", noteSchema);
