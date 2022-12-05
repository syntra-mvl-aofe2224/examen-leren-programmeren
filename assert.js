console.log('Assert ready!');

function loadCss(filename) {
    const fileref = document.createElement('link');
    fileref.setAttribute('rel', 'stylesheet');
    fileref.setAttribute('type', 'text/css');
    fileref.setAttribute('href', filename);
    document.getElementsByTagName('head')[0].appendChild(fileref);
}

function appendTo($element, html) {
    $element.insertAdjacentHTML('beforeend', html);
}

function appendContainer(name) {
    if (document.getElementById(name)) {
        return false;
    }
    appendTo(
        window.$assertContainer,
        `<div id="${name}"><h2>${name}</h2><div class="assert-container"></div></div>`
    );

    return true;
}

function spacing() {
    return '<span style="color: transparent; display: inline-block; width: 5rem;"></span>';
}

function fail() {
    return '<span style="color: indianred; display: inline-block; width: 5rem;">[fail]</span>';
}

function success() {
    return '<span style="color: lawngreen; display: inline-block; width: 5rem;">[success]</span>';
}

function assertFunctionExists(functionName, $assertContainer) {
    if (typeof window[functionName] === 'function') {
        appendTo(
            $assertContainer,
            `<p class="asserter success">${success()} Function <code>${functionName}()</code> found</p>`
        );
    } else {
        appendTo(
            $assertContainer,
            `<p class="asserter fail">${fail()} Function <code>${functionName}()</code> not found</p>`
        );
    }
}

/**
 * @param {HTMLElement} $assertContainer
 * @param {string} functionName
 * @param {array} params
 * @param {any} expected
 * @param {string} name
 * @param {boolean} reverse
 * @return {Promise<void>}
 */
async function assertResult(
    $assertContainer,
    functionName,
    params,
    expected,
    name = '',
    reverse = false
) {
    const paramsString = JSON.stringify(params);
    const expectedString = JSON.stringify(expected);
    const actualString = JSON.stringify(
        await window[functionName].apply(this, params)
    );

    if (name) {
        appendTo($assertContainer, `<h3>${name}:</h3>`);
    }

    if (reverse) {
        if (expectedString !== actualString) {
            appendTo(
                $assertContainer,
                `<p class='asserter success'>${success()} <code>${functionName}(${paramsString.substring(
                    1,
                    paramsString.length - 1
                )})</code> did not return <code>${expectedString}</code> it returned: <code>${actualString}</code></p>`
            );
        } else {
            appendTo(
                $assertContainer,
                `<p class='asserter fail'>${fail()} <code>${functionName}(${paramsString.substring(
                    1,
                    paramsString.length - 1
                )})</code> did return <code>${expectedString}</code></p><p>${spacing()} it returned: <code>${actualString}</code></p>`
            );
        }
    } else {
        if (expectedString === actualString) {
            appendTo(
                $assertContainer,
                `<p class='asserter success'>${success()} <code>${functionName}(${paramsString.substring(
                    1,
                    paramsString.length - 1
                )})</code> did return <code>${expectedString}</code></p>`
            );
        } else {
            appendTo(
                $assertContainer,
                `<p class='asserter fail'>${fail()} <code>${functionName}(${paramsString.substring(
                    1,
                    paramsString.length - 1
                )})</code> did not return <code>${expectedString}</code></p><p>${spacing()} it returned: <code>${actualString}</code></p>`
            );
        }
    }
}

/**
 * @param {HTMLElement} $assertContainer
 * @param {string} functionName
 * @param {string} name
 * @param {array} params
 * @param {number} testCount
 * @param {number | null} min
 * @param {number | null} max
 * @param {number} identicalFactor
 * @return {Promise<void>}
 */
