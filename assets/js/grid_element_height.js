window.addEventListener("resize", resize_grid);

function crop_images() {
    let grids = document.getElementsByClassName("grid");
    for (grid of grids) {
        for (grid_element of grid.children) {
            var image_container = grid_element.getElementsByClassName("image_container")[0]
            var image = image_container.children[0]
            if (image.naturalWidth / 320 * 180 < image.naturalHeight) {
                image.style.maxWidth = "100%";
                image.style.maxHeight = "none";
            }
            else {
                image.style.maxWidth = "none";
                image.style.maxHeight = "100%";
            }
        }
    }
}

function resize_grid() {
    let grids = document.getElementsByClassName("grid");
    for (grid of grids) {
        for (grid_element of grid.children) {
            var image_container = grid_element.getElementsByClassName("image_container")[0]
            image_container.style.height = image_container.offsetWidth / 320 * 180 + "px";
        }
    }
}