var recipesList = [];

// Fetch and render recipes in the 4-column table format
function viewRecipes() {
    var request = new XMLHttpRequest();
    request.open('GET', '/view-recipes', true);

    request.onload = function () {
        if (request.status !== 200) {
            return;
        }
        var recipes = JSON.parse(request.responseText);
        recipesList = recipes;
        var html = '';

        // Build table rows dynamically
        for (var i = 0; i < recipes.length; i++) {
            var r = recipes[i];
            html += '<tr style="cursor: pointer;" onclick="window.location.href=\'recipe-details.html?id=' + encodeURIComponent(r.id) + '\'">' +
                '<td>' + r.id + '</td>' +
                '<td>' + r.name + '</td>' +
                '<td>' + (r.description || '') + '</td>' +
                '<td class="text-right">&rsaquo;</td>' +
                '</tr>';
        }

        document.getElementById('tableContent').innerHTML = html;
    };

    request.send();
}