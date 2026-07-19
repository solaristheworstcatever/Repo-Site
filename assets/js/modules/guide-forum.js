/**
 * @param {HTMLElement} element
 * @param {string} value
 */
export async function addGuides(element, value) {
    let raw = await (await fetch(`assets/guides/${value}.txt`)).text();
    if (raw && raw.length > 0) {
        let rawLines = raw.split("\n");

        element.classList.add("container");
        element.classList.add("text-guides");

        let topic, bodyContent;
        for (let line of rawLines) {
            // Parse lines
            if (line && line != "" && !line.startsWith("//")) {
                if (line.startsWith("-[")) {
                    let topicTitle = line.match(/(?<=\-\[)([^\]])+/);
                    if (topicTitle) {
                        topicTitle = topicTitle[0];

                        topic = element.appendChild(document.createElement("div"));
                        topic.classList.add("topic");

                        let placeHolder = document.getElementById("search-bar");
                        if (placeHolder && placeHolder.tagName == "DIV") {
                            // Create search bar
                            let searchBar = placeHolder.parentElement.insertBefore(document.createElement("input"), placeHolder);
                            placeHolder.remove();
                            
                            searchBar.type = "input";
                            searchBar.id = "search-bar";
                            searchBar.placeholder = "Search for a video or article";
                            searchBar.addEventListener('input', function() {
                                let value = searchBar.value.toLocaleLowerCase();
                                // Filter articles
                                for (let topic of document.getElementsByClassName("topic")) {
                                    let title = topic.getElementsByTagName("h2")[0];
                                    if (title.textContent.toLocaleLowerCase().match(value)) {
                                        topic.style.display = "flex";
                                    }
                                    else {
                                        topic.style.display = "none";
                                    }
                                }
                            });
                        }

                        let titleContainer = topic.appendChild(document.createElement("div"))
                        titleContainer.classList.add("title");

                        let copyLink = titleContainer.appendChild(document.createElement("img"));
                        copyLink.src = "./assets/media/img/icons/copy_link.svg";
                        copyLink.classList.add("copy-link");

                        let title = titleContainer.appendChild(document.createElement("h2"));
                        title.textContent = topicTitle;

                        let anchor = window.location.href;
                        if (anchor.includes("#")) {
                            anchor = anchor.split("#")[0];
                        }
                        anchor +=  "#" + title.textContent;
                        anchor = anchor.replaceAll(" ", "%20");

                        const observer = new IntersectionObserver( 
                            ([e]) => e.target.classList.toggle('sticky', e.intersectionRatio < 1),
                            {threshold: [1]}
                          );
                          observer.observe(titleContainer);
                        
                        bodyContent = topic.appendChild(document.createElement("div"));
                        bodyContent.classList.add("topic-content");

                        // Add click behavior
                        titleContainer.addEventListener(`click`, function() {
                            this.parentElement.classList.toggle("active");
                        });
                    }
                }
                else {
                    // Parse line info here
                    if (line.includes("[")) {
                        // Create embedded text links
                        line = line.replaceAll(/\[([^|]+)\|([^\]]+)\]/g, `<a href=\"$2\">$1</a>`);
                    }
                    if (line.includes("`")) {
                        line = line.replaceAll(/\s\`/g, " <code>");
                        // [`.]txt`
                        line = line.replaceAll(/\`/g, "</code>");
                    }
                    if (line.includes("(")) {
                        line = line.replaceAll(/\(([^|]+)\|([^\]]+)\)/g, `<span class="text-$2">$1</span>`);
                    }
                    if (line.startsWith("-")) {
                        line = line.replace(/-(.+)/, `<li>$1</li>`).trimStart();
                    }

                    bodyContent.innerHTML += `<p>${line}</p>`;
                }
            }
        }
    }
}