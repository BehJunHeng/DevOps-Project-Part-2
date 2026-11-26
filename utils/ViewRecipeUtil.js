const fs = require('fs').promises;
const path = require('path');
const RECIPES_FILE = path.join('utils', 'recipes.json');

//get all recipes
async function viewRecipes(req, res) {
    try {
        const data = await fs.readFile(RECIPES_FILE, 'utf8');
        const allRecipes = JSON.parse(data);
        return res.status(200).json(allRecipes);
    } catch (error) {
        // Handle case where file does not exist yet
        if (error.code === 'ENOENT') {
            return res.status(200).json([]); // return empty list if no file
        }
        return res.status(500).json({ message: error.message });
    }
}

//get one recipe by id
async function viewRecipesById(req, res) {
    try{
        const data = await fs.readFile(RECIPES_FILE, 'utf8');
        const allRecipes = JSON.parse(data);
        const recipe = allRecipes.find(r => r.id == req.params.id);
        if (!recipe) {
            return res.status(404).json ({ message : 'Recipe not found'});
        }
        return res.status(200).json(recipe);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ message: 'Recipe not found'})
        }
        return res.status(500).json({ message: error.message});
    }
}
module.exports = { viewRecipes, viewRecipesById };
