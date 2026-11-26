var ALLOWED_UNITS = [
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

var INGREDIENT_NAME_PATTERN = /^[a-zA-Z]+([ -][a-zA-Z]+)*$/;
var MAX_QUANTITY = 10000;

function addIngredient() {
  var response = "";

  var urlParams = new URLSearchParams(window.location.search);
  var recipeId =
    urlParams.get("id") ||
    (document.getElementById("recipeId")
      ? document.getElementById("recipeId").textContent.trim()
      : "");

  // Collect and normalize form data
  var jsonData = new Object();
  jsonData.recipeId = recipeId.trim();
  jsonData.name = document
    .getElementById("ingredientName")
    .value.trim()
    .replace(/\s+/g, " ");
  jsonData.quantity = document.getElementById("ingredientQuantity").value.trim();
  jsonData.unit = document
    .getElementById("ingredientUnit")
    .value.trim()
    .toLowerCase();
  jsonData.mandatory = document.getElementById("ingredientMandatory").checked;

  // Client-side Validation 1: Required fields
  if (
    jsonData.recipeId === "" ||
    jsonData.name === "" ||
    jsonData.quantity === "" ||
    jsonData.unit === ""
  ) {
    alert("All fields (Ingredient Name, Quantity, and Unit) are required!");
    return;
  }

  // Client-side Validation 2: Ingredient name length and allowed characters
  if (jsonData.name.length < 2 || jsonData.name.length > 50) {
    alert("Ingredient name must be between 2 and 50 characters!");
    return;
  }

  if (!INGREDIENT_NAME_PATTERN.test(jsonData.name)) {
    alert(
      "Ingredient name can only contain letters, spaces, and hyphens (no numbers or special characters)!"
    );
    return;
  }

  // Client-side Validation 3: Quantity must be a finite number between > 0 and 10000
  var parsedQuantity = Number(jsonData.quantity);
  if (
    !Number.isFinite(parsedQuantity) ||
    parsedQuantity <= 0 ||
    parsedQuantity > MAX_QUANTITY
  ) {
    alert(
      "Please enter a valid quantity greater than 0 and at most " +
      MAX_QUANTITY +
      "!"
    );
    return;
  }
  jsonData.quantity = parsedQuantity;

  // Client-side Validation 4: Valid unit type
  if (!ALLOWED_UNITS.includes(jsonData.unit)) {
    alert("Invalid unit! Allowed units: " + ALLOWED_UNITS.join(", "));
    return;
  }

  // Configure the request to POST data to /add-ingredient
  var request = new XMLHttpRequest();
  request.open("POST", "/add-ingredient", true);
  request.setRequestHeader("Content-Type", "application/json");

  request.onload = function () {
    try {
      response = JSON.parse(request.responseText);
    } catch (e) {
      alert("Unexpected server response. Please try again.");
      return;
    }

    console.log(response);

    if (request.status === 201) {
      alert("Added Ingredient: " + jsonData.name + "!");

      document.getElementById("ingredientName").value = "";
      document.getElementById("ingredientQuantity").value = "";
      document.getElementById("ingredientUnit").value = "";
      document.getElementById("ingredientMandatory").checked = false;

      $("#ingredientModal").modal("hide");

      if (typeof viewRecipeDetails === "function") {
        viewRecipeDetails();
      }
    } else {
      alert(response.message || "Unable to add ingredient!");
    }
  };

  request.onerror = function () {
    alert("Network error: Could not connect to the server.");
  };

  request.send(JSON.stringify(jsonData));
}