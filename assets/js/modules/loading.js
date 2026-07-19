const wait = async function(callBack) {
    await setTimeout(callBack, 0);
};

const load = (function() {
    let loadingScreen, progressBarContainer, progressBar, progressText, loadText;

    return { 
        async create(text) {
            this.loadText = text;
            this.loadingScreen = document.body.insertBefore(document.createElement("div"), document.body.firstChild);
            this.loadingScreen.id = "loading-screen";

            this.progressBarContainer = document.createElement("div");
            this.progressBarContainer.classList.add("loading-progress");
            this.loadingScreen.appendChild(this.progressBarContainer);

            this.progressBar = document.createElement("div");
            this.progressBar.classList.add("loading-progress-bar");
            this.progressBarContainer.appendChild(this.progressBar);

            this.progressText = document.createElement("p");
            this.progressText.textContent = `0 / ? ${text}`;
            this.progressBarContainer.appendChild(this.progressText);
        },

        async destroy() {
            if (this.loadingScreen) {
                this.loadingScreen.style.opacity = 0;
                let instance = this;
                this.loadingScreen.addEventListener('transitionend', function() {
                    document.body.removeChild(instance.loadingScreen);
                    instance.loadingScreen = null;
                });
            }
        },

        async progress(array, loadCondition, callBack = null) {
            if (!this.loadingScreen) {
                await this.create();
            }
    
            let instance = this;
            await wait(async function() {
                let progress = 0;
                if (array && array.length > 0) {
                    let res = await Promise.all(array.map(function(elm){
                        return new Promise(async function(resolve, reject){
                            await loadCondition(elm);
                            progress++;
                            instance.progressBar.style.width = `${(progress / array.length) * 100}%`
                            instance.progressText.textContent = `${progress} / ${array.length} ${instance.loadText}`;
                            resolve(elm);
                        })
                    }))
                    .catch((err) => console.error(err));

                    if (res) {
                        instance.destroy();
                    }
                }
                else {
                    instance.destroy();
                }

                if (callBack) {
                    callBack();
                }
            });
        }
    }
});

export default load;