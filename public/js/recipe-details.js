var currentRecipe = null;

function viewRecipeDetails() {
    var id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        showError('No recipe selected');
        return;
    }

    var request = new XMLHttpRequest();
    request.open('GET', '/view-recipes/' + encodeURIComponent(id), true);

    request.onload = function () {
        if (request.status !== 200) {
            showError('Recipe not found');
            return;
        }
        var recipe = JSON.parse(request.responseText);
        currentRecipe = recipe;

        document.getElementById('recipeName').innerHTML = recipe.name;
        document.getElementById('recipeDescription').innerHTML = recipe.description || '';
        document.getElementById('recipeId').innerHTML = recipe.id;
        document.getElementById('recipeServings').innerHTML = recipe.servings || '-';

        var ingredients = recipe.ingredients || [];
        var html = '';
        for (var i = 0; i < ingredients.length; i++) {
            var badge = ingredients[i].mandatory
                ? '<span class="badge badge-warning">Mandatory</span>'
                : '<span class="badge badge-secondary">Optional</span>';
            html += '<tr>' +
                '<td>' + ingredients[i].name + '</td>' +
                '<td>' + ingredients[i].quantity + '</td>' +
                '<td>' + ingredients[i].unit + '</td>' +
                '<td>' + badge + '</td>' +
                '</tr>';
        }
        document.getElementById('ingredientsContent').innerHTML = html;
        document.getElementById('ingredientCount').innerHTML = ingredients.length + ' ingredients';

        var steps = recipe.steps || [];
        var stepsHtml = '';
        for (var j = 0; j < steps.length; j++) {
            stepsHtml += '<li>' + steps[j] + '</li>';
        }
        document.getElementById('stepsContent').innerHTML = stepsHtml || 'No steps added';

        document.getElementById('recipeDetails').classList.remove('d-none');
    };

    request.onerror = function () {
        showError('Unable to load recipe details');
    };

    request.send();
}

function showError(message) {
    var box = document.getElementById('errorMessage');
    box.innerHTML = message;
    box.classList.remove('d-none');
}