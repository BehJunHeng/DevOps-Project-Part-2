// Initialize event listeners when DOM loads
document.addEventListener('DOMContentLoaded', function () {
    var editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.addEventListener('click', openEditRecipeModal);
    }
});

// Helper function to count words
function countWords(str) {
    return str.trim().split(/\s+/).filter(Boolean).length;
}

// Open the edit recipe modal and populate fields with current recipe data
function openEditRecipeModal() {
    var activeRecipe = (typeof currentRecipe !== 'undefined' && currentRecipe) ? currentRecipe : window.currentRecipe;
    if (!activeRecipe || !activeRecipe.id) {
        alert('Error: Recipe not found or not loaded yet.');
        return;
    }
    window.currentRecipe = activeRecipe;

    document.getElementById('editRecipeName').value = activeRecipe.name || '';
    document.getElementById('editRecipeDescription').value = activeRecipe.description || '';
    document.getElementById('editRecipeServings').value = activeRecipe.servings || '';
    document.getElementById('editRecipeSteps').value = (activeRecipe.steps || []).join('\n');

    $('#editRecipeModal').modal('show');
}

// Validate inputs and submit update via PUT request
function updateRecipe() {
    var activeRecipe = (typeof currentRecipe !== 'undefined' && currentRecipe) ? currentRecipe : window.currentRecipe;
    if (!activeRecipe || !activeRecipe.id) {
        alert('Error: No valid recipe selected to update.');
        return;
    }

    var name = document.getElementById('editRecipeName').value.trim();
    var description = document.getElementById('editRecipeDescription').value.trim();
    var servingsInput = document.getElementById('editRecipeServings');
    var servingsVal = servingsInput.value.trim();
    var stepsText = document.getElementById('editRecipeSteps').value;

    // Check for blank inputs
    if (!name || !description) {
        alert('Recipe name and description are required and cannot be blank!');
        return;
    }

    // Strict name validation: Letters and spaces only (blocks numbers like 123 and symbols like !)
    if (!/^[a-zA-Z\s]+$/.test(name)) {
        alert('Recipe name must contain letters and spaces only (no numbers or symbols like !)!');
        return;
    }

    // Check for HTML injection characters
    var htmlTagPattern = /[<>]/;
    if (htmlTagPattern.test(name) || htmlTagPattern.test(description) || htmlTagPattern.test(stepsText)) {
        alert('Inputs cannot contain < or > characters!');
        return;
    }

    // Validate name word & character limits
    if (countWords(name) > 8 || name.length > 50) {
        alert('Recipe name cannot exceed 8 words or 50 characters!');
        return;
    }

    // Validate description word & character limits
    if (countWords(description) > 30 || description.length > 200) {
        alert('Description cannot exceed 30 words or 200 characters!');
        return;
    }

    // Validate servings input
    if (servingsInput.validity && servingsInput.validity.badInput) {
        alert('Servings must be a valid positive whole number!');
        return;
    }

    if (servingsVal === '') {
        alert('Servings is required and cannot be blank!');
        return;
    }

    if (!/^[1-9]\d*$/.test(servingsVal)) {
        alert('Servings must be a positive whole number!');
        return;
    }

    var parsedServings = Number(servingsVal);
    if (parsedServings < 1 || parsedServings > 100) {
        alert('Servings must be between 1 and 100!');
        return;
    }

    // Validate steps format and quantity
    var stepsArray = stepsText
        .split('\n')
        .map(function (step) { return step.trim(); })
        .filter(function (step) { return step !== ''; });

    if (stepsArray.length === 0) {
        alert('At least one cooking step is required and cannot be blank!');
        return;
    }

    if (stepsArray.length > 30) {
        alert('A recipe cannot have more than 30 steps!');
        return;
    }

    for (var i = 0; i < stepsArray.length; i++) {
        if (countWords(stepsArray[i]) > 60 || stepsArray[i].length > 400) {
            alert('Step ' + (i + 1) + ' exceeds the limit of 60 words (or 400 characters)!');
            return;
        }
    }

    // Check if any changes were made
    var existingSteps = activeRecipe.steps || [];
    if (
        name === (activeRecipe.name || '') &&
        description === (activeRecipe.description || '') &&
        parsedServings === Number(activeRecipe.servings) &&
        JSON.stringify(stepsArray) === JSON.stringify(existingSteps)
    ) {
        alert('No changes were made.');
        return;
    }

    var saveBtn = document.querySelector('#editRecipeModal .btn-primary');
    if (saveBtn) saveBtn.disabled = true;

    var jsonData = {
        name: name,
        description: description,
        servings: parsedServings,
        steps: stepsArray
    };

    // Send AJAX PUT request to backend
    var request = new XMLHttpRequest();
    request.open('PUT', '/edit-recipe/' + encodeURIComponent(activeRecipe.id), true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        if (saveBtn) saveBtn.disabled = false;

        var response = {};
        try {
            response = JSON.parse(request.responseText);
        } catch (e) {
            alert('Invalid response from server.');
            return;
        }

        if (request.status === 200) {
            alert(response.message);
            $('#editRecipeModal').modal('hide');
            if (typeof viewRecipeDetails === 'function') {
                viewRecipeDetails();
            }
            if (typeof viewRecipes === 'function') {
                viewRecipes();
            }
        } else {
            alert(response.message || 'Unable to update recipe!');
        }
    };

    request.onerror = function () {
        if (saveBtn) saveBtn.disabled = false;
        alert('Network error: Unable to reach the server.');
    };

    request.send(JSON.stringify(jsonData));
}