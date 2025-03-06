const header_requester = document.getElementById("header_requester");

const footer_requester = document.getElementById("footer_requester");

let obstructor;

insert_html("assets/consistent_elements/header.html", header_requester);
insert_html("assets/consistent_elements/footer.html", footer_requester);
function insert_html(html_path, requester) {
    fetch(html_path)
    .then(res => {
        if (res.ok) {
            return res.text();
        }
    })
    .then(htmlSnippet => {
        requester.innerHTML = htmlSnippet;
        resize();
        try {
            crop_images();
        }
        catch {}
        try {
            resize_grid();
        }
        catch {}
        obstructor = document.getElementById("obstructor");
        try {
            initialization();
        }
        catch {}
    })
}