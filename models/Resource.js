class Ingredient {
  constructor(name, quantity, unit, mandatory = false) {
    this.name = name;
    this.quantity = quantity;
    this.unit = unit;
    this.mandatory = mandatory;
  }
}

class Recipe {
  constructor(name, description, servings, ingredients, steps) {
    this.id = this.generateId();
    this.name = name;
    this.description = description;
    this.servings = servings;
    this.ingredients = ingredients;
    this.steps = steps;
  }

  generateId() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return timestamp + "" + random.toString().padStart(3, "0");
  }
}

module.exports = { Recipe, Ingredient };
