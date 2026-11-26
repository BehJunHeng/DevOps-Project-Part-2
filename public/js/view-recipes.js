function viewRecipes() {
    var response = '';
    var request = new XMLHttpRequest();
    request.open('GET', '/view-recipes' , true);
    request.setRequestHeader('Content-Type', 'application/json');
    
    request.onload = function () {
        response = JSON.parse(request.responseText);

        var html = ''
        for (var i = 0; i < response.length; i++) {
            //clicking the row opens the details page for the recipe
            html += '<tr class="recipe-row" onclick="window.location.href=\'recipe-details.html?id=' + response[i].id + '\'">' +
                '<td>' + (i +1) + '</td>' +
                '<td>' + response[i].name + '</td>' + 
                '<td>' + response[i].description + '</td>' + 
                '<td class="text-right">&#8250;</td>' +
            '</tr>';    
        }
        document.getElementById('tableContent').innerHTML = html;
    };
    request.send();
}