async function assertRandomness(
    $assertContainer,
    functionName,
    name = '',
    params = [],
    testCount = 100,
    min = null,
    max = null,
    identicalFactor = 2
) {
    const paramsString = JSON.stringify(params);
    const results = [];

    for (let i = 0; i < testCount; i++) {
        const result = JSON.stringify(
            await window[functionName].apply(this, params)
        );
        results.push(result);
    }

    const uniqueResults = results.filter((val, index, arr) => {
        return arr.indexOf(val) === index;
    });

    const lowValues = results.filter((val) => {
        if (min === null) {
            return false;
        }

        const numVal = Number(val);

        if (Number.isNaN(numVal)) {
            return false;
        }

        return numVal < min;
    });

    const highValues = results.filter((val) => {
        if (max === null) {
            return false;
        }

        const numVal = Number(val);

        if (Number.isNaN(numVal)) {
            return false;
        }

        return numVal > max;
    });

    if (name) {
        appendTo($assertContainer, `<h3>${name}:</h3>`);
    }

    if (uniqueResults.length < testCount / identicalFactor) {
        appendTo(
            $assertContainer,
            `<p class='asserter fail'>${fail()} <code>${functionName}(${paramsString.substring(
                1,
                paramsString.length - 1
            )})</code> returned ${
                results.length - uniqueResults.length
            } identical results on ${testCount} tests. This is probably not really random. Example result: <code>${
                results[0]
            }</p>`
        );
    } else if (lowValues.length) {
        appendTo(
            $assertContainer,
            `<p class='asserter fail'>${fail()} <code>${functionName}(${paramsString.substring(
                1,
                paramsString.length - 1
            )})</code> returned ${
                lowValues.length
            } results lower than ${min}. Example result: <code>${
                results[0]
            }</p>`
        );
    } else if (highValues.length) {
        appendTo(
            $assertContainer,
            `<p class='asserter fail'>${fail()} <code>${functionName}(${paramsString.substring(
                1,
                paramsString.length - 1
            )})</code> returned ${
                highValues.length
            } results higher than ${max}. Example result: <code>${
                results[0]
            }</p>`
        );
    } else {
        // success
        appendTo(
            $assertContainer,
            `<p class='asserter success'>${success()} <code>${functionName}(${paramsString.substring(
                1,
                paramsString.length - 1
            )})</code> returned ${
                uniqueResults.length
            } unique result on ${testCount} tests within the expected range. Example result: <code>${
                results[0]
            }</code></p>`
        );
    }
}

(function prepFile() {
    if (window.$assertContainer) {
        return;
    }

    let $newAssertContainer = `<div id="assertions"></div>`;
    appendTo(document.body, $newAssertContainer);
    window.$assertContainer = document.getElementById('assertions');

    loadCss(
        'https://cdn.jsdelivr.net/gh/kognise/water.css@latest/dist/dark.min.css'
    );
})();

(async function randomNumberBetween() {
    const functionName = 'randomNumberBetween';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertRandomness(
        $assertContainer,
        functionName,
        'Simple',
        [0, 20],
        10,
        0,
        20
    );
    await assertRandomness(
        $assertContainer,
        functionName,
        'Start value',
        [5, 20],
        10,
        5,
        20
    );

    await assertRandomness(
        $assertContainer,
        functionName,
        'Negative',
        [-20, -2],
        10,
        -20,
        -2
    );

    await assertRandomness(
        $assertContainer,
        functionName,
        'Close',
        [3, 4],
        10,
        3,
        4,
        5
    );
})();

(async function splitOddAndEven() {
    const functionName = 'splitOddAndEven';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertResult(
        $assertContainer,
        functionName,
        [[1, 2, 3, 4]],
        [
            [2, 4],
            [1, 3],
        ],
        'Simple'
    );
    await assertResult(
        $assertContainer,
        functionName,
        [[1, 2, 3, 4, 3, 3]],
        [
            [2, 4],
            [1, 3, 3, 3],
        ],
        'Double'
    );
    await assertResult(
        $assertContainer,
        functionName,
        [[2, 6, 12, 24]],
        [[2, 6, 12, 24], []],
        'Only even'
    );
    await assertResult(
        $assertContainer,
        functionName,
        [[3, 7, 19, 13]],
        [[], [3, 7, 19, 13]],
        'Only odd'
    );
    await assertResult($assertContainer, functionName, [[]], [[], []], 'Empty');
})();

