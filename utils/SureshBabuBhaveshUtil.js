const { Recipe } = require('../models/Resource')
const fs = require('fs').promises;
const path = require('path');

const RECIPES_FILE = path.join('utils', 'recipes.json');
const TEMPLATE_FILE = path.join('utils', 'recipes.template.json');
const ALLOWED_UNITS = [
    'cup', 'pcs', 'clove', 'tbsp', 'tsp',
    'g', 'kg', 'ml', 'l', 'pinch', 'slice'
];

async function addRecipe(req, res) {
    try {
        const { name, description, servings, ingredients, steps } = req.body || {};
        //This if is to check if the fields are the correct type
        if (
            typeof name !== 'string' ||
            typeof description !== 'string' ||
            typeof servings !== 'number' ||
            !Array.isArray(ingredients) ||
            !Array.isArray(steps)
        ) {
            return res.status(400).json({
                message: 'Invalid data types for recipe fields'
            });
        }


        //Check if the input fields are empty or invalid, if they are, return a 400 error
        if (name.trim() === '' ||
            name.length > 80 ||
            description.trim() === '' ||
            description.length > 500 ||
            !Number.isInteger(servings) ||
            servings <= 0
        ) {
            return res.status(400).json({
                message: 'Please provide valid recipe details'
            })
        }

        // At least one ingredient and one cooking step are required
        if (ingredients.length === 0 || steps.length === 0) {
            return res.status(400).json({
                message: 'At least one ingredient and one cooking step are required'
            });
        }
        // Validate each ingredient
        const ingredientNames = [];

        for (const ingredient of ingredients) {
            if (
                !ingredient ||
                typeof ingredient.name !== 'string' ||
                typeof ingredient.quantity !== 'number' ||
                typeof ingredient.unit !== 'string' ||
                typeof ingredient.mandatory !== 'boolean'
            ) {
                return res.status(400).json({
                    message: 'Invalid ingredient data'
                });
            }

            const ingredientName = ingredient.name.trim();
            const unit = ingredient.unit.trim().toLowerCase();

            if (
                ingredientName.length < 2 ||
                ingredientName.length > 50 ||
                !/^[a-zA-Z]+([ -][a-zA-Z]+)*$/.test(ingredientName)
            ) {
                return res.status(400).json({
                    message: 'Invalid ingredient name'
                });
            }

            if (
                !Number.isFinite(ingredient.quantity) ||
                ingredient.quantity <= 0 ||
                ingredient.quantity > 10000
            ) {
                return res.status(400).json({
                    message: 'Invalid ingredient quantity'
                });
            }

            if (!ALLOWED_UNITS.includes(unit)) {
                return res.status(400).json({
                    message: 'Invalid ingredient unit'
                });
            }

            // Prevent duplicate ingredients
            const lowerName = ingredientName.toLowerCase();

            if (ingredientNames.includes(lowerName)) {
                return res.status(400).json({
                    message: 'Duplicate ingredients are not allowed'
                });
            }

            ingredientNames.push(lowerName);
        }
        // Validate cooking steps
        if (
            steps.some(step =>
                typeof step !== 'string' || step.trim() === ''
            )
        ) {
            return res.status(400).json({
                message: 'Cooking steps cannot be empty'
            });
        }


        // Create a new recipe
        const newRecipe = new Recipe(
            name.trim(),
            description.trim(),
            servings,
            ingredients,
            steps.map(step => step.trim()
            ));

            
        let recipes = [];
        try {
            // Try reading the existing recipes.json
            const data = await fs.readFile(RECIPES_FILE, 'utf8');
            recipes = JSON.parse(data);

            // Check that the JSON file has a proper format
            if (!Array.isArray(recipes)) {
                throw new Error('Invalid recipes file format');
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                try {
                    // If recipes.json doesn't exist, create it from the template
                    const templateData = await fs.readFile(TEMPLATE_FILE, 'utf8');
                    recipes = JSON.parse(templateData);
                    // Check that the template contains an array
                    if (!Array.isArray(recipes)) {
                        throw new Error('Invalid recipe template format');
                    }
                } catch (templateError) {
                    console.error('Template file error:', templateError);
                    return res.status(500).json({
                        message: 'Unable to load the recipe template'
                    });
                }
            } else {
                // Handle invalid JSON or other file reading errors
                console.error('Recipe file error:', err);
                return res.status(500).json({
                    message: 'Unable to read the recipes file'
                });
            }
        }
        // Add new recipe and save to file
        recipes.push(newRecipe);
        try {
            await fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2),
                'utf8');
        } catch (writeError) {
            console.error('Write error:', writeError);
            return res.status(500).json({
                message: 'Unable to save the new recipe'
            });
        }

        return res.status(201).json({
            message: 'Recipe added succesfully!',
            recipes: recipes
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Something went wrong when creating the recipe',
            error: error.message
        });
    }
}
module.exports = { addRecipe };