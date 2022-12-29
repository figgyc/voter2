//// Voter.js by figgyc
"use strict"
//// Settings and data storage

// These are at the top so they work on the help page

const defaultSettings = {
    theme: "dark",
    tierset: "none",
    sortalgo: "merge",
    letter: true,
    wordcount: true,
    smartColors: true,
    handleDrag: false,
    customTierset: ""
}

const defaultSettingsJSON = JSON.stringify(defaultSettings)

const themes = [
    "light",
    "dark",
    "classic"
]

let themePicker = document.querySelector("select#theme")
const html = document.querySelector("html")

function activateTheme(newTheme) {
    try {
        themePicker.value = newTheme
    } catch {}
    for (let theme of themes) {
        const themeClass = "theme-" + theme
        if (theme == newTheme) {
            html.classList.add(themeClass)
        } else {
            html.classList.remove(themeClass)
        }
    }
}
try {
themePicker.addEventListener("change", e => {
    activateTheme(themePicker.value)
})
} catch {}
activateTheme(loadSetting("theme"))

function localStorageDefault(key, defaultValue) {
    let item = localStorage.getItem(key)
    if (item == null) item = defaultValue
    return item
}

function getSettings() {
    return JSON.parse(localStorageDefault("settings", defaultSettingsJSON))
}
function setSettings(settings) {
    return localStorage.setItem("settings", JSON.stringify(settings))
}

function saveSetting(name, value) {
    let settings = getSettings()
    settings[name] = value
    return setSettings(settings)
}
function loadSetting(name) {
    let settings = getSettings()
    return settings[name]
}

const tiersetSelect = document.querySelector("#tierset")
function showCustom() {
    const customTierset = document.querySelector("#customTiersetFlex")
    if (tiersetSelect.value == "custom") {
        customTierset.classList.remove("invisible")
    } else {
        customTierset.classList.add("invisible")
    }
}

document.querySelector("#tierset").addEventListener("change", showCustom)

for (let setting of Object.keys(defaultSettings)) {
    let settingInput = document.querySelector("#"+setting)
    let value = loadSetting(setting)
    if (settingInput.type == "checkbox") {
        settingInput.checked = value
    } else {
        settingInput.value = value
    }
    settingInput.addEventListener("change", e => {
        let value = settingInput.value
        if (settingInput.type == "checkbox") value = settingInput.checked
        saveSetting(setting, value)
    })
    if (setting == "customTierset") showCustom()
}

//// UI Helper functions

/** Realize - a simple DOM "template engine". By figgyc - free to use for any purpose.
 * @param {Node | RealizeTemplate | string} template a template
 * @returns {Node} (mostly Element, or Text, sometimes another Node) the constructed node
 * interface RealizeTemplate
 * {
 *  tag: string
 *  text: string
 *  id: string
 *  classes: string[]
 *  children: <Node | RealizeTemplate | string>[]
 * }
 */
function realize(template) {
    // We use Node here because Text is not an Element
    if (template instanceof Node) {
        return template
    } else if (typeof template === "string") {
        return document.createTextNode(template)
    } else { // template instanceof RealizeTemplate
        let element = document.createElement(template.tag)
        if (template.id != undefined) element.id = template.id
        element.textContent = template.text
        if (template.classes == undefined) template.classes = []
        for (const className of template.classes)
            element.classList.add(className)
        if (template.styles == undefined) template.styles = {}
        for (const styleName in template.styles)
            element.style[styleName] = template.styles[styleName]
        if (template.children == undefined) template.children = []
        for (const child of template.children)
            element.appendChild(realize(child))
        return element
    }
}

// The below two functions are contrib.
/**
 * Converts integer to a hexidecimal code, prepad's single
 * digit hex codes with 0 to always return a two digit code.
 *
 * @param {Integer} i Integer to convert
 * @returns {String} The hexidecimal code
 */
function intToHex(i) {
    var hex = parseInt(i).toString(16)
    return (hex.length < 2) ? "0" + hex : hex
}

/**
 * Return hex color from scalar *value*.
 *
 * @param {float} value Scalar value between 0 and 1
 * @return {String} color
 */
