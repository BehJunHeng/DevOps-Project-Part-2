const fs = require('fs').promises;
const path = require('path');

const RECIPES_FILE = path.join('utils', 'recipes.json');

// Helper function to count words in a string
function countWords(str) {
    return str.trim().split(/\s+/).filter(Boolean).length;
}

// Edit Recipe function handler
async function editRecipe(req, res) {
    try {
        // Validate request body
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ message: 'Invalid request body.' });
        }

        const { id } = req.params;
        const { name, description, servings, steps } = req.body;

        // Ensure ID is present
        if (!id || id.trim() === '') {
            return res.status(400).json({ message: 'Recipe ID is required.' });
        }

        // Check required fields
        if (typeof name !== 'string' || name.trim() === '' || typeof description !== 'string' || description.trim() === '') {
            return res.status(400).json({ message: 'Recipe name and description are required and cannot be blank.' });
        }

        // Strict name validation: Letters and spaces only (blocks numbers like 123 and symbols like !)
        if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
            return res.status(400).json({ message: 'Recipe name must contain letters and spaces only (no numbers or symbols).' });
        }

        // Check for HTML injection attempts (< or >)
        const htmlTagPattern = /[<>]/;
        if (htmlTagPattern.test(name) || htmlTagPattern.test(description)) {
            return res.status(400).json({ message: 'Recipe name and description cannot contain < or > characters.' });
        }

        // Validate name length and word count (Max 8 words, 50 chars)
        if (countWords(name) > 8 || name.trim().length > 50) {
            return res.status(400).json({ message: 'Recipe name cannot exceed 8 words or 50 characters.' });
        }

        // Validate description length and word count (Max 30 words, 200 chars)
        if (countWords(description) > 30 || description.trim().length > 200) {
            return res.status(400).json({ message: 'Description cannot exceed 30 words or 200 characters.' });
        }

        // Validate servings (Whole number 1-100, strict blocking of letters/symbols)
        if (servings === undefined || servings === null || String(servings).trim() === '') {
            return res.status(400).json({ message: 'Servings is required and cannot be blank.' });
        }
        const servingsStr = String(servings).trim();
        if (!/^[1-9]\d*$/.test(servingsStr)) {
            return res.status(400).json({ message: 'Servings must be a positive whole number without e, signs, or decimals.' });
        }
        const parsedServings = Number(servingsStr);
        if (parsedServings < 1 || parsedServings > 100) {
            return res.status(400).json({ message: 'Servings must be a positive whole number between 1 and 100.' });
        }

        // Validate steps format and limits
        let updatedSteps = [];
        if (Array.isArray(steps)) {
            if (steps.some(s => typeof s !== 'string')) {
                return res.status(400).json({ message: 'All recipe steps must be valid text.' });
            }
            updatedSteps = steps.map(s => s.trim()).filter(s => s !== '');
        } else if (typeof steps === 'string') {
            updatedSteps = steps.split('\n').map(s => s.trim()).filter(s => s !== '');
        } else {
            return res.status(400).json({ message: 'Recipe steps are required.' });
        }

        if (updatedSteps.length === 0) {
            return res.status(400).json({ message: 'At least one cooking step is required and cannot be blank.' });
        }

        if (updatedSteps.length > 30) {
            return res.status(400).json({ message: 'A recipe cannot have more than 30 steps.' });
        }

        if (updatedSteps.some(s => htmlTagPattern.test(s))) {
            return res.status(400).json({ message: 'Recipe steps cannot contain < or > characters.' });
        }

        if (updatedSteps.some(s => countWords(s) > 60 || s.length > 400)) {
            return res.status(400).json({ message: 'Each cooking step cannot exceed 60 words (or 400 characters).' });
        }

        // Read recipes database file
        let recipes = [];
        try {
            const data = await fs.readFile(RECIPES_FILE, 'utf8');
            recipes = JSON.parse(data);
            if (!Array.isArray(recipes)) {
                return res.status(500).json({ message: 'Recipe data storage format is invalid.' });
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ message: 'No recipes found in database.' });
            }
            if (err instanceof SyntaxError) {
                return res.status(500).json({ message: 'Recipe database file is corrupted (invalid JSON).' });
            }
            throw err;
        }

        // Find recipe by ID
        const recipeIndex = recipes.findIndex(r => String(r.id) === String(id));
        if (recipeIndex === -1) {
            return res.status(404).json({ message: 'Recipe not found.' });
        }

        // Check for duplicate recipe name (excluding current recipe)
        const duplicateExists = recipes.some(
            (r, idx) => idx !== recipeIndex && r.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (duplicateExists) {
            return res.status(409).json({ message: 'Another recipe with this name already exists.' });
        }

        // Check if any modifications were made
        const existing = recipes[recipeIndex];
        const stepsUnchanged = JSON.stringify(existing.steps || []) === JSON.stringify(updatedSteps);
        if (
            existing.name === name.trim() &&
            existing.description === description.trim() &&
            Number(existing.servings) === parsedServings &&
            stepsUnchanged
        ) {
            return res.status(400).json({ message: 'No changes were detected.' });
        }

        // Update recipe record
        recipes[recipeIndex] = {
            ...existing,
            name: name.trim(),
            description: description.trim(),
            servings: parsedServings,
            steps: updatedSteps
        };

        // Save updated data to JSON file
        await fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8');
        return res.status(200).json({
            message: 'Recipe updated successfully!',
            recipe: recipes[recipeIndex]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error while updating recipe.' });
    }
}

module.exports = { editRecipe };