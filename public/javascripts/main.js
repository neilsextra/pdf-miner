/**
 * Knowledge Mining Demonstration
 * 
 * Developed by 
 *  Dr Neil Brittliff 19/1/2019
 * 
 */
let entries = {};
let MINIMUM_SCORE = 0.01;
let SVG_NS = "http://www.w3.org/2000/svg";

let pdfDocument = null;
let textMap = {}

$(document).ready(function () {
    $('#tab').css('display', 'none');
});

$('#search').on('click', function (e) {

    hideDetail();

    $('#waitDialog').css('display', 'inline-block');

    setTimeout(function () {

        getResults($('#criteria').val());


    }, 1000);

    return false;

});

/**
 * Capitialize Each word in a String
 * 
 * @param {*} str the String to capitalize
 */
function capitalizeEachWord(str) {
    return str.toLowerCase().replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

/**
 * Show the selected Entry 
 * @param {string} filename the name of the file 
 * @param {string} metadata the Metadata
 */
function showEntry(filename, metadata) {
    $('#people').css('display', 'none');
    $('#tab').css('display', 'none');

    $('#people').html("");

    $('#waitDialog').css('display', 'inline-block');

    // Get all elements with class="tabcontent" and hide them
    var thumbnails = document.getElementsByClassName("thumbnail");

    for (iThumbnail = 0; iThumbnail < thumbnails.length; iThumbnail++) {
        thumbnails[iThumbnail].style.backgroundColor = "rgba(0,0,0, 0.0)";
    }

    $(`#thumbnail-${metadata}`).css('background-color', 'grey')

    generateDetails(metadata);

    $.ajax({
        url: `/get?filename=${encodeURIComponent(filename)}`,
        xhrFields: {
            responseType: 'blob'
        },
        success: function (blob) {
            var reader = new FileReader();

            reader.onload = function () {
                pdfDocument = reader.result;

                convert(reader.result);
            }

            reader.readAsArrayBuffer(blob);

        },
        error: function () {
            console.log('error');
        }
    });

}

/**
 * Find the Entries
 * @param {string} filename the name of the file 
 */
function findEntries(criteria) {
    var locators = document.getElementById('locators');

    while (locators.firstChild) {
        locators.removeChild(locators.firstChild);
    }

    for (let text in textMap) {
        var value = textMap[text].replaceAll(" ", "").toLowerCase();
        var select = criteria.replaceAll(" ", "").toLowerCase();

        if (value.indexOf(select) != -1) {
            var entry = document.createElement('div');
            entry.style.cssText = `position: absolute; font-size:24px; left:8px; width:32px; height:32px; top:${text-24}px; color:black;`;
            entry.innerHTML = "&#11208;";
            locators.appendChild(entry);

            var underline = document.createElement('div');
            underline.style.cssText = `position: absolute; font-size:24px; left:10px; right:0px; height:32px; top:${text-22}px; ` +
                                      `background-color:rgba(255,255,0,0.1);`;
            locators.appendChild(underline);

            var label = document.createElement('div');
            label.style.cssText = `position: absolute; font-size:16px; right:0px; width:474px; height:32px; top:${text-32}px; color:black; ` +
                                  `background-color:rgba(255,255,255,0.8); overflow: hidden; text-overflow: ellipsis; margin:10px; ` + 
                                  `vertical-align: bottom;`;
            label.innerHTML = `&nbsp;${capitalizeEachWord(criteria)}`;                       
            locators.appendChild(label);

        }

    } 

}

/**
 *  Generate the Details 
 */

function generateDetails(metadata) {
    var people = entries[metadata].people;
    var organizations = entries[metadata].organizations;
    var locations = entries[metadata].locations;

    inactivateTabs();

    populateView(people, "#people");
    populateView(organizations, "#organizations");
    populateView(locations, "#locations");

}

/**
 * Popualte the various views against the result
 * 
 * @param {*} entries 
 * @param {*} view 
 */
function populateView(entries, view) {
    var bFirst = true;
    var iEntry = 0;
    var html = "";

    nextEntry: for (var entry in entries) {

        if ((entries[entry].split(" ").length - 1) == 0) {
            continue nextEntry;
        }

        if (bFirst) {
            html += `<table>`;
            html += `<tr>`;

            bFirst = false;
        }

        html += `<td><a onclick="findEntries('${entries[entry]}');" style="text-decoration: underline; cursor: pointer;">${capitalizeEachWord(entries[entry])}</a></td>`;

        if (iEntry == 2) {
            html += '</tr><tr>';
            iEntry = 0;
        } else {
            iEntry += 1
        }

    }

    if (!bFirst) {
        html += '</tr></table>';
    }

    $(view).html(html);

}

/**
 * Display the PDF content
 * @param {*} pdfContent 
 */
async function convert(pdfContent) {
    var self = this;
    var complete = 0;
    var structure = $('#structure')[0];

    while (structure.firstChild) {
        structure.removeChild(structure.firstChild);
    }

    var status = await renderPage(pdfContent, 2.0, (canvas, textLayer, viewport) => {

        $('#tab').css('display', 'inline-block');

        $('#peopleFrame').css('display', 'inline-block');

        $('#people').css('display', 'inline-block');
        $('#tab1').css('text-decoration', 'underline');
        $('#tab1').addClass('active');

        textLayer.id = 'text-layer';
        textLayer.style.cssText = `position:absolute; left:10px; top:10px; height:${viewport.height}px; width:${viewport.height}px`;

        var locators = document.createElement('div');

        locators.id = 'locators';
        locators.style.cssText = `position:absolute; left:0px; top:10px; height:${viewport.height}px; width:${viewport.height}px; background-color:rgba(0,0,0,0.0)`;

        structure.appendChild(canvas);
        structure.appendChild(locators);
        structure.appendChild(textLayer);
 
        window.setTimeout(() => {
            $('#waitDialog').css('display', 'none');
        }, 100);

    });

}

/**
 * Generate the PDFs 
 * @param {*} content the PDF Content 

 */
async function renderPage(content, scale, callback) {

    return new Promise((accept, reject) => {
        var loadingTask = pdfjsLib.getDocument({ data: content });

        loadingTask.promise.then(function (pdf) {

            pdf.getPage(1).then(function (page) {

                function createCanvas(scale) {
                    var viewport = page.getViewport({ scale: scale });

                    // Prepare canvas using PDF page dimensions.
                    var canvas = document.createElement('canvas');
                    var context = canvas.getContext('2d');

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    // Render PDF page into canvas context.
                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };

                    page.render(renderContext);

                    page.getTextContent().then(function (textContent) {

                        function buildSVG(viewport, textContent) {
                            // Building SVG with size of the viewport (for simplicity)
                            textMap = {};

                            var svg = document.createElementNS(SVG_NS, "svg:svg");
                            svg.setAttribute("width", viewport.width + "px");
                            svg.setAttribute("height", viewport.height + "px");
                            // items are transformed to have 1px font size
                            svg.setAttribute("font-size", 1);

                            // processing all items
                            textContent.items.forEach(function (textItem) {
                                // we have to take in account viewport transform, which includes scale,
                                // rotation and Y-axis flip, and not forgetting to flip text.
                                var tx = pdfjsLib.Util.transform(
                                    pdfjsLib.Util.transform(viewport.transform, textItem.transform),
                                    [1, 0, 0, -1, 0, 0]
                                );

                                var style = textContent.styles[textItem.fontName];

                                // adding text element
                                var text = document.createElementNS(SVG_NS, "svg:text");

                                text.setAttribute("transform", "matrix(" + tx.join(" ") + ")");
                                text.setAttribute("font-family", `${style.fontFamily}`);
                                text.setAttribute("fill", 'white');
                                text.setAttribute("fill-opacity", '0.0');
                                text.textContent = textItem.str;

                                if (textMap.hasOwnProperty(tx[5])) {
                                    textMap[tx[5]] += textItem.str;
                                } else {
                                    textMap[tx[5]] = textItem.str;
                               }

                                svg.appendChild(text);

                            });
                            return svg;

                        }

                        let svg = buildSVG(viewport, textContent);

                        callback(canvas, svg, viewport);
                        accept("OK");

                    });

                }

                createCanvas(scale);

            });

        });

    });

}

