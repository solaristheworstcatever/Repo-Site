let bigKarmaRing = document.getElementById("big-ring");
    let karmaBlur = document.getElementById("blur");
    let headerButtons = document.getElementsByClassName("header-button");
    let panels = document.getElementsByClassName("panel");
    if (bigKarmaRing && karmaBlur && headerButtons && panels) {
        for (let i = 0; i < headerButtons.length; i++) {
            let button = headerButtons[i];
            let panel = panels[i];
            button.parentElement.addEventListener('mouseover', () => {
                if (window.innerWidth < 890) {
                    bigKarmaRing.style.scale = 1.15;
                }
                else {
                    bigKarmaRing.style.scale = 1.6;
                }
                bigKarmaRing.style.opacity = 0.4;
                karmaBlur.style.scale = 1.2;
                karmaBlur.style.opacity = 0.7;

                panel.style.display = "inline";
                panel.style.maxHeight = panel.scrollHeight + "px";
            })
            panel.parentElement.addEventListener('mouseleave', () => {
                bigKarmaRing.style.scale = 1;
                bigKarmaRing.style.opacity = 1;
                karmaBlur.style.scale = 1;
                karmaBlur.style.opacity = 0.5;

                panel.style.display = "none";
                panel.style.maxHeight = 0;
            });
        }
    }

    let passageEnd = document.getElementsByClassName("passage-end")[0];
    let passageLine = document.getElementsByClassName("passage-line")[0];
    let karmaLadder = document.getElementsByClassName("karma-ladder")[0];
    if (passageLine && passageLine && karmaLadder) {
        // Calculate the distance between the two elements
        function resizeLine() {
            function getPositionAtCenter(element) {
                const {top, left, width, height} = element.getBoundingClientRect();
                return {
                    x: left,
                    y: top + height / 2
                };
            }
            function getDistanceBetweenElements(a, b) {
                const aPosition = getPositionAtCenter(a);
                const bPosition = getPositionAtCenter(b);

                return Math.hypot(aPosition.x - bPosition.x, aPosition.y - bPosition.y);
            }

            passageLine.style.width = (getDistanceBetweenElements(passageEnd, karmaLadder) + 3) + "px";
        }

        resizeLine();
        window.addEventListener('resize', resizeLine);
    }