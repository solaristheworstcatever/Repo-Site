document.getElementById("search_line").addEventListener("input", filter_results);

function filter_results() {
    var line_input = document.getElementById('search_line').value.toLowerCase();
    /* console.log(line_input); */

    var grids = document.getElementsByClassName("grid");

    /* console.log(grids); */

    for (let grid of grids) {
        for (let link of grid.children) {
            for (let h3 of link.querySelectorAll("h3")) {
                var item_name = h3.innerText.toLowerCase();
                if (!item_name.includes(line_input)) {
                    link.style.display = "none";
                }
                else {
                    /* console.log(item_name); */
                    link.style.display = "flex";
                }
            }
        }
    }
    
    var categories = document.getElementsByClassName("category");


    var hidden_categories = 0;


    for (let category of categories) {
        var hidden_title = true;
        for (let link of category.querySelector(".grid").children) {
            if (link.style.display == "flex") {
                hidden_title = false;
                break;
            }
        }
        if (hidden_title) {
            hidden_categories = hidden_categories + 1;
            try {
                category.querySelector(".combined_title").style.display = "none";
            } catch (error) {

            }
            category.querySelector(".grid").style.display = "none";
        } else {
            try {
                category.querySelector(".combined_title").style.display = "flex";
            } catch (error) {

            }
            category.querySelector(".grid").style.display = "grid";
        }
    }

    var no_results = document.getElementById("no_results");
    if (hidden_categories == categories.length) {
        no_results.style.display = "block";
    } else {
        no_results.style.display = "none";
    }
    hidden_categories = 0;

    resize();

}