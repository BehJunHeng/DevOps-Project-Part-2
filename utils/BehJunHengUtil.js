const { Ingredient } = require("../models/Resource");
const fs = require("fs").promises;
const path = require("path");

const RECIPES_FILE = path.join("utils", "recipes.json");
const TEMPLATE_FILE = path.join("utils", "recipes.template.json");

const ALLOWED_UNITS = [
  "cup",
  "pcs",
  "clove",
  "tbsp",
  "tsp",
  "g",
  "kg",
  "ml",
  "l",
  "pinch",
  "slice",
];

const INGREDIENT_NAME_PATTERN = /^[a-zA-Z]+([ -][a-zA-Z]+)*$/;
const MAX_QUANTITY = 10000;

async function addIngredient(req, res) {
  try {
    const recipeId = req.params.id || req.body.recipeId;
    const { name, quantity, unit, mandatory } = req.body;

    // Error 1: Missing required fields
    if (
      recipeId === undefined ||
      recipeId === null ||
      String(recipeId).trim() === "" ||
      name === undefined ||
      name === null ||
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      unit === undefined ||
      unit === null
    ) {
      return res.status(400).json({
        message: "All fields (recipeId, name, quantity, and unit) are required!",
      });
    }

    // Error 2: Invalid data types for text/boolean fields
    if (typeof name !== "string" || typeof unit !== "string") {
      return res.status(400).json({
        message: "Ingredient name and unit must be valid text strings!",
      });
    }

    if (mandatory !== undefined && typeof mandatory !== "boolean") {
      return res.status(400).json({
        message: "Mandatory field must be a boolean (true or false)!",
      });
    }

    const cleanedName = name.trim().replace(/\s+/g, " ");
    const normalizedUnit = unit.trim().toLowerCase();

    if (cleanedName === "" || normalizedUnit === "") {
      return res.status(400).json({
        message: "Ingredient name and unit cannot be empty!",
      });
    }

    // Error 3: Invalid ingredient name (length, numbers, or special characters)
    if (cleanedName.length < 2 || cleanedName.length > 50) {
      return res.status(400).json({
        message: "Ingredient name must be between 2 and 50 characters!",
      });
    }

    if (!INGREDIENT_NAME_PATTERN.test(cleanedName)) {
      return res.status(400).json({
        message:
          "Ingredient name can only contain letters, spaces, and hyphens (no numbers or special characters)!",
      });
    }

    // Error 4: Invalid quantity (rejects booleans, arrays, NaN, <= 0, or > 10000)
    if (typeof quantity === "boolean" || Array.isArray(quantity)) {
      return res.status(400).json({
        message: "Quantity must be a valid number!",
      });
    }

    const parsedQuantity = Number(quantity);
    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0 ||
      parsedQuantity > MAX_QUANTITY
    ) {
      return res.status(400).json({
        message: `Quantity must be a valid number greater than 0 and at most ${MAX_QUANTITY}!`,
      });
    }

    // Error 5: Invalid unit type
    if (!ALLOWED_UNITS.includes(normalizedUnit)) {
      return res.status(400).json({
        message: `Invalid unit type! Allowed units: ${ALLOWED_UNITS.join(", ")}.`,
      });
    }

    // Read existing recipes.json 
    let recipes = [];
    try {
      const data = await fs.readFile(RECIPES_FILE, "utf8");
      recipes = JSON.parse(data);
    } catch (err) {
      if (err.code === "ENOENT") {
        const templateData = await fs.readFile(TEMPLATE_FILE, "utf8");
        recipes = JSON.parse(templateData);
      } else {
        throw err;
      }
    }

    // Error 6: Target recipe does not exist
    const recipeIndex = recipes.findIndex(
      (r) => String(r.id) === String(recipeId).trim()
    );
    if (recipeIndex === -1) {
      return res.status(404).json({
        message: "Recipe not found!",
      });
    }

    const targetRecipe = recipes[recipeIndex];
    if (!Array.isArray(targetRecipe.ingredients)) {
      targetRecipe.ingredients = [];
    }

    // Error 7: Duplicate ingredient check (case- and extra-space-insensitive)
    const normalizedName = cleanedName.toLowerCase();
    const isDuplicate = targetRecipe.ingredients.some(
      (ing) =>
        ing.name.trim().replace(/\s+/g, " ").toLowerCase() === normalizedName
    );
    if (isDuplicate) {
      return res.status(409).json({
        message: `Ingredient "${cleanedName}" already exists in ${targetRecipe.name}!`,
      });
    }

    const newIngredient = new Ingredient(
      normalizedName,
      parsedQuantity,
      normalizedUnit,
      Boolean(mandatory)
    );

    targetRecipe.ingredients.push(newIngredient);

    await fs.writeFile(
      RECIPES_FILE,
      JSON.stringify(recipes, null, 2),
      "utf8"
    );

    return res.status(201).json({
      message: "Ingredient added successfully!",
      recipe: targetRecipe,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}

module.exports = { addIngredient };