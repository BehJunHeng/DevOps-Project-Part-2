//fills pop-up when Remove Ingredient is clicked
// current recipe comes from recipe-details.js

function openRemoveIngredient() {
    document.getElementById('removeTitle').innerHTML = 'Remove Ingredient from ' + currentRecipe.name;
    document.getElementById('removeName').value = '';
    document.getElementById('removeMessage').innerHTML = '';
    document.getElementById('removeMessage').className = '';
    fillIngredientList();
}

//shows recipe ingredients in pop up
function fillIngredientList() {
    var ingredients = currentRecipe.ingredients || [];
    var html =''
    for (var i = 0; i < ingredients.length; i++) {
        html += '<li>' + ingredients[i].name + ' ' + ingredients[i].quantity + ' ' + ingredients[i].unit;
        if (ingredients[i].mandatory) {
            html += ' <span class="badge badge-warning">Mandatory</span>';
        }
        html += '</li>';
    }
    document.getElementById('removeList').innerHTML = html;
}

//shows red (danger) or green(success) in the pop-up
function showRemoveMessage(text,type) {
    var box = document.getElementById('removeMessage');
    box.className = 'alert alert-' + type;
    box.innerHTML = text;
}

//runs when red Remove Ingredient button in the pop up is clicked

function removeIngredient() {
    var name = document.getElementById('removeName').value.trim();
    //empty name
    if (name === '') {
        showRemoveMessage('Ingredient name is required', 'danger');
        return;
    }

    if (!/^[A-Za-z ]+$/.test(name)|| name.length > 30) {
        showRemoveMessage('Name can only contain letters and spaces, up to 30 characters', 'danger');
        return;
    }
    //passed page check, so send DELETE to backend
    var request = new XMLHttpRequest();
    request.open('DELETE', '/remove-ingredient/' + currentRecipe.id, true);
    request.setRequestHeader('Content-Type', 'application/json');

    request.onload = function () {
        var response = JSON.parse(request.responseText);
        if (request.status === 200) {
            //success
            showRemoveMessage(response.message, 'success');
            currentRecipe = response.recipe;
            fillIngredientList();
            document.getElementById('removeName').value = ''
            viewRecipeDetails();
        } else {
            showRemoveMessage(response.message, 'danger');
        }
    };
    //cannot reach server
    request.onerror = function () {
        showRemoveMessage('Could not connect to server','danger');
    }
    request.send(JSON.stringify({ name:name }));
}