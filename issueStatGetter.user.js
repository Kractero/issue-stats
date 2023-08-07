// ==UserScript==
// @name         Issue Stat Getter
// @namespace    Kra
// @version      1.0
// @description  Get issues results shown to you.
// @author       Kractero
// @match        https://www.nationstates.net/page=show_dilemma/dilemma=*
// @downloadURL  https://github.com/Kractero/issue-stats/raw/master/issueStatGetter.js
// @updateURL    https://github.com/Kractero/issue-stats/raw/master/issueStatGetter.js
// @grant        none
// ==/UserScript==

function levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    const matrix = [];
    for (let i = 0; i <= m; i++) {
        matrix[i] = [i];
    }
    for (let j = 1; j <= n; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1;
            }
        }
    }
    return 1 - matrix[m][n] / Math.max(m, n);
}

async function getBadgeMap(nation) {
    const notValid = ["Influence", "International Artwork", "Population", "Residency", "World Assembly Endorsements"]
    const ranks = await fetch(`https://www.nationstates.net/nation=${nation}/detail=rank`, {
        headers: {
            'User-Agent': "Issue Stat Getter (by:Kractero, usedBy:{})"
        }
    })
    const ranksAsText = await ranks.text()
    const parser = new DOMParser();
    const document = parser.parseFromString(ranksAsText, 'text/html');
    const categories = document.querySelectorAll('#trophyranks tbody tr td:first-child');
    const map = Array.from(categories).reduce((acc, category) => {
        const categoryName = category.textContent.trim();
        if (!notValid.includes(categoryName)) {
            const img = category.querySelector('img');
            if (img) {
                const imageUrl = img.getAttribute('src');
                acc[categoryName] = imageUrl;
            }
        }
        return acc;
    }, {});
    return map;
}

