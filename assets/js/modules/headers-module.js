const headers = {
    headers: 0,
    sections: null,
    addHeader(header) {
        let headerContainer = document.createElement("div");
        headerContainer.classList.add("h1-container");
        header.parentNode.insertBefore(headerContainer, header);
        header.remove();
        let headerHeader = document.createElement("div");
        headerHeader.appendChild(header);
        
        let hrContainer = document.createElement("div");
        hrContainer.classList.add("h1-divider");
        
        let hr = document.createElement("hr");
        hrContainer.append(hr);

        let copyLink = document.createElement("img");
        copyLink.src = "./assets/media/img/icons/copy_link.svg"
        copyLink.classList.add("copy-link");
        let anchor = window.location.href;
        if (anchor.includes("#")) {
            anchor = anchor.split("#")[0];
        }
        anchor +=  "#" + header.textContent;
        anchor = anchor.replaceAll(" ", "%20");
        
        copyLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(anchor);
            
            let copied = document.createElement("div");
            copied.textContent = "Copied!";
            copied.classList.add("copied");
            headerContainer.appendChild(copied);
            copied.addEventListener('animationend', () =>
            {   
                headerContainer.removeChild(copied);
            })
        });
        header.id = header.textContent; // Set the anchor point
        header.style.scrollMarginTop = "200px";

        let sectionsQuickLink = document.createElement("a");
        sectionsQuickLink.href = anchor;
        this.sections.appendChild(sectionsQuickLink);
        let sectionsQuickLinkText = document.createElement("h3");
        sectionsQuickLinkText.textContent = header.textContent;
        sectionsQuickLink.appendChild(sectionsQuickLinkText);

        if (this.headers % 2 == 0) {
            headerContainer.id = "left";
            headerContainer.appendChild(copyLink);
            headerContainer.appendChild(headerHeader);
            headerContainer.appendChild(hrContainer);
        }
        else {
            headerContainer.id = "right";
            headerContainer.appendChild(hrContainer);
            headerContainer.appendChild(headerHeader);
            headerContainer.appendChild(copyLink);
        }
        this.headers++;

        // Add event listeners
        headerContainer.addEventListener('mouseenter', () => {
            if (window.screen.availWidth > 850) {
                copyLink.style.opacity = 1;
            }
        });
        headerContainer.addEventListener('mouseleave', () => {
            if (window.screen.availWidth > 850) {
                copyLink.style.opacity = 0;
            }
        });
    }
}

export default headers;