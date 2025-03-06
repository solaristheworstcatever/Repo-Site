
/* document.addEventListener("DOMContentLoaded", initialization); */

function initialization() {
    let selectors = document.getElementsByClassName("selector");

    for (let i = 0; i < selectors.length; i++) {
        var selector = selectors.item(i);
        let buttons = selector.children[0].children;
        for (let button of buttons) {
            let input = button.children[0];
            input.name = input.name + i;
            input.value = input.value + i;
            input.addEventListener("input", () => selector_page_change('leditor_selector' + i, input.value))
        }
        buttons[0].children[0].checked = true;
        let content = selector.children[1];
        content.id = content.id + i;
        let options = content.children;
        for (let option of options) {
            option.id = option.id + i;
        }




        selector_page_change('leditor_selector' + i, "community" + i);
    }
}


window.addEventListener("resize", selectors_refresh_all);


function selector_page_change(selector_id, input_value) {
    /* console.log(input_value + ", " + selector_id); */
    let selector = document.getElementById(selector_id);
    for (let option of selector.children) {
        if (option.id != input_value) {
            option.style.opacity = 0;
            option.style.left = "-30px";
            setTimeout(function() { option.style.left = "60px" }, 150);
        }
        else {
            option.style.opacity = "100%";
            option.style.left = 0;
        }
    }
    let input_element = document.getElementById(input_value);
    let selector_height = input_element.offsetHeight;
    selector.style.height = selector_height + "px";
    let bg_interval_id;
    bg_interval_id = setInterval(resize, 1);
    setTimeout(function() {clearInterval(bg_interval_id) }, 151);
    /* console.log(selector_get_page(selector_id)); */
}

function selector_get_page(selector_id) {
    let current_page;
    let selector = document.getElementById(selector_id);
    for (let option of selector.children) {
        if (option.style.opacity == 1) {
            current_page = option.id;
        }
    }
    return current_page;
}

/* function used when the window width changes */
function selectors_refresh_all() {
    let selectors = document.getElementsByClassName('selector_content')
    for (let selector of selectors) {
        let page = selector_get_page(selector.id);
        selector_page_change(selector.id, page)
    }
    /* console.log("resized"); */
}