
function open_popup(popup_id) {
    
    obstructor.style.height = "100%";
    obstructor.style.opacity = 1;

    let popup = document.getElementById(popup_id);
    let popup_list = document.getElementById(popup_id + "_list");
    popup.style.height = "calc(100% - 60px)";
    popup.style.opacity = 1;
    popup.style.top = "27px";
    popup_list.scroll(0, 0);

}

function close_popup() {
    obstructor.style.opacity = 0;
    setTimeout(function() {obstructor.style.height = 0}, 150);

    let popups = document.getElementsByClassName("window");
    for (let popup of popups) {
        popup.style.height = 0;
        popup.style.opacity = 0;
        setTimeout(function() {popup.style.top = "-30px"}, 150);
    }
}