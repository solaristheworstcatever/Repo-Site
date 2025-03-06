window.addEventListener("resize", resize);

var website_content = document.getElementById('website_content');


function resize() {
    let footer = document.querySelector(".footer");

    website_content.style.height = "auto";
    var website_content_height = website_content.offsetHeight;


    var footer_height = footer.offsetHeight;
    /* console.log(footer_height); */

    /* full height of the page content */
    var full_height = website_content_height + 330 + footer_height;
    /* final height of website_content */
    var final_height = website_content_height;
    
    let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    let bg_container = document.getElementById("bg_container");
    if (full_height <= vh) {
        final_height = vh - 330 - footer_height;
        website_content.style.height = final_height - 70 + "px";
        
    }

    var background = document.getElementById("background");
    if (full_height <= background.offsetHeight) {
        bg_container.style.overflow = "hidden";
    } else {
        bg_container.style.overflow = "visible";
    }

    document.documentElement.style.setProperty("--background_height", final_height + 330 + 'px');
}