(async function randomizeSentence() {
    const functionName = 'randomizeSentence';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    await assertResult(
        $assertContainer,
        functionName,
        ['The lotus hears alot!'],
        'The lotus hears alot!',
        'Not equal',
        true
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertRandomness(
        $assertContainer,
        functionName,
        'Short sentence',
        ['The lotus hears alot!'],
        10,
        null,
        null,
        2
    );
    await assertRandomness(
        $assertContainer,
        functionName,
        'Long sentence',
        ['Chili combines greatly with hardened chicken breasts!'],
        1000,
        null,
        null,
        1.5
    );
})();

(async function removeLetter() {
    const functionName = 'removeLetter';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertResult(
        $assertContainer,
        functionName,
        ['Hallo', 'a'],
        'Hllo',
        'Simple'
    );
    await assertResult(
        $assertContainer,
        functionName,
        [
            'What’s the secret to salty and mild broccoli? Always use puréed pepper.',
            'e',
        ],
        'What’s th scrt to salty and mild broccoli? Always us puréd pppr.',
        'Long'
    );
    await assertResult(
        $assertContainer,
        functionName,
        [
            'What’s the secret to salty and mild broccoli? Always use puréed pepper.',
            'q',
        ],
        'What’s the secret to salty and mild broccoli? Always use puréed pepper.',
        'Letter not found'
    );
})();

(async function multiplyAll() {
    const functionName = 'multiplyAll';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertResult(
        $assertContainer,
        functionName,
        [[1, 2, 3, 4]],
        24,
        'Simple'
    );

    await assertResult(
        $assertContainer,
        functionName,
        [[1, 2, 3, 4, 0]],
        0,
        'With 0'
    );

    await assertResult(
        $assertContainer,
        functionName,
        [[1, 2, 3, 4, -22]],
        -528,
        'With negative'
    );

    await assertResult(
        $assertContainer,
        functionName,
        [[25, 50, 33, 1, 32, 7]],
        9240000,
        'Large'
    );
})();

(async function average() {
    const functionName = 'average';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertResult(
        $assertContainer,
        functionName,
        [[1, 2, 3, 4, 4]],
        2.8,
        'Short'
    );

    await assertResult(
        $assertContainer,
        functionName,
        [[1, 2, 3, 4, 4, 22, 5, 4, 89, 3, 6]],
        13,
        'Long'
    );

    await assertResult(
        $assertContainer,
        functionName,
        [[1, -2, 3, 4, -4, 22, 5, 4, 89, -3, 6, 1]],
        10.5,
        'Long'
    );
})();

(async function interweaveArrays() {
    const functionName = 'interweaveArrays';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertResult(
        $assertContainer,
        functionName,
        [
            [1, 2, 3, 4],
            [5, 6, 7, 8],
        ],
        [1, 5, 2, 6, 3, 7, 4, 8],
        'Simple'
    );

    await assertResult(
        $assertContainer,
        functionName,
        [
            [1, 2, 3, 4],
            [5, 6, 7, 8, 9, 10],
        ],
        [1, 5, 2, 6, 3, 7, 4, 8, 9, 10],
        'Second longer'
    );

    await assertResult(
        $assertContainer,
        functionName,
        [
            [1, 2, 3, 4, 11, 22, 33],
            [5, 6, 7, 8],
        ],
        [1, 5, 2, 6, 3, 7, 4, 8, 11, 22, 33],
        'First longer'
    );
})();

(async function interweaveSentences() {
    const functionName = 'interweaveSentences';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertResult(
        $assertContainer,
        functionName,
        [
            'The ship goes alignment like a lunar girl.',
            'Dosis are the collectives of the ship-wide beauty.',
        ],
        'The Dosis ship are goes the alignment collectives like of a the lunar ship-wide girl. beauty.',
        'Simple'
    );
    
    await assertResult(
        $assertContainer,
        functionName,
        [
            'The tribble views procedure like a photonic space suit.',
            'Klingon of an intelligent devastation.',
        ],
        'The Klingon tribble of views an procedure intelligent like devastation. a photonic space suit.',
        'Second shorter'
    );
    
    await assertResult(
        $assertContainer,
        functionName,
        [
            'Klingon of an intelligent devastation.',
            'The tribble views procedure like a photonic space suit.',
        ],
        'Klingon The of tribble an views intelligent procedure devastation. like a photonic space suit.',
        'First shorter'
    );
})();

(async function sortLetters() {
    const functionName = 'sortLetters';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertResult(
      $assertContainer,
      functionName,
      [['b', 'v','d', 'a']],
      ['a', 'b', 'd', 'v'],
      'Simple'
    );

    await assertResult(
      $assertContainer,
      functionName,
      [['b', 'v','d', 'a', 'q', 'e', 't']],
      ['a', 'b', 'd', 'e', 'q', 't', 'v'],
      'Long'
    );

    await assertResult(
      $assertContainer,
      functionName,
      [['b', 'V','d', 'a', 'Q', 'e', 't']],
      ['a', 'b', 'd', 'e', 'Q', 't', 'V'],
      'Case difference'
    );

    await assertResult(
      $assertContainer,
      functionName,
      [['b', 'V','d', 'eee', 'a', 'Q', 't', '?']],
      ['a', 'b', 'd', 'Q', 't', 'V'],
      'Non letters'
    );

    await assertResult(
      $assertContainer,
      functionName,
      [['b', 'v','d', 'a', 'a', 'a', 't']],
      ['a', 'a', 'a', 'b', 'd', 't', 'v'],
      'Duplicates'
    );
})();

(async function fullName() {
    const functionName = 'fullName';
    if (!appendContainer(functionName)) {
        return;
    }
    const $assertContainer = document.querySelector(
        '#' + functionName + ' .assert-container'
    );

    assertFunctionExists(functionName, $assertContainer);
    await assertResult(
        $assertContainer,
        functionName,
        ['Tom', 'Tim', 'Van De Walle'],
        'Tom T. Van De Walle',
        'All'
    );

    await assertResult(
      $assertContainer,
      functionName,
      ['Tom', null, 'Van de walle'],
      'Tom Van De Walle',
      'No seconde name'
    );

    await assertResult(
      $assertContainer,
      functionName,
      ['Tom', 'tim', 'Van de walle'],
      'Tom T. Van De Walle',
      'Fix case'
    );
})();
