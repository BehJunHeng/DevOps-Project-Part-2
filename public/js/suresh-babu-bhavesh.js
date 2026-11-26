// ==========================================
// INGREDIENTS
// ==========================================

var recipeIngredients = [];

var ALLOWED_UNITS = [
    "cup", "pcs", "clove", "tbsp", "tsp",
    "g", "kg", "ml", "l", "pinch", "slice"
];

// Open the ingredient modal
function addIngredientToRecipe() {
    $("#ingredientModal").modal("show");
}

// Validate and save an ingredient temporarily
function saveIngredientToRecipe() {
    var name = document.getElementById("ingredientName").value.trim();
    var quantityText = document.getElementById("ingredientQuantity").value.trim();
    var quantity = Number(quantityText);
    var unit = document.getElementById("ingredientUnit").value.trim().toLowerCase();
    var mandatory = document.getElementById("ingredientMandatory").checked;

    if (name === "" || quantityText === "" || unit === "") {
        alert("Please fill in all ingredient fields.");
        return;
    }

    if (name.length < 2 || name.length > 50 ||
        !/^[a-zA-Z]+([ -][a-zA-Z]+)*$/.test(name)) {
        alert("Ingredient name must be 2–50 characters and contain only letters, spaces or hyphens.");
        return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 10000) {
        alert("Quantity must be greater than 0 and at most 10000.");
        return;
    }

    if (!ALLOWED_UNITS.includes(unit)) {
        alert("Please select a valid measurement unit.");
        return;
    }

    var duplicate = recipeIngredients.some(function (ingredient) {
        return ingredient.name.toLowerCase() === name.toLowerCase();
    });

    if (duplicate) {
        alert("This ingredient has already been added.");
        return;
    }

    recipeIngredients.push({
        name: name,
        quantity: quantity,
        unit: unit,
        mandatory: mandatory
    });

    displayRecipeIngredients();

    document.getElementById("ingredientName").value = "";
    document.getElementById("ingredientQuantity").value = "";
    document.getElementById("ingredientUnit").value = "";
    document.getElementById("ingredientMandatory").checked = false;

    $("#ingredientModal").modal("hide");
}


// Display ingredients on the page
function displayRecipeIngredients() {
    var ingredientList = document.getElementById("ingredientsList");
    ingredientList.innerHTML = "";

    recipeIngredients.forEach(function (ingredient, index) {
        var item = document.createElement("li");
        item.className = "list-group-item d-flex justify-content-between align-items-center";

        var ingredientText = document.createElement("span");
        ingredientText.textContent =
            ingredient.quantity + " " +
            ingredient.unit + " " +
            ingredient.name +
            (ingredient.mandatory ? " (Mandatory)" : "");

        var removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "btn btn-danger btn-sm";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", function () {
            recipeIngredients.splice(index, 1);
            displayRecipeIngredients();
        });

        item.appendChild(ingredientText);
        item.appendChild(removeButton);
        ingredientList.appendChild(item);
    });
}


// ==========================================
// COOKING STEPS
// ==========================================

const stepInput = document.getElementById("stepInput");
const addStepButton = document.getElementById("addStep");
const stepsContainer = document.getElementById("stepsContainer");

addStepButton.addEventListener("click", function () {
    const stepText = stepInput.value.trim();

    if (stepText === "") {
        alert("Please enter a cooking step.");
        return;
    }

    const stepElement = document.createElement("div");
    stepElement.className =
        "alert alert-light border mt-2 d-flex justify-content-between align-items-center";

    const stepTextElement = document.createElement("span");
    stepTextElement.textContent = stepText;
    stepElement.appendChild(stepTextElement);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "btn btn-danger btn-sm";
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", function () {
        stepsContainer.removeChild(stepElement);
        updateStepNumbers();
    });

    stepElement.appendChild(removeButton);
    stepsContainer.appendChild(stepElement);

    updateStepNumbers();
    stepInput.value = "";
});


function updateStepNumbers() {
    const stepElements = stepsContainer.children;

    for (let i = 0; i < stepElements.length; i++) {
        const stepText = stepElements[i].querySelector("span");

        // Remove the previous step number, if present
        const textWithoutNumber =
            stepText.textContent.replace(/^Step \d+:\s*/, "");

        stepText.textContent = "Step " + (i + 1) + ": " + textWithoutNumber;
    }
}


// ==========================================
// SUBMIT RECIPE
// ==========================================

const recipeForm = document.getElementById("recipeForm");
const message = document.getElementById("message");

recipeForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const description = document.getElementById("description").value.trim();
    const servingsText = document.getElementById("servings").value.trim();
    const servings = Number(servingsText);

    message.textContent = "";
    message.className = "mt-3";

    // Validate recipe name
    if (name === "" || name.length > 80) {
        showMessage("Recipe name is required and must not exceed 80 characters.", "danger");
        return;
    }

    // Validate description
    if (description === "" || description.length > 500) {
        showMessage("Description is required and must not exceed 500 characters.", "danger");
        return;
    }

    // Validate servings
    if (servingsText === "" || !Number.isInteger(servings) || servings <= 0) {
        showMessage("Servings must be a positive whole number.", "danger");
        return;
    }

    // Validate ingredients
    if (recipeIngredients.length === 0) {
        showMessage("Please add at least one ingredient.", "danger");
        return;
    }

    // Collect cooking steps without their display numbers
    const steps = Array.from(stepsContainer.children).map(function (element) {
        return element.querySelector("span").textContent
            .replace(/^Step \d+:\s*/, "").trim();
    });

    if (steps.length === 0 || steps.some(function (step) {
        return step === "";
    })) {
        showMessage("Please add at least one cooking step.", "danger");
        return;
    }

    // Prepare the recipe object
    const jsonData = {
        name: name,
        description: description,
        servings: servings,
        ingredients: recipeIngredients,
        steps: steps
    };

    // Send recipe to backend
    const request = new XMLHttpRequest();

    request.open("POST", "/add-recipe", true);
    request.setRequestHeader("Content-Type", "application/json");

    request.onload = function () {
        let response;

        try {
            response = JSON.parse(request.responseText);
        } catch (error) {
            showMessage("Unexpected server response. Please try again.", "danger");
            return;
        }

        if (request.status === 201) {
            showMessage("Recipe added successfully!", "success");

            recipeForm.reset();

            recipeIngredients = [];
            displayRecipeIngredients();

            stepsContainer.innerHTML = "";

        } else {
            showMessage(
                response.message || "Unable to add recipe.",
                "danger"
            );
        }
    };

    request.onerror = function () {
        showMessage("Network error. Could not connect to the server.", "danger");
    };

    request.send(JSON.stringify(jsonData));
});


function showMessage(text, type) {
    message.textContent = text;
    message.className = "alert alert-" + type + " mt-3";
}