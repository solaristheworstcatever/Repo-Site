import load from "./loading.js";
let loadingScreen = load();

const main = {};
// All html elements
var elements = document.querySelectorAll("*");

/**
 * @type {object[]}
 */
var attributes = [];
/**
*   @param {string} attribute
*   @param {function} callback
*/
var attributeHandler = async function(attribute, callback) {
    attributes.push({
        /**
         * @param {HTMLElement} element
         */
        checkFor(element) {
            var value = element.getAttribute(attribute);
            if (value) {
                element.removeAttribute(attribute);
                callback(element, value);
            }
        }
    });
}

// Add instructions to asset pages
await attributeHandler("instruction", async function(element, value) {
    let raw = await (await fetch("./assets/instructions/" + value + ".txt")).text();
    if (raw) {
        element.classList.add("container");
        element.classList.add("instructions");

        let header = document.createElement("h2");
        header.textContent = "Installation Guide";
        element.appendChild(header);
        let hr = document.createElement("hr");
        element.appendChild(hr);

        // Parse text file here
        let lines = raw.split("\n");
        
        let programSection = false;
        let programContainer, tabs, tabContent, fillChild;
        let activeTab = false;
        for (let j = 0; j < lines.length; j++) {
            let line = lines[j].trim();
            if (!line || line.length == 0) { continue; }
            if (line == "[program specific]" || line == "[/]") {
                programSection = line == "[program specific]";
                continue;
            }

            // Create the innerHTML for the instructions
            if (line.includes("[")) {
                // Create embedded text links
                line = line.replaceAll(/\[([^|]+)\|([^\]]+)\]/g, `<a href=\"$2\">$1</a>`);
            }
            if (line.includes("`")) {
                line = line.replaceAll(/\s\`/g, " <code>");
                // [`.]txt`
                line = line.replaceAll(/\`/g, "</code>");
            }

            if (!programSection) {
                let step = document.createElement("div");
                step.classList.add("step");
                element.appendChild(step);

                if (line[0] == "{") {
                    let icon = line.split("}")[0].substring(1);
                    line = line.split("}")[1].trim();
                    let iconImg = document.createElement("img");
                    iconImg.src = "./assets/media/img/icons/" + icon + ".svg";
                    step.appendChild(iconImg);
                }

                let text = document.createElement("p");
                text.innerHTML = line;
                step.appendChild(text);
            }
            else {
                if (!programContainer) {
                    programContainer = document.createElement("div");
                    programContainer.classList.add("container");
                    programContainer.classList.add("program-specific");
                    element.appendChild(programContainer);
                    
                    tabs = document.createElement("div");
                    tabs.classList.add("program-tabs");
                    programContainer.appendChild(tabs);

                    tabContent = document.createElement("p");
                    programContainer.appendChild(tabContent);
                }

                let program = line.split("|")[0].trim();
                let instruction = line.split("|")[1].trim();

                let tab = document.createElement("button");
                tab.classList.add("program");
                tab.textContent = program;
                tab.addEventListener('click', () => {
                    if (!tab.classList.contains("active")) {
                        let allTabs = document.getElementsByClassName("program");
                        for (let n = 0; n < allTabs.length; n++) {
                            let childTab = allTabs[n];
                            if (childTab.classList.contains("active")) {
                                childTab.classList.remove("active");
                            }
                        }
                        tab.classList.add("active");
                        tabContent.innerHTML = instruction;
                    }
                });
                if (!activeTab) {
                    activeTab = true;
                    tab.click();
                }
                tabs.appendChild(tab);

                // let temp = document.createElement("p");
                // temp.textContent = line;
                // programContainer.appendChild(temp);
            }
        }
    }
});

import headers from "./headers-module.js";
// Add a section header
await attributeHandler("headers", async function (element, value) {
    let h1Elements = document.querySelectorAll("h1");
    if (h1Elements) {
        // Set headers into a section
        let sectionContainer = document.createElement("div");
        sectionContainer.classList.add("container");
        sectionContainer.classList.add("section-container");
        document.body.appendChild(sectionContainer);
    
        let sectionTitle = document.createElement("h2");
        sectionTitle.textContent = "Sections";
        sectionContainer.appendChild(sectionTitle);
    
        let sectionBreak = document.createElement("hr");
        sectionContainer.appendChild(sectionBreak);
    
        let sections = document.createElement("div");
        sections.classList.add("section-list");
        sectionContainer.appendChild(sections);

        headers.sections = sections;
    
        for (let i = 0; i < h1Elements.length; i++) {
            headers.addHeader(h1Elements[i]);
        }
    }
});

// Handle packs for asset pages / front page
import { loadAssets, loadLevels } from "./asset_packs.js";
await attributeHandler("pack", loadAssets);
await attributeHandler("levels", loadLevels);

// Add a guide forum for guide pages
import { addGuides } from "./guide-forum.js";
await attributeHandler("guides", addGuides);

// Replace all attributes
for (let i = 0; i < elements.length; i++) {
    let element = elements[i];
    if (element) {
        for (let attr of attributes) {
            if (attr) {
                attr.checkFor(element);
            }
        }
    }
}

export default main;

async function includeConsistentElement(type, after = true) {
    fetch("./assets/consistent_elements/" + type + ".html")
    .then((res) => { if (res.ok) { return res.text() }})
    .then((text) => {
        var parser = new DOMParser();
        var doc = parser.parseFromString(text, "text/html");

        var insert = doc.getElementsByClassName(type)[0];
        if (after) {
            document.body.appendChild(insert);
        }
        else {
            document.body.insertBefore(insert, document.body.firstChild);
        }
        
        var styleSheet = document.createElement("link");
        styleSheet.rel = "styleSheet";
        styleSheet.href = "./assets/css/" + type + ".css";
        document.head.appendChild(styleSheet);

        var script = document.createElement("script");
        script.src = "./assets/js/" + type + ".js";
        document.body.appendChild(script);
    })
    .catch((r) => console.log(r));
}
includeConsistentElement("header", false);

loadingScreen.create("images loaded")
.then(async function() {
    window.onload = async function() {
        await loadingScreen.progress(
            Array.prototype.slice.call( document.getElementsByTagName("img") ),
            async function(img) {
                if (img.complete) {
                    return true;
                }
                img.addEventListener('load', function(event){
                    return true;
                })
                img.addEventListener('error', function(event) {
                    console.error(event);
                    reject(img);
                })
                return false;
            }
        );
    }
});