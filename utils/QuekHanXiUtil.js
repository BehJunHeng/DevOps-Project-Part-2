const fs = require('fs').promises;
const path = require('path');
const RECIPES_FILE = path.join('utils', 'recipes.json');



async function removeIngredient(req, res) {
    try {
        // gets the id from url
        const { recipeId } = req.params;

        //get the ingredient name from the body, and treat anything that is not text as empty
        // if there is a body and the name is a string, trim the empty spaces, otherwise empty string ''
        const name = req.body && typeof req.body.name === 'string' ? req.body.name.trim() : '';
        // error 1: empty ingredient name
        if(!name) {
            return res.status(400).json({ message: 'Ingredient name is required'})
        }
        // error 2: only letters and spaces allowed when deleting ingredient, cheese40 does not make sense
        if (!/^[A-Za-z ]+$/.test(name) || name.length > 30) {
            return res.status(400).json({ message: 'Name can only contain letters and spaces, up to 30 characters' });
        }
        //read the file
        let recipes = [];
        try {
            const data = await fs.readFile(RECIPES_FILE, 'utf8');
            // parse to js object because file is text
            recipes = JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ message: 'No recipes found' });
            
            } else {
                throw err;
            }
        }
        //checks if recipe exists using find which returns the first recipe whose id matches
        const recipe = recipes.find(r => r.id == recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found'});
        }
        // error 3: search inside the recipes ingredients, findIndex returns the index of the item you want to remove
        const ingredients = recipe.ingredients || [];
        const ingredientIndex = ingredients.findIndex(
            i => (i.name || '').toLowerCase() === name.toLowerCase()
        );
        // -1 shows 'not found'
        if (ingredientIndex === -1) {
            return res.status(404).json ({ message: 'Ingredient not found in this recipe'})
        }
        // error 4: block mandatory ingredients
        if (ingredients[ingredientIndex].mandatory) {
            return res.status(400).json({ message: 'Cannot remove a mandatory ingredient'});
        }
        //sucess: remove an ingredient, then save the list, 1 is how many removed, ingredientIndex is where to start
        ingredients.splice(ingredientIndex, 1);
        await fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');

        return res.status(200).json({ message: 'Ingredient removed successfully', recipe});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message})
    }
}
module.exports = { removeIngredient };