(async function () {
    'use strict';

    const jsonRanges = [
        "0-99",
        "100-199",
        "200-299",
        "300-399",
        "400-499",
        "500-599",
        "600-699",
        "700-799",
        "800-899",
        "900-999",
        "1000-1099",
        "1100-1199",
        "1200-1299",
        "1300-1399",
        "1400-1499",
        "1500-1578"
    ]
    const census = [
        'Authoritarianism',
        'Average Disposable Income',
        'Average Income',
        'Average Income of Poor',
        'Average Income of Rich',
        'Averageness',
        'Black Market',
        'Business Subsidization',
        'Charmlessness',
        'Cheerfulness',
        'Civil Rights',
        'Compassion',
        'Compliance',
        'Corruption',
        'Crime',
        'Culture',
        'Death Rate',
        'Defense Forces',
        'Eco-Friendliness',
        'Economic Freedom',
        'Economic Output',
        'Economy',
        'Employment',
        'Environmental Beauty',
        'Food Quality',
        'Foreign Aid',
        'Freedom From Taxation',
        'Government Size',
        'Health',
        'Human Development Index',
        'Ideological Radicality',
        'Ignorance',
        'Inclusiveness',
        'Income Equality',
        'Industry: Arms Manufacturing',
        'Industry: Automobile Manufacturing',
        'Industry: Basket Weaving',
        'Industry: Beverage Sales',
        'Industry: Book Publishing',
        'Industry: Cheese Exports',
        'Industry: Furniture Restoration',
        'Industry: Gambling',
        'Industry: Information Technology',
        'Industry: Insurance',
        'Industry: Mining',
        'Industry: Pizza Delivery',
        'Industry: Retail',
        'Industry: Timber Woodchipping',
        'Industry: Trout Fishing',
        'Integrity',
        'Intelligence',
        'Law Enforcement',
        'Lifespan',
        'Niceness',
        'Nudity',
        'Obesity',
        'Pacifism',
        'Patriotism',
        'Political Apathy',
        'Political Freedom',
        'Primitiveness',
        'Public Education',
        'Public Healthcare',
        'Public Transport',
        'Recreational Drug Use',
        'Religiousness',
        'Rudeness',
        'Safety',
        'Scientific Advancement',
        'Sector: Agriculture',
        'Sector: Manufacturing',
        'Secularism',
        'Social Conservatism',
        'Taxation',
        'Tourism',
        'Wealth Gaps',
        'Weaponization',
        'Weather',
        'Welfare',
        'Youth Rebelliousness'
    ]

    let stylesheet = document.createElement("style");
    stylesheet.innerHTML = `
        .hidden {
            display: none;
        }

        .checkbox {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            max-width: 1180px;
            min-width: 280px;
        }

        .effect-div {
            display: flex;
            flex-wrap: wrap;
            gap: 16px
        }

        .effect {
            width: max-content;
            align-items: center;
            display: flex;
        }
    `;
    document.getElementsByTagName("head")[0].appendChild(stylesheet);

    const id = window.location.href.replace('https://www.nationstates.net/page=show_dilemma/dilemma=', '');
    const nation = document.querySelector('.bannernation2').innerText;
    const choices = document.querySelectorAll('.diloptions li p:first-child');
    const filterSpot = document.querySelector('.dilemma');

    const shownValues = JSON.parse(localStorage.getItem('uncheckedValues') ?? '{}');

    const checkboxes = document.createElement('div')

    const buttonLabels = ["Filter Categories", "Toggle All", "Regenerate Badges", "Toggle One Percent", "Toggle Five Percent", "Toggle Ten Percent", "Toggle Unranked"];

    const [toggleButton, toggleCheckStatus, gatherBadges, toggleOnePercent, toggleFivePercent, toggleTenPercent, toggleUnranked] = buttonLabels.map((label) => {
        const button = document.createElement("button");
        button.textContent = label;
        return button;
    });

    const hide = [checkboxes, toggleCheckStatus, gatherBadges, toggleOnePercent, toggleFivePercent, toggleTenPercent, toggleUnranked]
    hide.forEach(element => element.classList.add('hidden'))

    toggleButton.addEventListener('click', () => {
        checkboxes.classList.toggle('checkbox');
        hide.forEach((element) => {
            element.classList.toggle('hidden');
        });
    });
    gatherBadges.addEventListener('click', () => {
        let badges = JSON.parse(localStorage.getItem('badges') || '{}');
        delete badges[nation]
        localStorage.setItem('badges', JSON.stringify(badges))
        location.reload()
    });

    function figureOutCheckStatus() {
        const checkboxers = checkboxes.getElementsByTagName('input')
        const uncheckedCheckboxes = Array.from(checkboxers).filter(cb => cb.checked);
        const uncheckedValues = Array.from(uncheckedCheckboxes, cb => cb.name);

        let currUncheckedObj = JSON.parse(localStorage.getItem('uncheckedValues')) || {};
        currUncheckedObj[nation] = uncheckedValues;

        localStorage.setItem('uncheckedValues', JSON.stringify(currUncheckedObj));

        Array.from(filterSpot.querySelectorAll('.effect-selector')).forEach(effect => {
            effect.classList.toggle('effect', currUncheckedObj[nation].some(value => value === 'Health' ? (!effect.textContent.includes('Public') && effect.textContent.includes(value)) : value === 'Taxation' ? (!effect.textContent.includes('Freedom From') && effect.textContent.includes(value))
                : value === 'Average Income' ? (!effect.textContent.includes('of Poor') && !effect.textContent.includes('of Rich') && effect.textContent.includes(value)) : effect.textContent.includes(value)));
        });
    }

    census.forEach(badge => {
        const cbDiv = document.createElement('div')
        const cb = document.createElement('input')
        cb.type = "checkbox"
        cb.id = cb.name = badge
        cb.checked = shownValues[nation] && shownValues[nation].includes(badge);
        cb.addEventListener('click', figureOutCheckStatus);
        const label = document.createElement('label');
        label.textContent = badge;
        label.setAttribute('for', badge);
        cbDiv.append(cb, label)
        checkboxes.appendChild(cbDiv)
    })

    toggleCheckStatus.addEventListener('click', () => {
        const checkboxList = checkboxes.querySelectorAll('input[type="checkbox"]');
        const areAllChecked = Array.from(checkboxList).every(checkbox => checkbox.checked);

        checkboxList.forEach(checkbox => {
            checkbox.checked = !areAllChecked;
        });
        figureOutCheckStatus()
    });

    toggleOnePercent.addEventListener('click', () => toggleBadgeCheckboxes('-1.png'));
    toggleFivePercent.addEventListener('click', () => toggleBadgeCheckboxes('-5.png'));
    toggleTenPercent.addEventListener('click', () => toggleBadgeCheckboxes('-10.png'));
    toggleUnranked.addEventListener('click', () => toggleBadgeCheckboxes('-100.png'));

    filterSpot.prepend(toggleButton, toggleCheckStatus, gatherBadges, checkboxes, toggleOnePercent, toggleFivePercent, toggleTenPercent, toggleUnranked)

    const choicesObject = Array.from(choices).map(choice => choice.textContent.trim());

    const range = jsonRanges.find(range => {
        const [start, end] = range.split('-');
        return Number(id) >= Number(start) && Number(id) <= Number(end);
    });

    const getSubList = await fetch(`https://raw.githubusercontent.com/Kractero/issue-stats/master/json/${range}.json`)
    const issueSubList = await getSubList.json()
    const correspondIdx = Object.keys(issueSubList).filter(issue => issue === id)
    const issue = issueSubList[Number(correspondIdx)]
    const selections = Object.keys(issue.options).map(choice => issue.options[choice].text)
    const bestMatchArray = choicesObject.map((option) => {
        option = option.replace(/“|”/g, '"')
        let bestMatchNum = 0;
        let bestScore = 0;

        selections.forEach((choice, i) => {
            const score = levenshteinDistance(option, choice);
            if (score > bestScore) {
                bestScore = score;
                bestMatchNum = i;
            }
        });

        return {
            text: selections[bestMatchNum],
            idx: bestMatchNum
        }
    });

    let badges = JSON.parse(localStorage.getItem('badges') || '{}');
    if (!badges[nation] || badges[nation] === {}) {
        badges[nation] = await getBadgeMap(nation);
        localStorage.setItem('badges', JSON.stringify(badges));
    }

    function toggleBadgeCheckboxes(suffix) {
        let badges = JSON.parse(localStorage.getItem('badges') || '{}');
        if (badges[nation]) {
            const matchingKeys = Object.keys(badges[nation]).filter((key) => badges[nation][key].endsWith(suffix));
            const checkboxList = checkboxes.querySelectorAll('input[type="checkbox"]');
            checkboxList.forEach((checkbox) => {
                const checkboxId = checkbox.id;
                const checkboxName = checkbox.name;

                if (matchingKeys.includes(checkboxId) || matchingKeys.includes(checkboxName)) {
                    checkbox.checked = !checkbox.checked;
                }
            });
        }
        figureOutCheckStatus();
    }

    let json = bestMatchArray.map((option) => {
        if (issue.options[String(option.idx + 1)].results) {
            let split = issue.options[String(option.idx + 1)].results.split('\n')
            return split.map((effect) => {
                const matchedEntry = Object.entries(badges[nation]).find(([key]) => {
                    return key === 'Health' ? (!effect.includes('Public') && effect.includes(key)) : key === 'Taxation' ? (!effect.includes('Freedom From') && effect.includes(key))
                        : key === 'Average Income' ? (!effect.includes('of Poor') && !effect.includes('of Rich') && effect.includes(key)) : effect.includes(key);
                });
                return matchedEntry ? [effect, matchedEntry[1]] : null;
            }).filter(Boolean);
        }
    });

    json = json.map(subArray => {
        if (subArray) {
            return subArray.sort((a, b) => {
                const regex = /-(\d+)\.png$/;
                const aValue = parseInt(a[1].match(regex)[1]);
                const bValue = parseInt(b[1].match(regex)[1]);
                return aValue - bValue;
            });
        }
        return null
    })

    const approves = document.querySelectorAll('.diloptions li');

    approves.forEach((option, index) => {
        const fatherDiv = document.createElement('div');
        fatherDiv.classList.add('effect-div')
        const goodDiv = document.createElement('div');
        const badDiv = document.createElement('div');

        let showValues = localStorage.getItem('uncheckedValues')

        if (json[index]) {
            json[index].forEach((item) => {
                const [effect, imageUrl, actual] = item;
                const effectDiv = document.createElement('div');
                const average = document.createElement('p');
                average.textContent = effect;
                average.style.margin = "0"

                const meanValue = effect.includes('mean') ? effect.split('mean')[1].trim() : effect.split(' ')[0];
                const isNegative = meanValue.startsWith('-');

                const image = document.createElement('img');
                image.src = imageUrl;

                effectDiv.append(image, average);
                effectDiv.classList.add('effect-selector', 'hidden')
                effectDiv.style.color = isNegative ? 'red' : 'green';
                isNegative ? badDiv.appendChild(effectDiv) : goodDiv.appendChild(effectDiv)

                if (showValues && JSON.parse(showValues)[nation]) {
                    const shownValues = JSON.parse(showValues)[nation];
                    effectDiv.classList.toggle('effect', shownValues.some(value => value === 'Health' ? (!effect.includes('Public') && effect.includes(value)) : value === 'Taxation' ? (!effect.includes('Freedom From') && effect.includes(value))
                        : value === 'Average Income' ? (!effect.includes('of Poor') && !effect.includes('of Rich') && effect.includes(value)) : effect.includes(value)));
                }
            });
        } else {
            const probableBug = document.createElement('p');
            probableBug.textContent = "No census effects in the JSON, probable bug!";
            probableBug.style.margin = "0"
            badDiv.appendChild(probableBug)
        }
        fatherDiv.append(goodDiv, badDiv);
        option.appendChild(fatherDiv);
    });

})();
