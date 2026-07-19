import JSZip from "./jszip.js";
import JSZipUtils from "./jszip-utils.js";
import html from "./html-elements.js";
import load from "./loading.js";

let defaultJSONUrl = `Dist/PackInfo.json`;
async function fetchJSON(jsonURL) {
    try {
      const response = await fetch(jsonURL, {
        headers: {
          'Accept': 'application/vnd.github.v3+json' // Specify API version
        }
      });
  
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data; // This will be an array of objects representing files and directories
    } catch (error) {
      console.error('Error fetching GitHub directory:', error);
      return null;
    }
}

async function fetchText(textUrl) {
  let promise = (await fetch(textUrl)).text();
  return promise;
}

async function loadZip(zipUrl) {
  let promise = await new JSZip.external.Promise(function (resolve, reject) {
    JSZipUtils.getBinaryContent(zipUrl, function(err, data) {
        if (err) {
            reject(err);
        } else {
            resolve(data);
        }
    });
  })
  promise = await JSZip.loadAsync(promise);
  return promise;
}

async function parseInit(init, assetType, parseAll) {
  if (init) {
    let initLines = init.split("\n");
    if (initLines) {
      let index = 0;
      let initObj = {};
      let header = null;
      for (let line of initLines) {
        if (line) {
          if (line[0] == "-") // Category
          {
            header = line.match(/(?<=\")([^\"]+)/);
            header = header ? header[0].trim() : line.substring(1);
            initObj[header] = {};
            initObj[header]._line = line;
            initObj[header]._categoryColor = {
              r: 255,
              g: 0,
              b: 0
            };

            let categoryColors = line.match(/(?<=\()([^)])+/);
            if (categoryColors) {
              categoryColors = categoryColors[0].split(",");
              if (categoryColors.length == 3) {
                initObj[header]._categoryColor.r = Number.parseInt(categoryColors[0].trim());
                initObj[header]._categoryColor.g = Number.parseInt(categoryColors[1].trim());
                initObj[header]._categoryColor.b = Number.parseInt(categoryColors[2].trim());
              }
            }
          }
          else if (header) {
            let name = line.match(/(?<=nm:\")([^\"]+)/);
            if (name) {
              name = name[0].trim();
              let asset = {};
              asset._line = line;

              if (parseAll) {
                // Parse line info here
                asset.tile = assetType == "Graphics.zip";
                asset.prop = assetType == "Props.zip";
                asset.effect = assetType == "Effects.zip";
                let tp = line.match(/(?<=tp:\")([^"])+/);
                if (tp) {
                  asset.tp = tp[0].trim();
                }
                asset.standardTp = asset.tp && (asset.tp.includes("standard") || asset.tp.includes("Standard"));
                asset.softTp = asset.tp && (asset.tp.includes("soft") || asset.tp.includes("Soft"));
                asset.decal = asset.tp && asset.tp.includes("Decal");

                asset.variations = false;
                
                let sz;
                if (asset.tile || asset.standardTp) {
                  sz = line.match(/(?<=sz:point\()([^)])+/);
                }
                else {
                  sz = line.match(/(?<=pxlSize:point\()([^)])+/);
                }
                if (sz) {
                  sz = sz[0].split(",");
                  asset.sz = {
                    x: Number.parseInt(sz[0].trim()),
                    y: Number.parseInt(sz[1].trim())
                  }
                }

                let repeatL = line.match(/(?<=repeatL:\[)([^\]])+/);
                if (repeatL) {
                  let repeats = repeatL[0].split(",");
                  asset.repeatL = [];
                  for (let i = 0; i < repeats.length; i++) {
                    asset.repeatL[i] = Number.parseInt(repeats[i].trim());
                  }
                }

                let bf = line.match(/(?<=bfTiles:)([^,])+/);
                if (bf) {
                  asset.bf = Number.parseInt(bf[0].trim());
                }

                asset.colorAorB = line.match("effectColorA") || line.match("effectColorB");
                
                let colorize = line.match(/(?<=colorize:)([^,])+/);
                if (colorize) {
                  asset.colorize = Number.parseInt(colorize[0].trim()) == 1 && !asset.colorAorB;
                }

                let bevel = line.match(/(?<=bevel:)([^,])+/);
                if (bevel) {
                  asset.bevel = Number.parseInt(bevel[0].trim());
                }

                let colorTreatment = line.match(/(?<=colorTreatment:\")([^"])+/);
                if (colorTreatment) {
                  asset.colorTreatment = colorTreatment[0].trim();
                }
                
                let vars;
                if (asset.tile) {
                  vars = line.match(/(?<=rnd:)([^,])+/)
                }
                else {
                  vars = line.match(/(?<=vars:)([^,])+/);
                }
                if (vars) {
                  asset.vars = Number.parseInt(vars[0].trim());
                  if (asset.vars > 1) {
                    asset.variations = true;
                  }
              }
              }
              
              initObj[header][name] = asset;
              index++;
            }
          }
        }
      }
      return initObj;
    }
  }
  return null;
}

async function fetchAuthor(init, name) {
  if (init) {
    let categories = Object.keys(init);
    for (let category of categories) {
      let initLines = Object.keys(init[category]);
      if (initLines) {
        for (let line of initLines) {
          if (line.match(name)) {
            return category;
          }
        }
      }
    }
  }
  return null;
}
  
async function tryFetch(url) {
    let r = await fetch(url)
    return r.ok;
}

let zip = new JSZip();
let downloadBody = {};
let assetDownloaderContainer, assetDownloadBody;

async function generateAndDownloadZip(zipFolder, zipName) {
  await zipFolder.generateAsync({type:"blob"})
  .then(function (blob) {
      var pom = document.createElement('a');
      pom.href = URL.createObjectURL(blob);
      pom.download = zipName;

      if (document.createEvent) {
          var event = document.createEvent('MouseEvents');
          event.initEvent('click', true, true);
          pom.dispatchEvent(event);
      }
      else {
          pom.click();
      }
    }); 
}
// Download UI for the right side of the screen
function downloaderElement() {
  assetDownloaderContainer = document.body.appendChild(document.createElement("div"));
  assetDownloaderContainer.classList.add("download-container");
  assetDownloaderContainer.style.opacity = 0;

  assetDownloadBody = assetDownloaderContainer.appendChild(document.createElement("div"));
  assetDownloadBody.classList.add("container");

  let assetDownloadButton = assetDownloaderContainer.appendChild(document.createElement("button"));
  assetDownloadButton.textContent = "Download";
  assetDownloadButton.addEventListener('click', async function() {
    // Download all of our elements
    let zipFolder = zip.folder("Test");
    let text = "";
    for (let key of Object.keys(downloadBody)) {
      text += `${key}\n`;
      for (let line of Object.keys(downloadBody[key])) {
        text += `${line}\n`;

        // Write image to zip
        let imgBlob = await downloadBody[key][line];
        let name = line.match(/(?<=nm:\")([^\"]+)/);
        await zipFolder.file(`${name[0]}.png`, imgBlob);
      }
      text += `\n`;
    }
    await zipFolder.file("Copy_to_init.txt", text);
    await generateAndDownloadZip(zipFolder, `${document.getElementsByClassName("title")[0].textContent} ${new Date().toISOString().slice(0, 10)}.zip`);
    

    let assetDownloadCollapse = assetDownloaderContainer.appendChild(document.createElement("img"));
    assetDownloadCollapse.classList.add("collapse-button");
    assetDownloadCollapse.src = "assets/media/img/icons/triangle.svg";
    assetDownloadCollapse.addEventListener('click', function(){
      assetDownloaderContainer.classList.toggle("active");
    });
  });
}


let searchValue;
let searchChecked;
let searchParameters = {};
function checkForVisibility(assetLine, categoryName) {
  if (assetLine && assetLine.getElementsByClassName) {
    let assetName = assetLine.getElementsByClassName("asset-name");
    if (assetName) {
      assetName = assetName[0].textContent;
      if (assetName) {
        assetLine.style.display = !searchChecked || (!searchValue || assetName.toLocaleLowerCase().match(searchValue.toLocaleLowerCase())) ? "flex" : "none";
      }
    }
  }
}

let assetSelectorContainer, assetSelector, zipInfoThumbnail, zipInfoTitle, zipInfo, missingImages, showSearchContainer, showSearchResults, searchLabel;
// Asset selector UI
function assetSelectorElement() {
  assetSelectorContainer = document.body.appendChild(document.createElement("div"));
  assetSelectorContainer.classList.add("asset-selector-container");

  let assetSelectorInnerContainer = assetSelectorContainer.appendChild(document.createElement("div"));
  assetSelectorInnerContainer.classList.add("container");

  let xSymbol = assetSelectorInnerContainer.appendChild(document.createElement("img"));
  xSymbol.classList.add("x-button");
  xSymbol.src = "assets/media/img/icons/karma-10.svg";
  xSymbol.addEventListener('click', function(){
    assetSelectorContainer.style.display = "none";
  });

  assetSelector = assetSelectorInnerContainer.appendChild(document.createElement("div"));
  assetSelector.classList.add("asset-selector");
  
  let zipInformationBlurb = assetSelectorInnerContainer.appendChild(document.createElement("div"));
  zipInformationBlurb.classList.add("asset-blurb");
  
  zipInfoThumbnail = zipInformationBlurb.appendChild(document.createElement("img"));
  zipInfoThumbnail.src ="assets/media/img/default.webp";
  
  zipInfoTitle = zipInformationBlurb.appendChild(document.createElement("h2"));
  zipInfoTitle.textContent = "No Info Found";
  
  zipInfo = zipInformationBlurb.appendChild(document.createElement("p"));
  zipInfo.textContent = "N/A";
  
  missingImages = zipInformationBlurb.appendChild(document.createElement("p"));
  missingImages.classList.add("missing");

  showSearchContainer = zipInformationBlurb.appendChild(document.createElement("div"));
  showSearchContainer.classList.add("search-container");

  showSearchResults = showSearchContainer.appendChild(document.createElement("input"));
  showSearchResults.name = "showResults";
  showSearchResults.type = "checkbox";
  showSearchResults.addEventListener('click', function() {
    searchChecked = showSearchResults.checked;
    let validSearch = searchValue && searchValue != "";
    if (validSearch && searchParameters[zipInfoTitle.textContent]) {
      let assetLines = assetSelector.getElementsByClassName("asset-line");
      for (let line of assetLines) {
        checkForVisibility(line, zipInfoTitle.textContent);
      }
    }
  });

  searchLabel = showSearchContainer.appendChild(document.createElement("label"));
  searchLabel.textContent = "Show Only Search Results";
  searchLabel.for = showSearchResults.name;
}   

async function createAsset(categoryName, categoryLine, name, asset, author, categoryColor, files) {
  let assetChild = document.createElement("div");
  assetChild.classList.add("asset-line");
  assetChild.addEventListener('click', function() {
    let categoryContainer = document.getElementById(categoryName);
    if (!categoryContainer) {
      categoryContainer = assetDownloadBody.appendChild(document.createElement("div"));
      categoryContainer.id = categoryName;
      categoryContainer.classList.add("download-category");
      categoryContainer.textContent = categoryName;
    }
    let category = downloadBody[categoryLine];
    if (!category) category = {};

    let line = asset._line;
    if (!category[line]) {
      category[line] = files[`${name}.png`].async("blob");
      let downloadElement = categoryContainer.appendChild(document.createElement("p"));
      downloadElement.textContent = name;
      downloadElement.addEventListener('click', function() {
        // Remove element from download
        downloadBody[categoryLine] = null;
        categoryContainer.removeChild(downloadElement);
        if (categoryContainer.childElementCount == 0) {
          assetDownloadBody.removeChild(categoryContainer);
        }
        if (assetDownloadBody.childElementCount == 0) {
          assetDownloaderContainer.style.opacity = 0;
          if (assetDownloaderContainer.classList.contains("active")) {
            assetDownloaderContainer.classList.remove("active");
          }
        }
      });

      assetDownloaderContainer.style.opacity = 1;
      if (!assetDownloaderContainer.classList.contains("active")) {
        assetDownloaderContainer.classList.add("active");
      }
    }
    downloadBody[categoryLine] = category;
    
  });
  assetSelector.appendChild(assetChild);

    // Parse image information
  if (asset.tile || (asset.prop && (asset.standardTp || asset.softTp || asset.decal))) {
    // Create preview images for tiles and props
    
    if (asset.sz || asset.softTp || asset.decal) {

      let assetImgCanvas = document.createElement("canvas");
      let assetImg = new Image();
      files[`${name}.png`].async("blob").then((blob) => {
        assetImg.src = URL.createObjectURL(blob);
        assetImg.onload = () => {
          // Get the orig image data
          let mult = asset.tile || asset.standardTp ? 20 : 1;
          let width = asset.sz ? (asset.sz.x * mult) + (asset.bf ? asset.bf * (mult * 2) : 0) : assetImg.width;
          let height = asset.sz ? (asset.sz.y * mult) + (asset.bf ? asset.bf * (mult * 2) : 0) : assetImg.height;
          let previewHeight = asset.prop ? 0 : asset.sz.y * 16;
          assetImgCanvas.width = width;
          assetImgCanvas.height = assetImg.height - previewHeight - 1;

          let imageHeight = assetImgCanvas.height; // The height to reference when drawing

          if (asset.colorize && imageHeight < height * 2) {
            asset.colorize = false;
          }

          let assetCtx = assetImgCanvas.getContext("2d", { willReadFrequently: true });
          let frameData = [];
          for (let i = 0; i < (asset.vars ? asset.vars : 1); i++) {
            assetCtx.drawImage(assetImg, (width * i) * -1, -1);
            frameData[i] = assetCtx.getImageData(0, 0, width, assetImgCanvas.height).data;
          }

          // Create the preview
          assetCtx.clearRect(0, 0, assetImgCanvas.width, assetImgCanvas.height);
          assetImgCanvas.width = width;
          assetImgCanvas.height = height;
          let pixels = (() => {
            return {
              getData(data, i) {
                return {
                  r: data[i],
                  g: data[i + 1],
                  b: data[i + 2],
                  a: data[i + 3]
                }
              },
              setData(pixelData, data, i) {
                data[i] = pixelData.r;
                data[i + 1] = pixelData.g;
                data[i + 2] = pixelData.b;
                data[i + 3] = pixelData.a;
              },
              isEqualTo255(pixelData, r, g, b) {
                r = (r && pixelData.r >= 200) || (!r && pixelData.r <= 50);
                g = (g && pixelData.g >= 200) || (!g && pixelData.g <= 50);
                b = (b && pixelData.b >= 200) || (!b && pixelData.b <= 50);
                return r && g && b;
              }
            };
          })();
          
          function lerp(x, y, a) {
            return x * (1 - a) + y * a;
          }

          function applyCategoryColor(pixelData) {
            let diff = 50;
            if (pixels.isEqualTo255(pixelData, true, false, false)) { // Red
              pixelData.r = categoryColor.r - diff;
              pixelData.g = categoryColor.g - diff;
              pixelData.b = categoryColor.b - diff;
            }
            else if (pixels.isEqualTo255(pixelData, false, true, false)) { // Green
              pixelData.r = categoryColor.r;
              pixelData.g = categoryColor.g;
              pixelData.b = categoryColor.b;
            }
            else if (pixels.isEqualTo255(pixelData, false, false, true)) { // Blue
              pixelData.r = categoryColor.r + diff;
              pixelData.g = categoryColor.g + diff;
              pixelData.b = categoryColor.b + diff;
            }
          }

          function applySoftCategoryColor(pixelData, toColorData) {
            let diff = 50;
            if (!toColorData) {
              toColorData = categoryColor;
            }
            let l = (1 - (pixelData.g / 255)) + (pixelData.r / 255);
            pixelData.r = lerp(toColorData.r + diff, toColorData.r - diff, l);
            pixelData.g = lerp(toColorData.g + diff, toColorData.g - diff, l);
            pixelData.b = lerp(toColorData.b + diff, toColorData.b - diff, l);
          }

          // For each sz.y * 20 used in repeatL 
          let layers = 1;
          let repeatLayers = 0; // The total amount of layers the repeatL takes up
          
          if (asset.repeatL) {
            layers = asset.repeatL.length;

            for (let i = 0; i < asset.repeatL.length; i++) {
              repeatLayers += asset.repeatL[i];
            }
          }

          // Any additional pixels at the bottom of the image
          let offset = 0;
          if (asset.tile) {
            while (imageHeight - (height * layers) - offset > 0) {
              offset++;
            }
            if (offset < 0) {
              offset = 0;
            }
          }

          // For variant animations
          let frames = [];

          // Repeat this calculation for each variation, if it has any
          for (let v = 0; v < (asset.vars ? asset.vars : 1); v++) {
            // The data to write to for the final image
            let finalImg = new ImageData(width, height);
            let finalData = finalImg.data;
            
            let currLayer = 0; // The current sublayer incremented per layer

            // Used to calculate the starting point of the tile from the bottom left above the tile preview
            for (let layer = 0; layer < layers; layer++) {
              let h = imageHeight - offset - (height * (layer + 1));
              if (asset.softTp || asset.decal || asset.bevel || (!asset.tile && h < 0) || (asset.tile && h < 0 && layer == 0)) h = 0;
              if (h < 0) continue;
              // The top left index of the first pixel in the layer
              let layerIndex = h * width;
              for (let i = 0; i < height * width; i++) {
                let lIndex = (layerIndex + i);
                let imgPixel = pixels.getData(frameData[v], lIndex * 4);

                if(!pixels.isEqualTo255(imgPixel, true, true, true) 
                  && ((asset.colorTreatment && asset.colorTreatment.includes("bevel")) 
                  || asset.bevel 
                  || !pixels.isEqualTo255(imgPixel, false, false, false))) {

                  if (asset.colorize) {
                    // Paint the color from below onto the image
                    let colPixel = pixels.getData(frameData[v], (((imageHeight / 2) * width) + i) * 4);
                    if (colPixel.a < 255) {
                      asset.colorize = false;
                    }
                    else {
                      applySoftCategoryColor(imgPixel, colPixel);
                    }
                  }

                  if (!asset.decal && !asset.colorize) {
                    if (!asset.softTp && !asset.bevel) {
                      applyCategoryColor(imgPixel);
                      if (layer != layers - 1 && asset.repeatL) {
                        let l = (repeatLayers - currLayer) / 30;
                        imgPixel.r = lerp(imgPixel.r, 0, l);
                        imgPixel.g = lerp(imgPixel.g, 0, l);
                        imgPixel.b = lerp(imgPixel.b, 0, l);
                      }
                    }
                    else {
                      applySoftCategoryColor(imgPixel, null);
                    }
                  }
                  
                  pixels.setData(imgPixel, finalData, i * 4);
                }
              }
              if (asset.repeatL) {
                currLayer += asset.repeatL[layer];
              }
              assetCtx.putImageData(finalImg, 0, 0);
            }
            if (asset.vars && asset.vars > 1) {
              frames[v] = finalImg;
            }
          }

          if (frames && frames.length > 1) {
            let frame = 0;
            let loopFrames = 50;
            let v = 0;
            function animate() {
              window.requestAnimationFrame(animate);
              frame++;
              if (frame >= loopFrames) {
                frame = 0;
                if (v >= asset.vars) v = 0;
                else v++;
                
                // then redraw here
                if (frames[v]) {
                  assetCtx.clearRect(0, 0, width, height);
                  assetCtx.putImageData(frames[v], 0, 0);
                }
              }
            }
            animate();
          }
        };
      });
      assetChild.appendChild(assetImgCanvas);
      
    }
  }
  else {
    let defaultAsset = assetChild.appendChild(document.createElement("img"));
    // Fetch image for effects
    if (asset.effect) {
      let imgUrl = `assets/media/img/lists/effects/previews/${name}.webp`;
      if (!await tryFetch(imgUrl)) {
        files[`${name}.png`].async("blob").then((blob) => {
          defaultAsset.src = URL.createObjectURL(blob);
        });
      }
      else {
        defaultAsset.src = imgUrl;
      }
    }
    
    // Fetch material preview for materials
    else {
      let imgURL = `https://raw.githubusercontent.com/Rainworld-Repository/The-Level-Editor-Warehouse/refs/heads/main/Misc/Material%20Previews/${name}.png`;
      let imgFetch = await fetch(imgURL);
      if (imgFetch.ok) {
        defaultAsset.src = URL.createObjectURL(await imgFetch.blob());
      }
      else {
        defaultAsset.src = "assets/media/img/default.webp";
        defaultAsset.classList.add("no-preview");
      }
    }
  }
    
  let assetNameContainer = document.createElement("div");
  assetNameContainer.classList.add("asset-name-container");
  assetChild.appendChild(assetNameContainer);
  
  let assetName = document.createElement("p");
  assetName.classList.add("asset-name");
  assetName.textContent = name;
  assetNameContainer.appendChild(assetName);

  let index = 0;
  let tags = [];
  // Add tags
  if (asset.variations) {
    tags[index++] = "varied";
  }
  if (asset.colorAorB) {
    tags[index++] = "effectColor";
  }
  if (asset.decal || asset.colorize) {
    tags[index++] = "bakedColor";
  }

  if (tags.length > 0 || author) {
    let assetTags = assetNameContainer.appendChild(document.createElement("p"));
    if (author && author.toLowerCase() != "to be discovered") {
      assetTags.innerHTML = `Created by ${author}${tags.length > 0 ? "<br>" : ""}`;
    }
    if (tags.length > 0) {
      for (let i = 0; i < tags.length; i++) {
        assetTags.innerHTML += tags[i] + (i < tags.length - 1 ? ", " : "");
      }
    }
  }

  return assetChild;
}

export async function loadAssets(grid, pack) {
  let json = await fetchJSON(defaultJSONUrl);
  if (json) {
      if (pack && json["Assets"]) {
          pack = `${pack}.zip`;
          let obj = json["Assets"][pack]
          if (obj) {
              let keys = Object.keys(obj);

              // Create the grid for the elements
              grid.classList.add("grid");

              downloaderElement();
              assetSelectorElement();

              let initComparator = grid.parentElement.insertBefore(document.createElement("div"), grid);
              initComparator.classList.add("init-comparator");
              initComparator.classList.add("container");

              let initCompTitle = initComparator.appendChild(document.createElement("h1"));
              initCompTitle.textContent = "Compare Inits";

              let initCompDesc = initComparator.appendChild(document.createElement("p"));
              initCompDesc.innerHTML = "Upload your local init and compare what assets were changed or added. Select the assets to be downloaded, which will come with a <code>copy_to_init.txt</code> file to integrate in your init manually.";

              let initCompLabel = initComparator.appendChild(document.createElement("label"));
              initCompLabel.classList.add("input");
              initCompLabel.textContent = "Upload Init.txt";
              initCompLabel.htmlFor = "initComparator";
              
              let initCompButton = initComparator.appendChild(document.createElement("input"));
              initCompButton.type = "file";
              initCompButton.id = "initComparator";
              initCompButton.accept = ".txt";
              initCompButton.multiple = false;

              let parentElem = grid.parentElement.insertBefore(document.createElement("div"), grid);
              parentElem.classList.add("asset-settings");

              let initSelector = await html.createSelectElement();
              parentElem.appendChild(initSelector.element);
              initSelector.element.id =  "init-selector";

              let searchBar = parentElem.appendChild(document.createElement("input"));
              searchBar.id = "search-bar";
              searchBar.placeholder = "Search for a pack or asset";
              searchBar.addEventListener('input', function() {
                searchValue = searchBar.value;
                let assetElems = document.getElementsByClassName("asset-container");
                if (assetElems && assetElems.length > 0) {
                  // Check if pack matches search or an element within it does
                  for (let elem of assetElems) {
                    if (elem) {
                      let matchChildren = 0;
                      let match = true;
                      let title = elem.getElementsByTagName("p")[0];
                      if (title) {
                        title = title.textContent;
                        
                        match = title.toLocaleLowerCase().match(searchValue.toLocaleLowerCase());
                        if (searchParameters[title] && searchParameters[title].length > 0) {
                          for (let v of searchParameters[title]) {
                            let localMatch = v.toLocaleLowerCase().match(searchValue.toLocaleLowerCase());
                            if (localMatch) {
                              match = true;
                              matchChildren++;
                            }
                          }
                        }
                      }
                      
                      elem.style.display = match ? "inline" : "none";

                      let matchElem = elem.getElementsByClassName("asset-match")[0];
                      matchElem.textContent = searchBar.value && searchBar.value != "" ? `${matchChildren} match${matchChildren == 1 ? "" : "es"} found` : "";
                      matchElem.style.display = searchBar.value && searchBar.value != "" && match ? "inline" : "none";
                    }
                  }
                }
              });

              // Asset loading bar
              let loadingAssets = grid.parentElement.insertBefore(document.createElement("div"), grid);
              loadingAssets.id = "loading-assets";
              
              let loadingBarContainer = loadingAssets.appendChild(document.createElement("div"));
              loadingBarContainer.classList.add("loading-progress");

              let loadingBar = loadingBarContainer.appendChild(document.createElement("div"));
              loadingBar.classList.add("loading-progress-bar");
              loadingBar.style.width = 0;

              let loadingText = loadingAssets.appendChild(document.createElement("p"));
              loadingText.textContent = "Loading Assets";

              // Load file from zip
              let zipFiles = await loadZip(`Dist/Assets/${pack}`);
              if (zipFiles && zipFiles["files"]) {
                let files = zipFiles["files"];
                // Find Inits
                let libraryInit;

                let initFiles = Object.keys(files).filter(v => v.match("Inits"));
                let initRegex = /(?<=\\)([^.])+/;
                for (let init of initFiles) {
                  let initName = init.match(initRegex);
                  if (initName) {
                    initName = initName[0].trim();
                    if (!initName.match(/\s/)) { // Ignore any non-init files
                      let option = initSelector.addOption(initName.replaceAll(/(([^a-z])([a-z]+))/g, `$1 `), init);

                      if ((pack == "Graphics.zip" && initName.match("Reorganized")) || initName == "Init") {
                        initSelector.setValue(option);
                      }
                      if (initName.match("Library")) {
                        libraryInit = await parseInit(await zipFiles.files[init].async("text"));
                      }
                      option.element.addEventListener('click', function(){
                        if (option.element.parentElement.style.display != "none") {
                          initSelector.setValue(option);
                        }
                      });
                    }
                  }
                }

                let firstInit = false;

                async function loadInit() {
                  // get rid of all of the children in the grid
                  grid.innerHTML = "";

                  grid.style.display = "none";
                  loadingAssets.style.display = "inline-block";
                  loadingAssets.style.opacity = 1;

                  let initFile = initSelector.element.value;
                  if (initFile) {
                    // Fetch init
                    let init = await parseInit(await files[initFile].async("text"), pack, true);
                    if (init) {

                      // Add init comparator logic
                      if (!firstInit) {
                        firstInit = true;
                        initCompButton.addEventListener('change', async function() {
                          if (this.files) {
                            let loadingScreen = load();
                            
                            let text = await this.files[0].text();
                            if (text) {
                              let compInit = await parseInit(text);
                              if (compInit) {
                                await loadingScreen.create("Compared Lines");
                                // Compress both inits to their asset lines
                                function compressInit(init) {
                                  let keys = Object.keys(init);
                                  let compression = {};
                                  for (let key of keys) {
                                    if (init[key]) {
                                      for (let line of Object.keys(init[key])) {
                                        compression[line] = init[key][line];
                                      }
                                    }
                                  }
                                  return compression;
                                }

                                let flatInit = compressInit(init);
                                let flatCompInit = compressInit(compInit);

                                let lineComps = Object.keys(flatCompInit);
                                let trimLine =  /\[(.+)\]/g;
                                let comparisons = {
                                  New: {
                                    _line: "-[\"New\", color(255, 0, 0)]",
                                    _categoryColor: {
                                      r: 255,
                                      g: 0,
                                      b: 0
                                    }
                                  },
                                  Modified: {
                                    _line: "-[\"Modified\", color(0, 255, 255)]",
                                    _categoryColor: {
                                      r: 0,
                                      g: 255,
                                      b: 255
                                    }
                                  }
                                };
                                await loadingScreen.progress(Object.keys(flatInit),
                                  async function(line) {
                                    if (!lineComps.find(x => x.toLocaleLowerCase().match(line.toLocaleLowerCase()))) {
                                      comparisons.New[line] = flatInit[line];
                                      return true;
                                    }
                                    else if (lineComps.find(function(x){
                                      // Find init name that matches any line
                                      if (x.toLocaleLowerCase() == line.toLocaleLowerCase()) {
                                        // Then compare lines
                                        var _line = flatInit[line]._line;
                                        var _lineComp = flatCompInit[x]._line;
                                        if (_line && _lineComp) {
                                          _line = _line.replace(trimLine, `$1`).replaceAll(/\s/g, "").toLocaleLowerCase().trim();
                                          _lineComp = _lineComp.replace(trimLine, `$1`).replaceAll(/\s/g, "").toLocaleLowerCase().trim();
                                          if (!_line.startsWith(_lineComp)) {
                                            return true;
                                          }
                                        }
                                      }
                                      return false;
                                    })) {
                                      comparisons.Modified[line] = flatInit[line];
                                      return true;
                                    }
                                    return false;
                                  },
                                async function() {
                                  if (Object.keys(comparisons.New).length > 2 || Object.keys(comparisons.Modified).length > 2) {
                                    assetSelector.innerHTML = ""; // Reset the asset selector lines
                                    zipInfoThumbnail.src = "assets/media/img/default.webp";
                                    zipInfoTitle.textContent = "Init Comparator";
                                    assetSelectorContainer.style.display = "flex";

                                    showSearchContainer.style.display = "none";
                                    assetSelector.innerHTML = ""; // Reset asset selections

                                    for (let i = 0; i < 2; i++) {
                                      let initValue = i == 0 ? comparisons.New : comparisons.Modified;
                                      let initLines = Object.keys(initValue);
                                      // let f = initLines.length - 1;
                                      // zipInfo.innerHTML = `${f} asset${f == 1 ? "" : "s"}`;

                                      // let totalVariations = 0;
                                      // let contributors = [];
                                      // let contribIndex = 0;
                                      for (let line of initLines) { // Parse each init line
                                        if (line[0] != "_") { // Ignore discarded properties
                                          let lineValue = initValue[line];
                                          if (zipFiles.files[`${line}.png`]) {
                                              
                                              let author = await fetchAuthor(libraryInit, line);
                                              // if (author && author.toLowerCase() != "to be discovered" && !contributors.find((v) => v == author)) {
                                              //   contributors[contribIndex++] = author;
                                              // }
                                              // if (lineValue.variations) {
                                              //   totalVariations++;
                                              // }
                                              let assetChild = await createAsset(i == 0 ? "New" : "Modified", initValue._line, line, lineValue, author, initValue._categoryColor, zipFiles.files);
                                              // checkForVisibility(assetChild, keyTitle);
                                            }
                                          else {
                                            missingImages.innerHTML += `${name}<br>`
                                          }
                                        }
                                      }
                                      // zipInfo.innerHTML += `<br>${totalVariations} asset${totalVariations == 1 ? "" : "s"} with variations`;
                                      // zipInfo.innerHTML += `<br>${contributors.length} total contributor${contributors.length == 1 ? "" : "s"}`;
                                    }
                                  }
                                });
                              }
                            }
                          }
                        });
                      }

                      let keys = Object.keys(init);

                      async function loadCategory(key) {
                          let keyTitle = key;
                          let imgUrl = `assets/media/img/lists/${pack.substring(0, pack.length - 4)}/${keyTitle}.webp`;
                          let zipUrl = `Dist/Assets/${pack}/${key}`;
                          searchParameters[keyTitle] = [];

                          if (init) {
                            if (init[keyTitle]) {
                              for (let line of Object.keys(init[keyTitle])) {
                                if (line) {
                                  // Adds individual assets into the search parameters
                                  searchParameters[keyTitle].push(line);
                                }
                              }
                            }
                          }

                          // Create each element for the packs
                          let zipContainer = grid.appendChild(document.createElement("div"));
                          zipContainer.classList.add("asset-container");
                          
                          let zipInnerContainer = zipContainer.appendChild(document.createElement("div"));
                          zipInnerContainer.classList.add("container");
                          
                          let zipImg = zipInnerContainer.appendChild(document.createElement("img"));
                          if (await tryFetch(imgUrl)) {
                            zipImg.src = imgUrl;
                          }
                          else {
                            zipImg.src = "assets/media/img/default.webp";
                          }

                          let zipTitle = zipInnerContainer.appendChild(document.createElement("p"));
                          zipTitle.textContent = keyTitle;

                          let zipMatch = zipInnerContainer.appendChild(document.createElement("p"));
                          zipMatch.classList.add("asset-match");
                          zipMatch.style.display = "none";
                          
                          let downloadAllButton = zipInnerContainer.appendChild(document.createElement("button"));
                          downloadAllButton.classList.add("download");
                          downloadAllButton.textContent = "Download Full";
                          downloadAllButton.addEventListener('click', async function() {
                            let zipCategory = zip.folder(key);
                            
                            // Grab init lines
                            let initCategory = init[key];
                            if (initCategory) {
                              let text = initCategory._line + "\n";
                              for (let line of Object.keys(initCategory)) {
                                if (initCategory[line] && line[0] != "_") { // Skip unused lines
                                  text += initCategory[line]._line + "\n";

                                  // Find image file
                                  let imageName = `${line}.png`;
                                  let imageBlob = await files[imageName].async("blob");
                                  if (imageBlob) {
                                    await zipCategory.file(imageName, imageBlob);
                                  }
                                }
                              }
                              await zipCategory.file("Copy_to_init.txt", text);
                              
                              await generateAndDownloadZip(zipCategory, key)
                            }
                          });
                          
                          let selectAssetButton = zipInnerContainer.appendChild(document.createElement("button"));
                          selectAssetButton.classList.add("download");
                          selectAssetButton.textContent = "Select Assets";
                          selectAssetButton.addEventListener('click', async function(){
                            assetSelector.innerHTML = ""; // Reset the asset selector lines
                            zipInfoThumbnail.src = zipImg.src;
                            zipInfoTitle.textContent = zipTitle.textContent;
                            assetSelectorContainer.style.display = "flex";

                            showSearchContainer.style.display = searchBar.value && searchBar.value != "" ? "flex" : "none";

                            assetSelector.innerHTML = ""; // Reset asset selections

                            if (init[key]) {
                              let initValue = init[key];
                              let initLines = Object.keys(initValue);
                              let f = initLines.length - 1;
                              zipInfo.innerHTML = `${f} asset${f == 1 ? "" : "s"}`;

                              let totalVariations = 0;
                              let contributors = [];
                              let contribIndex = 0;
                              for (let line of initLines) { // Parse each init line
                                if (line[0] != "_") { // Ignore discarded properties
                                  let lineValue = initValue[line];
                                  if (zipFiles.files[`${line}.png`]) {
                                      
                                      let author = await fetchAuthor(libraryInit, line);
                                      if (author && author.toLowerCase() != "to be discovered" && !contributors.find((v) => v == author)) {
                                        contributors[contribIndex++] = author;
                                      }
                                      if (lineValue.variations) {
                                        totalVariations++;
                                      }
                                      let assetChild = await createAsset(key, initValue._line, line, lineValue, author, initValue._categoryColor, zipFiles.files);
                                      checkForVisibility(assetChild, keyTitle);
                                    }
                                  else {
                                    missingImages.innerHTML += `${name}<br>`
                                  }
                                }
                              }
                              zipInfo.innerHTML += `<br>${totalVariations} asset${totalVariations == 1 ? "" : "s"} with variations`;
                              zipInfo.innerHTML += `<br>${contributors.length} total contributor${contributors.length == 1 ? "" : "s"}`;
                            }
                        });
                      }

                      for (let i = 0; i < keys.length; i++) {
                        let key = keys[i];

                        await loadCategory(key);
                        loadingText.textContent = `Loading Assets ${i + 1} / ${keys.length}`;
                        loadingBar.style.width = `${((i * 1)/(keys.length - 1)) * 100}%`
                      }

                      loadingAssets.addEventListener('transitionend', function(){
                        loadingAssets.style.display = "none";
                        grid.style.display = "flex";
                      });
                      loadingAssets.style.opacity = 0;
                    }
                  }
                }
                await loadInit();

                initSelector.element.addEventListener('change', async function() {
                  downloadBody = {};
                  assetDownloadBody.innerHTML = "";
                  assetDownloaderContainer.style.opacity = 0;
                  if (assetDownloaderContainer.classList.contains("active")) {
                    assetDownloaderContainer.classList.remove("active");
                  }
                  await loadInit();
                })
              }
            }
        }
      }
    }


import headers from "./headers-module.js";
/**
 * @param {HTMLElement} element
 * @param {string} levels
 */
export async function loadLevels(element, levels) {
  let json = await fetchJSON(defaultJSONUrl);
  if (json) {
    if (levels && json[levels]) {
      levels = json[levels];
      let sortedCats = ["Vanilla+DLC", "Templates", "Archived Level Editors", "Region Packs", "Region Expansions", "Modded Regions"]
        
      element.classList.add("levels");
      // Search bar
      let searchBar = element.appendChild(document.createElement("input"));
      searchBar.id = "search-bar";
      searchBar.placeholder = "Search for a region or file";
      // searchBar.addEventListener('input', function() {
      //   searchValue = searchBar.value;
      //   let assetElems = document.getElementsByClassName("asset-container");
      //   if (assetElems && assetElems.length > 0) {);

      for (let cat of sortedCats) {
          if (levels[cat]) {
            let categoryHeader = element.appendChild(document.createElement("h1"));
            categoryHeader.textContent = cat;
            headers.addHeader(categoryHeader);

            // Level loading bar
            let loadingAssets = element.appendChild(document.createElement("div"));
            loadingAssets.id = "loading-assets";
            
            let loadingBarContainer = loadingAssets.appendChild(document.createElement("div"));
            loadingBarContainer.classList.add("loading-progress");

            let loadingBar = loadingBarContainer.appendChild(document.createElement("div"));
            loadingBar.classList.add("loading-progress-bar");
            loadingBar.style.width = 0;

            let loadingText = loadingAssets.appendChild(document.createElement("p"));
            loadingText.textContent = "Loading Levels";

            let grid = element.appendChild(document.createElement("div"));
            grid.classList.add("grid");

            /**
             * @param {string} key
             */
            async function loadCategory(key) {
              let keyTitle = key;
              let imgUrl = `assets/media/img/lists/${cat.toLocaleLowerCase()}/${keyTitle}.webp`;
              let zipUrl = `Dist/Levels/${cat}/${key}`;
              searchParameters[keyTitle] = [];

              // Create each element for the packs
              let zipContainer = grid.appendChild(document.createElement("div"));
              zipContainer.classList.add("asset-container");
              
              let zipInnerContainer = zipContainer.appendChild(document.createElement("div"));
              zipInnerContainer.classList.add("container");
              
              let zipImg = zipInnerContainer.appendChild(document.createElement("img"));
              if (await tryFetch(imgUrl)) {
                zipImg.src = imgUrl;
              }
              else {
                zipImg.src = "assets/media/img/default.webp";
              }

              let zipTitle = zipInnerContainer.appendChild(document.createElement("p"));
              zipTitle.textContent = keyTitle;

              let zipMatch = zipInnerContainer.appendChild(document.createElement("p"));
              zipMatch.classList.add("asset-match");
              zipMatch.style.display = "none";
              
              let downloadAllButton = zipInnerContainer.appendChild(document.createElement("button"));
              downloadAllButton.classList.add("download");
              downloadAllButton.textContent = "Download Full";
              downloadAllButton.addEventListener('click', async function() {
                // let zipCategory = zip.folder(key);
                
                // // Grab init lines
                // let initCategory = init[key];
                // if (initCategory) {
                //   let text = initCategory._line + "\n";
                //   for (let line of Object.keys(initCategory)) {
                //     if (initCategory[line] && line[0] != "_") { // Skip unused lines
                //       text += initCategory[line]._line + "\n";

                //       // Find image file
                //       let imageName = `${line}.png`;
                //       let imageBlob = await files[imageName].async("blob");
                //       if (imageBlob) {
                //         await zipCategory.file(imageName, imageBlob);
                //       }
                //     }
                //   }
                //   await zipCategory.file("Copy_to_init.txt", text);
                  
                //   await generateAndDownloadZip(zipCategory, key)
                // }
              });
              
              let selectAssetButton = zipInnerContainer.appendChild(document.createElement("button"));
              selectAssetButton.classList.add("download");
              selectAssetButton.textContent = "Select Files";
            }

            let levelKeys = Object.keys(levels[cat]).sort();
            for (let i = 0; i < levelKeys.length; i++) {
              await loadCategory(levelKeys[i]);
              loadingText.textContent = `Loading Assets ${i + 1} / ${levelKeys.length}`;
              loadingBar.style.width = `${((i * 1)/(levelKeys.length - 1)) * 100}%`
            }

            loadingAssets.addEventListener('transitionend', function(){
              loadingAssets.style.display = "none";
              grid.style.display = "flex";
            });
            loadingAssets.style.opacity = 0;
          }
        }
      }
    }
}