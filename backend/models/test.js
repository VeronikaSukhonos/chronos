import { Schema, model } from 'mongoose';

const testSchema = new Schema({
  title: String // columns and theid data types
});

export default model('Test', testSchema); // first argument is the singular form of "table" name with first letter capitalized
