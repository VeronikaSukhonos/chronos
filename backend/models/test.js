const mongoose =require('mongoose');
const { Schema, model } = mongoose;

const testSchema = new Schema({
  title: String // columns and theid data types
});

module.exports = model('Test', testSchema); // first argument is the singular form of "table" name with first letter capitalized

