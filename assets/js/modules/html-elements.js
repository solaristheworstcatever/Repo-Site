let html = {};

// create sections
html.createHeaderSection = function() {
    
}
    
// Custom select element
html.createSelectElement = async function() {
    let elem = document.createElement("div");
    elem.classList.add("select");

    // The live preview of the unselected dropdown
    let previewElem = elem.appendChild(document.createElement("div"));
    previewElem.classList.add("select-container");
    let title = previewElem.appendChild(document.createElement("p"));
    let arrow = previewElem.appendChild(document.createElement("img"));
    arrow.src = "assets/media/img/icons/triangle.svg";

    // The options container
    let optionsElem = elem.appendChild(document.createElement("div"));
    optionsElem.classList.add("option-container");

    previewElem.addEventListener('click', function() {
        previewElem.style.display = "none";
        optionsElem.style.display = "flex";
    });
    function closeSelect(){
        previewElem.style.display = "flex";
        optionsElem.style.display = "none";
    };
    elem.addEventListener('mouseleave', closeSelect);

    return {
        element: elem,
        options: [],
        addOption(title, value) {
            let option = optionsElem.appendChild(document.createElement("div"));
            option.classList.add("select-option");
            let optionTitle = option.appendChild(document.createElement("p"));
            optionTitle.textContent = title;
            let optionArrow = option.appendChild(document.createElement("img"));
            optionArrow.src = "assets/media/img/icons/triangle.svg";

            let o = {
                element: option,
                value: value
            };
            this.options.push(o);
            return o;
        },
        setValue(option) {
            if (elem.value != option.value) {
                elem.value = option.value;
                title.textContent = option.element.textContent;
                for (let o of this.options) {
                    o.element.classList.remove("selected");
                }
                option.element.classList.add("selected");
                closeSelect();
    
                elem.dispatchEvent(new Event('change'));
            }
            else {
                closeSelect();
            }
        }
    }
}

export default html;