/**
 * Inactivate the Tabs
 */
function inactivateTabs() {
    var iTab, tabcontent, tabbuttons, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (iTab = 0; iTab < tabcontent.length; iTab++) {
        tabcontent[iTab].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (iTab = 0; iTab < tablinks.length; iTab++) {
        tablinks[iTab].className = tablinks[iTab].className.replace(" active", "");
        tablinks[iTab].style.textDecoration = "none";
    }

}

/**
* Show the Active Tab
* 
* @param {*} evt the Tab to Show
* @param {*} tab the name of the Tab
* @param {*} button the Tab's button
* @api private
* 
*/
function showTab(evt, tab, button) {

    inactivateTabs();

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tab).style.display = "block";
    document.getElementById(button).style.textDecoration = "underline";

    evt.currentTarget.className += " active";

}

/**
 * Hide Detail View
 * 
 */
function hideDetail() {
    $('#peopleFrame').css('display', 'none');
    $('#organizationFrame').css('display', 'none');
    $('#locationFrame').css('display', 'none');

    $('#tab').css('display', 'none');
}

/**
 * 
 * Retrieves the Search Entries
 * 
 * @param {string} criteria the Search Criteria
 * 
 */
function getResults(criteria) {

    hideDetail();

    var structure = $('#structure')[0];

    while (structure.firstChild) {
        structure.removeChild(structure.firstChild);
    }

    var parameters = { criteria: criteria };

    $.get('/search', parameters, function (data) {
        entries = JSON.parse(data).value;

        var html = "";

        nextEntry: for (entry in entries) {
            console.log(`Score: ${entries[entry]['@search.score']}`);

            if (entries[entry]['@search.score'] < MINIMUM_SCORE) {
                continue nextEntry;
            }

            var javascript = `showEntry('${entries[entry].metadata_storage_name}', '${entry}')`;
            var title = entries[entry].metadata_storage_name.replaceAll('_', ' ').replace('.pdf', '');

            html += `<div class='thumbnail' id='thumbnail-${entry}' style='position:relative;' onclick="${javascript}">` +
                `<a href="javascript:${javascript}">` +
                `<img src='/icons/pdf.svg' style='position:absolute; top:10px; width:42px; height:42px; margin:auto;'/>` +
                `<label style="position:absolute; top:60px; left:10px; white-space: wrap; overflow: hidden; text-overflow: ellipsis; color:white; width:100px; font-size:12px; height:500px;"` +
                ` title="${title}">${title}</label>` +
                `</a>` +
                "<div class='play'>" +
                " <img src='/icons/expand-button.svg' style='width:64; height:64px;'/></div>" +
                `</div>`;

        }

        $('#thumbnails').html(html);
        $('#waitDialog').css('display', 'none');

    });

}