function makeColor(value) {
    if (value == -1) return [111, 255, 200]
    // value must be between [0, 510]
    value = Math.min(Math.max(0,value), 1) * 510

    var redValue = 0
    var greenValue = 0
    if (value < 255) {
        redValue = 255
        greenValue = Math.sqrt(value) * 16
        greenValue = Math.round(greenValue)
    } else {
        greenValue = 255
        value = value - 255
        redValue = 255 - (value * value / 255)
        redValue = Math.round(redValue)
    }

    return [redValue, greenValue, 0]
}

function hexColor(rgb) {
    return "#" + intToHex(rgb[0]) + intToHex(rgb[1]) + intToHex(rgb[2])
}

function rgba(rgb, alpha) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`
}

const steps = [
    "step1", // Response collection
    "stepL", // Savestate management
    "stepI", // Import/export
    "stepS", // Manual save
    "step2", // Tier list
    "step3", // A/B comparison
    "step4", // Review
    "step5"  // Output
]
let navStack = []
let currentStep = steps[0]
let stepHandlers = {}
function activateStep(newStep, noPush) {
    for (let step of steps) {
        for (let element of document.querySelectorAll("."+step)) {
            if (step == newStep) {
                element.classList.remove("invisible")
            } else {
                if (!element.classList.contains(newStep)) {
                    element.classList.add("invisible")
                }
            }
        }
    }
    if (newStep != "step1") {
        settings.classList.add("invisible")
    } else {
        settings.classList.remove("invisible")
    }
    if (Object.keys(stepHandlers).includes(newStep)) {
        stepHandlers[newStep]()
    }
    if (!noPush) navStack.push(currentStep)
    currentStep = newStep
}
function redraw() { activateStep(currentStep, true) }
function bindStep(step, closure) {
    stepHandlers[step] = closure
}



function bindClick(selector, closure) {
    document.querySelector(selector).addEventListener("click", closure)
}

function emptySelector(selector) {
    let element = document.querySelector(selector)
    //for (let child of element.children)
    //    child.remove()
    element.innerHTML = ""
    return element
}

// Settings toggle
let settings = document.querySelector("#settings")
let expandSettings = document.querySelector("#expand-settings")
bindClick("#expand-settings", e => {
    settings.classList.toggle("invisible")
})

/////////////////////////////////////////

//// Step 1: Response collection

// Not technically step 1, but they are in Step 1's button set
bindClick("#importUI", e => {
    activateStep("stepI")
})
bindClick("#loadUI", e => {
    activateStep("stepL")
})

function letterSplit(responses) {
    let output = {}
    let i = 0
    for (let response of responses) {
        if (document.querySelector("#letter").checked) {
            // TWOW mode
            let sep = " "
            if (response.includes("\t"))
                sep = "\t"
            let code = response.substring(0, response.indexOf(sep))
            // Last letter of code: fixes some odd spreadsheets, but prevents multi coding
            code = code.charAt(code.length-1)
            let words = response.substring(response.indexOf(sep)+1).trim()
            output[code] = words
        } else {
            // Non-TWOW mode
            i++
            output[i] = response
        }
    }
    return output
}

function shuffle(array) {
    let copy = array.slice()
    let result = []
    while (copy.length > 0) {
        let item = copy.splice(Math.floor(Math.random() * copy.length), 1)[0]
        result.push(item)
    }
    return result
}

bindClick("#go", e => {
    state = {}
    state.keyword = document.querySelector("#keyword").value
    if (state.keyword == null || state.keyword == "") state.keyword = "KEYWORD"
    state.note = document.querySelector("#prenote").value
    state.comparisons = []
    state.yourResponses = document.querySelector("#yourResponses").value.split(",").map(x => x.trim())
    state.responses = letterSplit(document.querySelector("#responses").value.trim().split("\n"))
    state.responseKeys = shuffle(Object.keys(state.responses))
    state.sortalgo = document.querySelector("#sortalgo").value
    state.letter = loadSetting("letter")
    let tierSetName = document.querySelector("#tierset").value
    if (tierSetName != "custom") {
        state.tierset = tierSets[tierSetName]
    } else {
        state.tierset = document.querySelector("#customTierset").value.split(",").map(x => x.trim())
    }
    state.tier = {}
    for (let responseCode in state.responses) {
        state.tier[responseCode] = (state.yourResponses.includes(responseCode) && tierSetName != "none") ? state.tierset.length-1 : -1
    }
    if (tierSetName == "none") {
        activateStep("step3") // skip to A/B
    } else {
        activateStep("step2")
    }
})

bindStep("step1", () => {
    let goBtn = document.querySelector("#go")
    if (localStorage.getItem("state:auto") != null) {
        goBtn.style.color = "var(--warning)"
        goBtn.textContent = "Go (overwrite autosave)"
    } else {
        goBtn.style.color = null
        goBtn.textContent = "Go"
    }
})
activateStep("step1")

//// Step 2: Tier listing
const tierSets = {
    none: {"-1": "Default"},
    numbers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    numbersPoint5: ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'],
    letters: ['F', 'E', 'D', 'C', 'B', 'A'],
    lettersS: ['F', 'E', 'D', 'C', 'B', 'A', 'S'],
    lettersDeltas: ['D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'],
    lettersDeltasS: ['D-', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+', 'S-', 'S', 'S+'],
}

bindStep("step2", () => {
    let leftBox = emptySelector(".step2 .left")
    let rightBox = emptySelector(".step2 .right")

    // Populate the right box with tiers
    let tierBoxes = {}
    let leftList = realize({tag: "div", classes: [ "dragBox" ]})
    leftBox.appendChild(realize({
        tag: "div",
        classes: ["tier"],
        children: [leftList]
    }))
    tierBoxes[-1] = leftList
    leftList.dataset.tierCode = "-1"
    for (let tierCode = state.tierset.length-1; tierCode>=0; tierCode--) {
        let tierName = state.tierset[tierCode]
        tierBoxes[tierCode] = realize({
            tag: "div",
            classes: [ "dragBox" ]
        })
        tierBoxes[tierCode].dataset.tierCode = tierCode
        rightBox.appendChild(realize({
            tag: "div",
            classes: ["tier"],
            children: [
                realize({
                    tag: "div",
                    classes: ["descriptionBox" ],
                    styles: {
                        "backgroundColor": hexColor(makeColor(tierCode/(state.tierset.length-1)))
                    },
                    text: tierName
                }),
                tierBoxes[tierCode]
            ]
        }))
    }

    for (let responseCode of state.responseKeys) {
        let thing = realize({
            tag: "div",
            classes: [ "response" ],
            children: [
                realize({tag: "div", classes: ["draggy"]}),
                realize({tag: "div", classes: ["text"], text: state.responses[responseCode]}),
            ]
        })
        thing.dataset.response = responseCode
        tierBoxes[state.tier[responseCode]].appendChild(thing)
        // Touchscreen drag-free tiering
        let buttonSet = realize({
            tag: "div",
            classes: [ "buttonSet" ]
        })
        let tip = tippy(thing, {
            trigger: "click focus",
            hideOnClick: true,
            interactive: true,
            content: buttonSet,
            followCursor: "initial",
            appendTo: document.body,
            onShow: () => {
                thing.classList.add("highlight")
            },
            onHide: () => {
                thing.classList.remove("highlight")
            }
        })
        for (let tierCode = state.tierset.length-1; tierCode>=0; tierCode--) {
            let button = buttonSet.appendChild(realize({
                tag: "button",
                styles: {
                    "backgroundColor": hexColor(makeColor(tierCode/(state.tierset.length-1))),
                    "color": "black",
                    "fontWeight": "bold"
                },
                text: state.tierset[tierCode]
            }))
            button.addEventListener("click", e => {
                state.tier[responseCode] = tierCode
                tip.hide()
                autoSave()
                redraw()
            })
        }

    }

    function tierProgress() {
        document.querySelector("progress").value = ((state.responseKeys.length - tierBoxes[-1].children.length) / state.responseKeys.length)
    }


    for (let tier in tierBoxes) {
        Sortable.create(tierBoxes[tier], {
            animation: 150,
            group: "tiers",
            handle: loadSetting("handleDrag") == true ? ".draggy" : undefined,
            onEnd: e => {
                state.tier[e.item.dataset.response] = e.to.dataset.tierCode
                autoSave()
                tierProgress()
            }
        })
    }
    tierProgress()
})

bindClick("#sort", e => {
    if (document.querySelector("progress").value < 1) {
        alert("You must sort all responses to continue")
    } else {
        activateStep("step3")
    }
})

//// Step 3: A/B comparison
function countWords(str) {
    str = str.replace(/[!,:;?]+/g, " ")
    str = str.replace(/[^\d\w\s]+/g, "")
    //.replace(/[]/, " ")
    str = str.split(' ')
    str = str.filter(function (n) { return n != '' })
    return str.length
}

bindStep("step3", () => {
    document.querySelector("#note").value = state.note

    let result = trySort(voterComparator())
    if (result.success == true) {
        activateStep("step4")
    } else {
        // result.compare is an array of two responseCodes which we can't sort
        const a = emptySelector("#a")
        const b = emptySelector("#b")
        a.textContent = state.responses[result.compare[0]]
        b.textContent = state.responses[result.compare[1]]
        a.style.borderColor = hexColor(makeColor(guessScore(result.compare[0])))
        b.style.borderColor = hexColor(makeColor(guessScore(result.compare[1])))
        if (loadSetting("theme") != "light") {
            a.style.color = hexColor(makeColor(guessScore(result.compare[0])))
            b.style.color = hexColor(makeColor(guessScore(result.compare[1])))
        }
        if (loadSetting("wordcount") == true) {
            a.appendChild(realize(" "))
            b.appendChild(realize(" "))
            a.appendChild(realize({
                tag: "small",
                text: "(" + countWords(state.responses[result.compare[0]]) + ")"
            }))
            b.appendChild(realize({
                tag: "small",
                text: "(" + countWords(state.responses[result.compare[1]]) + ")"
            }))
        }
        compareProgress()
    }
})

//// Sorting Engine

let sortCache = {}
let cachedComparisons = 0

function tierCodes() {
    let tierCode = Object.keys(state.tierset).reverse()
    if (tierCode.length == 1) { // the ['Default'] set
        tierCode = [-1]
    }
    return tierCode
}

function tierSublists() {


    let sublists = {}
    for (let tier of tierCodes()) {
        sublists[tier] = state.responseKeys.filter(key => state.tier[key] == tier)
    }
    return sublists
}

function trySort(comparator, noCache) {
    // Construct sublists

    let sublists = tierSublists()

    // tierCodes.append(-1) New algo disallows unsorteds
    // Sort sublists
    const sortFunction = sortFunctions[loadSetting("sortalgo")]
    let sortedSublists = {}
    try {
        for (let sublist of tierCodes()) {
            let sorted = Object.keys(sortCache).includes(sublist) ? sortCache[sublist] : sortFunction(sublists[sublist], comparator)
            if (!noCache) sortCache[sublist] = sorted
            sortedSublists[sublist] = sorted
        }
    } catch (e) {
        return {
            success: false,
            compare: e
        }
    }
    // Merge sublists
    let result = []
    for (let sublist of tierCodes()) {
        result = result.concat(sortedSublists[sublist])
    }
    return {
        success: true,
        result: result
    }
}

function simulate(n, func) {
    let result = []
    let i = 0
    while (i < n) {
        result.push(func())
        i++
    }
    return result
}

// function s(n,f){let r=0;let i=0; while(i<n){r+=f();i++};return r/n}

let debugGuesses = 0
let debugComparisons = 0
let debugHandComparisons = 0
let findResponseA = "A"
let findResponseB = "B"
function compareProgress() {
    setTimeout(() => {
        debugGuesses = 0
        debugHandComparisons = 0
        debugComparisons = 0
        const n = 50
        const overFactor = 1.3 // for some reason human comparison seems to perform slower than random, so compensate

        let sublists = tierSublists()
        const sortFunction = sortFunctions[loadSetting("sortalgo")]
        const comparator = voterComparator("predict")

        // tierCodes.append(-1) New algo disallows unsorteds

        // determine max guesses
        if (state.tierMaxGuesses == undefined) {
            state.tierMaxGuesses = {}
            let temp = state.comparisons.slice()
            state.comparisons = []
            for (let sublist of tierCodes()) {
                let simulation = simulate(n, () => {
                    debugGuesses = 0
                    let sorted = sortFunction(sublists[sublist], comparator)
                    return debugGuesses
                })
                //state.tierMaxGuesses[sublist] = overFactor * simulation.reduce((a, x) => a+x) / simulation.length
                state.tierMaxGuesses[sublist] = simulation.reduce((a, b) => Math.max(a, b))
            }

            state.comparisons = temp
        }

        let tierCurrentGuesses = {}
        // determine current guesses
        let gotCurrentTier = false
        for (let sublist of tierCodes()) {
            if (!Object.keys(sortCache).includes(sublist)) {
                if (!gotCurrentTier) {
                    gotCurrentTier = true
                    debugGuesses = 0
                    debugHandComparisons = 0
                    let sorted = sortFunction(sublists[sublist], comparator)
                    tierCurrentGuesses[sublist] = state.tierMaxGuesses[sublist] - debugHandComparisons
                } else {
                    tierCurrentGuesses[sublist] = state.tierMaxGuesses[sublist]
                }

            } else {
                tierCurrentGuesses[sublist] = 0
            }
        }

        // Display code
        let tieredProgress = emptySelector("#tieredProgress")

        let maxGuesses = Object.values(state.tierMaxGuesses).reduce((a, x) => a+x)
        gotCurrentTier = false
        for (let tier of tierCodes()) {
            if (maxGuesses != 0) {
                let percentIsTier = 100 * state.tierMaxGuesses[tier] / maxGuesses
                let percentIsDone = gotCurrentTier ? 0 : (percentIsTier * Math.max(0, state.tierMaxGuesses[tier] - tierCurrentGuesses[tier]) / state.tierMaxGuesses[tier])
                let percentIsUndone = percentIsTier - percentIsDone

                if (percentIsDone > 0) {
                    tieredProgress.appendChild(realize({
                        tag: "div",
                        classes: [ "block" ],
                        styles: {
                            width: percentIsDone + "%",
                            backgroundColor: rgba(makeColor((tier == -1) ? -1 : (tier / (state.tierset.length-1))), 1)
                        }
                    }))
                }
                if (percentIsUndone > 0) {
                    gotCurrentTier = true
                    tieredProgress.appendChild(realize({
                    tag: "div",
                    classes: [ "block" ],
                    styles: {
                        width: percentIsUndone + "%",
                        backgroundColor: rgba(
                            makeColor((tier == -1) ? -1 : (tier / (state.tierset.length-1))),
                            0.2 //percentIsDone == 0 ? 0.2 : 0.6
                        )
                    }
                }))
                }
            }
        }

        // document.querySelector("progress").value = Math.max(0, state.maxGuesses - currentGuesses) / state.maxGuesses
    }, 200)
}

const aGb = -1
const bGa = 1
const aEb = 0
// mode = "guess", "predict", undefined
function voterComparator(mode) {
    return function(a, b) {
        debugComparisons ++

        if ( state.yourResponses.includes(a) && state.yourResponses.includes(b) ) {
            return (state.yourResponses.indexOf(a) < state.yourResponses.indexOf(b) ) ? aGb : bGa
        } if (state.yourResponses.includes(a)) {
            return aGb
        } if (state.yourResponses.includes(b)) {
            return bGa
        } if (state.tier[a] != -1 && state.tier[b] != -1) {
            if (state.tier[a] > state.tier[b]) {
                return aGb
            } else if (state.tier[b] > state.tier[a]) {
                return bGa
            } // else continue (equal tiers)
        } if (state.comparisons.includes(a + ">" + b)) {
            debugHandComparisons++
            return aGb
        } if (state.comparisons.includes(b + ">" + a)) {
            debugHandComparisons++
            return bGa
        } if (mode == "guess" || mode == "predict") {
            debugGuesses++
        } if (mode == "guess") {
            return ( Math.random() < 0.5 ) ? aGb : bGa
        } if (mode == "predict") {
            return (guessScore(a) > guessScore(b)) ? aGb : bGa
        } else {
            findResponseA = a
            findResponseB = b
            throw [a, b]
        }
    }
}

function guessScore(code) {
    let comparisons = state.comparisons.reduce((a, c) => (a + (c.includes(code) ? 1 : 0 )), 0)
    let wins = state.comparisons.reduce((a, c) => (a + (c.includes(code + ">") ? 1 : 0 )), 0)
    if (comparisons == 0) return 0.5
    return wins/comparisons
}

//// Sort algos

function mergeSort(list, comparator) {
    let splitA = []
    let splitB = []
    if (list.length > 1) {
        splitA = mergeSort(list.slice(0, Math.floor(list.length / 2)), comparator)
        splitB = mergeSort(list.slice(Math.floor(list.length / 2)), comparator)
    }
    if (list.length <= 1) return list
    let mergedList = []
    while (splitA.length > 0 && splitB.length > 0) {
        let a = splitA[0]
        let b = splitB[0]
        if (comparator(a, b) == aGb) {
            mergedList.push(a)
            splitA = splitA.slice(1) // remove the first element from each list
        } else { // bGa
            mergedList.push(b)
            splitB = splitB.slice(1)
        }
    }
    for (let item of splitA) mergedList.push(item) // push what is left
    for (let item of splitB) mergedList.push(item)
    return mergedList
}

function legacySort(list, comparator) {
    list.sort(comparator)
}

const sortFunctions = {
    merge: mergeSort,
    legacy: legacySort
}

//// Misc

document.querySelector("#note").addEventListener("change", e => {
    state.note = e.target.value
})

bindClick("#undo", e => {
    state.comparisons.pop()
    sortCache = {}
    redraw()
})

function voteA() {
    state.comparisons.push(findResponseA + ">" + findResponseB)
    autoSave()
    redraw()
}

function voteB() {
    state.comparisons.push(findResponseB + ">" + findResponseA)
    autoSave()
    redraw()
}
bindClick("#a", voteA)
bindClick("#b", voteB)

let lastKeyTime = 0 // debounce number
document.addEventListener("keydown", e => {
    // if we be ranking
    if (currentStep == "step3") {
        if (lastKeyTime + 100 < new Date().getTime()) {
            lastKeyTime = new Date().getTime()
            switch (e.code) {
                case "Digit1":
                    e.preventDefault()
                    voteA()
                    return
                case "Digit2":
                    e.preventDefault()
                    voteB()
                    return
                default:
                    return // do nothing
            }
        }
    } else if (currentStep == "step2") {
        if (lastKeyTime + 100 < new Date().getTime()) {
            lastKeyTime = new Date().getTime()
            if (e.code.startsWith("Digit")) {
                let digit = parseInt(e.code.charAt(5))
                if (digit == 0) digit = 10
                if ( digit <= state.tierset.length ) {
                    e.preventDefault()
                    let topCode = document.querySelector(".step2 .left .dragBox").children[0].dataset.response
                    state.tier[topCode] = state.tierset.length - (digit)
                    autoSave()
                    redraw()
                }
            }
        }
    }
})

//// Step 4: Review
bindStep("step4", () => {
    const responseList = emptySelector("#responseList")
    if (state.sortResult == undefined) state.sortResult = trySort(voterComparator()).result
    for (let code of state.sortResult) {
        let thing = realize({
            tag: "div",
            classes: [ "response" ],
            children: [
                realize({tag: "div", classes: ["draggy"]}),
                realize({tag: "div", classes: ["text"], text: state.responses[code]}),
            ]
        })
        thing.dataset.response = code
        responseList.appendChild(thing)
    }

    Sortable.create(responseList, {
        animation: 150,
        group: "review",
        onEnd: e => {
            state.sortResult = Array.from(document.querySelector("#responseList").children).map(x => x.dataset.response)
            autoSave()
        }
    })
})

bindClick("#finish", e => {
    activateStep("step5")
})

//// Step 5: Output
bindStep("step5", () => {
    deleteState("auto")
    let longOutput = ""
    let voteOutput = ""
    if (state.letter == undefined) state.letter = true
    if (state.letter == true) {
        document.querySelector("#outputSequence").classList.remove("invisible")
        voteOutput = "[" + state.keyword + " "
    } else {
        document.querySelector("#outputSequence").classList.add("invisible")
    }
    for (let letter of state.sortResult) {
        voteOutput += letter
        longOutput += letter + "\t" + state.responses[letter] + "\n"
    }
    document.querySelector("#output").value = longOutput
    if (state.letter == true) {
        voteOutput += "]"
        document.querySelector("#outputSequence").value = voteOutput
    }
})


//////// Secondary Steps /////////

//// Step 2 and 3
bindClick("#save", e => {
    activateStep("stepS")
})

//// Step L: Savestate management
// Also used for other steps
bindClick("#back", e => {
    activateStep(navStack.pop(), true)
})

// All data that should be saved should go in the state object
let state = {
/*
 * keyword: string
 * yourResponses: string[]
 * responses: { code: response } string:string
 * tierSet: array
 * tier: { code: tier }
 * comparisons: pair[]
 * (automatic) lastModified: Date
 * (automatic) currentStep: string
 * (semi auto) name: string (a label)
 */
}

// convert a Unicode string to a string in which
// each 16-bit unit occupies only one byte
// licensed under CC0 from:
// https://developer.mozilla.org/en-US/docs/Web/API/btoa#unicode_strings
function toBinary(string) {
    const codeUnits = new Uint16Array(string.length);
    for (let i = 0; i < codeUnits.length; i++) {
        codeUnits[i] = string.charCodeAt(i);
    }
    const charCodes = new Uint8Array(codeUnits.buffer);
    let result = '';
    for (let i = 0; i < charCodes.byteLength; i++) {
        result += String.fromCharCode(charCodes[i]);
    }
    return result;
}

function saveState(name, noActivate) {
    // save the state
    state.currentStep = navStack.pop()
    state.lastModified = new Date()
    //state.currentStep = currentStep
    state.name = name
    let byteString = toBinary(name + state.lastModified.toISOString())
    let stateId = btoa(byteString).substring(0, 64)
    localStorage.setItem("state:" + stateId, JSON.stringify(state))
    // add name to savestate set
    let states = JSON.parse(localStorageDefault("states", "[]"))
    if (!states.includes(stateId)) states.unshift(stateId)
    localStorage.setItem("states", JSON.stringify(states))
    if (!noActivate) activateStep(state.currentStep, true)
}

function autoSave() {
    // save the state
    state.lastModified = new Date()
    state.currentStep = currentStep
    state.name = "Autosave"
    let stateId = "auto"
    localStorage.setItem("state:" + stateId, JSON.stringify(state))
    // add name to top of savestate set
    let states = JSON.parse(localStorageDefault("states", "[]"))
    states = states.filter(x => x != "auto")
    states.unshift("auto")
    localStorage.setItem("states", JSON.stringify(states))
}

function loadState(name) {
    state = JSON.parse(localStorage.getItem("state:" + name))
    sortCache = {}
}

function deleteState(name) {
    localStorage.removeItem("state:" + name)
    // delete name from savestate set
    let states = JSON.parse(localStorageDefault("states", "[]"))
    states = states.filter(x => x != name)
    localStorage.setItem("states", JSON.stringify(states))
}

bindStep("stepL", () => {
    let savestateList = emptySelector("#savestateList")
    let states = JSON.parse(localStorageDefault("states", "[]"))
    for (let stateId of states) {
        let aState = JSON.parse(localStorage.getItem("state:" + stateId))

        let loadButton = realize({
            tag: "button",
            text: "Load"
        })
        loadButton.addEventListener("click", e => {
            loadState(stateId)
            activateStep(state.currentStep)
        })

        let deleteButton = realize({
            tag: "button",
            text: "Delete"
        })
        deleteButton.addEventListener("click", e => {
            if (confirm("Delete?")) deleteState(stateId)
            redraw()
        })

        let loadRow = realize({
            tag: "div",
            children: [
                realize({
                    tag: "strong",
                    text: aState.name
                }),
                " / ",
                realize({
                    tag: "kbd",
                    text: aState.keyword,
                }),
                ` - created ${new Date(aState.lastModified).toString()} `,
                loadButton,
                " ",
                deleteButton
            ]
        })
        savestateList.appendChild(loadRow)
    }
})

bindClick("#deleteAll", e => {
    if (confirm("Delete all saves? Excludes autosave.")) {
        loadState("auto")
        localStorage.clear()
        if (state != null) autoSave()
        redraw()
    }
})

//// Step I: Import/Export
bindStep("stepI", () => {
    let exportBox = {}
    exportBox.format = "v2"
    let states = JSON.parse(localStorageDefault("states", "[]"))
    exportBox.states = states
    for (let stateId of states) {
        let aState = JSON.parse(localStorage.getItem("state:" + stateId))
        exportBox["state:" + stateId] = aState
    }
    document.querySelector("#exportData").value = JSON.stringify(exportBox)
})

bindClick("#import", e => {
    let importBox = JSON.parse(document.querySelector("#importData").value)
    if (importBox.format == "v2") { // Voter 2 > Voter 2 import
        for (let key of Object.keys(importBox)) {
            if (key == "states") {
                let states = JSON.parse(localStorageDefault("states", "[]"))
                for (let newState of importBox.states) {
                    if (!states.includes(newState) && newState != "auto") states.unshift(newState)
                }
                if (Object.keys(importBox).includes("state:auto") && !states.includes("autoImport")) states.unshift("autoImport")
                localStorage.setItem("states", JSON.stringify(states))
            } else {
                if (key == "state:auto") {
                    importBox[key].name = "Autosave (imported)"
                    importBox["state:autoImport"] = importBox[key]
                    key = "state:autoImport"
                }
                let aState = JSON.stringify(importBox[key])
                localStorage.setItem(key, aState)
            }
        }
    } else {
        // error
    }
    redraw()
})

// Step S: Save screen
bindClick("#saveBtn", e => {
    saveState(document.querySelector("#saveName").value)
    activateStep(navStack.pop(), true)
})

const revision = 7
document.querySelector("#currentRevision").textContent = "Current revision: " + revision

// https://stackoverflow.com/a/5582719
function splitWithTail(str,delim,count){
  var parts = str.split(delim)
  var tail = parts.slice(count).join(delim)
  var result = parts.slice(0,count)
  result.push(tail)
  return result
}


// Votelink
let votelink = null
if (document.location.hash.startsWith("#votelink=")) {
    votelink = decodeURIComponent(document.location.hash.substring(10))
}
if (votelink === null) {
    const params = new URLSearchParams(document.location.search)
    votelink = params.get("votelink")
}
if (votelink !== null) {
    var i = votelink.indexOf('!');
    if (i != -1) {
        var parts = [votelink.slice(0,i), votelink.slice(i+1)]
        document.querySelector("#keyword").value = parts[0]
        document.querySelector("#responses").value = parts[1]
    }
}

// Votelink 2 (with note)
let votelink2 = null
if (document.location.hash.startsWith("#votelink2=")) {
    votelink2 = decodeURIComponent(document.location.hash.substring(11))
}
if (votelink2 === null) {
    const params = new URLSearchParams(document.location.search)
    votelink2 = params.get("votelink2")
}
if (votelink2 !== null) {
    var i = votelink2.indexOf('!');
    if (i != -1) {
        let [vlkw, vlpn, vlresp] = splitWithTail(votelink2, "!", 2);
        document.querySelector("#keyword").value = vlkw
        document.querySelector("#prenote").value = vlpn
        document.querySelector("#responses").value = vlresp
    }
}

//// Voter 1 > Voter 2 migration
if (localStorage.getItem("savestates") != null) {
    alert("Welcome to Voter version 2! We will now try to migrate your data. It might look a bit different but it works basically the same. You might want to try the new theme, or check out the new help page.")
    try {
        // Migrate theme
        if (localStorage.getItem("theme") != null) {
            saveSetting("theme", localStorage.getItem("theme"))
            activateTheme(loadSetting("theme"))
        }
        // Migrate saves
        let oldSavestates = JSON.parse(localStorage.getItem("savestates"))
        for (let oldSaveName of oldSavestates) {
            let oldSave = JSON.parse(localStorage.getItem(oldSaveName))
            let newSave = {}
            newSave.name = oldSaveName + " (migrated)"
            newSave.keyword = "KEYWORD"
            newSave.lastModified = new Date()
            if (oldSave.picktierset == "custom") {
                newSave.tierset = oldSave.customTierset.split(",").map(x => x.trim())
            } else {
                newSave.tierset = tierSets[oldSave.picktierset]
            }
            newSave.yourResponses = oldSave.yourResponseLetters
            newSave.tier = oldSave.tier
            navStack.push(oldSave.isRanking ? "step2" : "step3")
            newSave.comparisons = oldSave.comparisonCache
            newSave.responses = oldSave.responses
            newSave.responseKeys = Object.keys(newSave.responses)
            newSave.note = (oldSave.prompt == undefined) ? "" : oldSave.prompt
            newSave.letter = true
            state = newSave
            saveState(newSave.name, true)
        }

        // Delete old format data
        localStorage.removeItem("savestates")
        localStorage.removeItem("theme")
        for (let oldSaveName of oldSavestates) {
            localStorage.removeItem(oldSaveName)
        }
    } catch(e) {
        console.log(e)
        alert("There was an error migrating your data. (Don't worry, it shouldn't be lost!) Contact figgyc#0168 on Discord if you need your old save states.")
    } finally {
        alert("Your data migrated successfully.")
    }
    state = {}
    //currentStep = "step1"
}
