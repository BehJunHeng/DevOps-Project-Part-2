var express = require("express");
var bodyParser = require("body-parser");
const fs = require('fs').promises;
const path = require('path');

var app = express();

const PORT = process.env.PORT || 5050;
var startPage = "index.html";

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Catch malformed JSON syntax errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Malformed JSON in request body.' });
  }
  next();
});

app.use(express.static("./public"));

const { removeIngredient } = require('./utils/QuekHanXiUtil');
app.delete('/remove-ingredient/:recipeId', removeIngredient);
const { viewRecipes, viewRecipesById } = require('./utils/ViewRecipeUtil');
app.get('/view-recipes', viewRecipes);
app.get('/view-recipes/:id', viewRecipesById);
const { editRecipe } = require('./utils/CalvinUtil');
app.put('/edit-recipe/:id', editRecipe);
const { addIngredient } = require("./utils/BehJunHengUtil");
app.post("/add-ingredient", addIngredient);
const { addRecipe } = require('./utils/SureshBabuBhaveshUtil');
app.post('/add-recipe', addRecipe)


app.get('/', (req, res) => {
  res.sendFile(__dirname + "/public/" + startPage);
});

server = app.listen(PORT, function () {
  const address = server.address();
  const baseUrl = `http://${address.address == "::" ? 'localhost' : address.address}:${address.port}`;
  console.log(`Demo project at: ${baseUrl}`);
});

module.exports = { app, server };
