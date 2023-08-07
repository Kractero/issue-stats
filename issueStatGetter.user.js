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


(async function() {
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
  ];
  const census = [
    ['0', 'Civil Rights', 'liberal'],
    ['1', 'Economy', 'economy'],
    ['2', 'Political Freedom', 'polifree'],
    ['4', 'Wealth Gaps', 'wealthgaps'],
    ['5', 'Death Rate', 'death'],
    ['6', 'Compassion', 'compassionate'],
    ['7', 'Eco-Friendliness', 'eco-govt'],
    ['8', 'Social Conservatism', 'conservative'],
    ['9', 'Nudity', 'nude'],
    ['10', 'Industry: Automobile Manufacturing', 'auto'],
    ['11', 'Industry: Cheese Exports', 'cheese'],
    ['12', 'Industry: Basket Weaving', 'basket'],
    ['13', 'Industry: Information Technology', 'tech'],
    ['14', 'Industry: Pizza Delivery', 'pizza'],
    ['15', 'Industry: Trout Fishing', 'fish'],
    ['16', 'Industry: Arms Manufacturing', 'arms'],
    ['17', 'Sector: Agriculture', 'agriculture'],
    ['18', 'Industry: Beverage Sales', 'soda'],
    ['19', 'Industry: Timber Woodchipping', 'timber'],
    ['20', 'Industry: Mining', 'mining'],
    ['21', 'Industry: Insurance', 'insurance'],
    ['22', 'Industry: Furniture Restoration', 'furniture'],
    ['23', 'Industry: Retail', 'retail'],
    ['24', 'Industry: Book Publishing', 'publishing'],
    ['25', 'Industry: Gambling', 'gambling'],
    ['26', 'Sector: Manufacturing', 'manufacturing'],
    ['27', 'Government Size', 'govt'],
    ['28', 'Welfare', 'welfare'],
    ['29', 'Public Healthcare', 'healthcare'],
    ['30', 'Law Enforcement', 'police'],
    ['31', 'Business Subsidization', 'business'],
    ['32', 'Religiousness', 'devout'],
    ['33', 'Income Equality', 'equality'],
    ['34', 'Niceness', 'nice'],
    ['35', 'Rudeness', 'rude'],
    ['36', 'Intelligence', 'smart'],
    ['37', 'Ignorance', 'stupid'],
    ['38', 'Political Apathy', 'apathetic'],
    ['39', 'Health', 'healthy'],
    ['40', 'Cheerfulness', 'happy'],
    ['41', 'Weather', 'weather'],
    ['42', 'Compliance', 'lowcrime'],
    ['43', 'Safety', 'safe'],
    ['44', 'Lifespan', 'life'],
    ['45', 'Ideological Radicality', 'extreme'],
    ['46', 'Defense Forces', 'defense'],
    ['47', 'Pacifism', 'peace'],
    ['48', 'Economic Freedom', 'pro-market'],
    ['49', 'Taxation', 'hightax'],
    ['50', 'Freedom From Taxation', 'lowtax'],
    ['51', 'Corruption', 'corrupt'],
    ['52', 'Integrity', 'leastcorrupt'],
    ['53', 'Authoritarianism', 'authoritarian'],
    ['54', 'Youth Rebelliousness', 'rebelyouth'],
    ['55', 'Culture', 'culture'],
    ['56', 'Employment', 'employed'],
    ['57', 'Public Transport', 'publictransport'],
    ['58', 'Tourism', 'tourism'],
    ['59', 'Weaponization', 'armed'],
    ['60', 'Recreational Drug Use', 'drugs'],
    ['61', 'Obesity', 'fat'],
    ['62', 'Secularism', 'godforsaken'],
    ['63', 'Environmental Beauty', 'environment'],
    ['64', 'Charmlessness', 'avoided'],
    ['67', 'Averageness', 'average'],
    ['68', 'Human Development Index', 'hdi'],
    ['69', 'Primitiveness', 'primitive'],
    ['70', 'Scientific Advancement', 'advanced'],
    ['71', 'Inclusiveness', 'inclusive'],
    ['72', 'Average Income', 'income'],
    ['73', 'Average Income of Poor', 'poorincome'],
    ['74', 'Average Income of Rich', 'richincome'],
    ['75', 'Public Education', 'educated'],
    ['76', 'Economic Output', 'gdp'],
    ['77', 'Crime', 'crime'],
    ['78', 'Foreign Aid', 'aid'],
    ['79', 'Black Market', 'blackmarket'],
    ['85', 'Average Disposable Income', 'dispincome'],
    ['87', 'Patriotism', 'patriotism'],
    ['88', 'Food Quality', 'foodquality']
  ];
  async function getBadgeMap(nation) {
    const ranks = await fetch(`https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=census;scale=all;mode=prank`, {
      headers: {
        'User-Agent': `${nation}`
      }
    });
    const ranksAsText = await ranks.text();
    const parser = new DOMParser();
    const document = parser.parseFromString(ranksAsText, 'text/xml');
    const scaleElements = document.querySelectorAll('SCALE');
    const scales = [];
    scaleElements.forEach((scaleElement) => {
      const id = scaleElement.getAttribute('id');
      const prank = scaleElement.querySelector('PRANK').textContent;
      const censusEntry = census.find(item => item[0] === id);
      if (censusEntry) {
        const scaleName = censusEntry[1];
        const scaleType = censusEntry[2];
        if (scaleName && scaleType) {
          scales.push({
            id: scaleName,
            type: scaleType,
            prank: prank
          });
        }
      }
    });
    const map = scales.reduce((acc, category) => {
      const rank = category.prank;
      let img = "";
      if (rank > 10) {
        img = `/images/trophies/${category.type}-100.png`;
      } else if (rank > 5) {
        img = `/images/trophies/${category.type}-10.png`;
      } else if (rank > 1) {
        img = `/images/trophies/${category.type}-5.png`;
      } else {
        img = `/images/trophies/${category.type}-1.png`;
      }
      acc[category.id] = img;
      return acc;
    }, {});
    return map;
  }

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

  const checkboxes = document.createElement('div');

  const buttonLabels = ["Filter Categories", "Toggle All", "Regenerate Badges", "Toggle One Percent", "Toggle Five Percent", "Toggle Ten Percent", "Toggle Unranked"];

  const [toggleButton, toggleCheckStatus, gatherBadges, toggleOnePercent, toggleFivePercent, toggleTenPercent, toggleUnranked] = buttonLabels.map((label) => {
    const button = document.createElement("button");
    button.textContent = label;
    return button;
  });

  const hide = [checkboxes, toggleCheckStatus, gatherBadges, toggleOnePercent, toggleFivePercent, toggleTenPercent, toggleUnranked];
  hide.forEach(element => element.classList.add('hidden'));

  toggleButton.addEventListener('click', () => {
    checkboxes.classList.toggle('checkbox');
    hide.forEach((element) => {
      element.classList.toggle('hidden');
    });
  });
  
  gatherBadges.addEventListener('click', () => {
    let badges = JSON.parse(localStorage.getItem('badges') || '{}');
    delete badges[nation];
    localStorage.setItem('badges', JSON.stringify(badges));
    location.reload();
  });

  const getEffectContent = (numero) => {
    if (numero.includes('(')) {
      numero = numero.slice(0, numero.indexOf('('));
    }
    for (let i = numero.length - 1; i >= 0; i--) {
      const char = numero.charAt(i);
      if (!isNaN(Number(char)) && char !== ' ') {
        numero = numero.slice(i + 2);
        return numero.trim();
      }
    }
  };

  function figureOutCheckStatus() {
    const checkboxers = checkboxes.getElementsByTagName('input');
    const uncheckedCheckboxes = Array.from(checkboxers).filter(cb => cb.checked);
    const uncheckedValues = Array.from(uncheckedCheckboxes, cb => cb.name);

    let currUncheckedObj = JSON.parse(localStorage.getItem('uncheckedValues')) || {};
    currUncheckedObj[nation] = uncheckedValues;

    localStorage.setItem('uncheckedValues', JSON.stringify(currUncheckedObj));

    Array.from(filterSpot.querySelectorAll('.effect-selector')).forEach(effect => {
      effect.classList.toggle('effect', currUncheckedObj[nation].some(value => {
        return getEffectContent(effect.textContent) === value;
      }));
    });
  }

  census.forEach(badge => {
    const cbDiv = document.createElement('div');
    const cb = document.createElement('input');
    cb.type = "checkbox";
    cb.id = cb.name = badge[1];
    cb.checked = shownValues[nation] && shownValues[nation].includes(badge[1]);
    cb.addEventListener('click', figureOutCheckStatus);
    const label = document.createElement('label');
    label.textContent = badge[1];
    label.setAttribute('for', badge[1]);
    cbDiv.append(cb, label);
    checkboxes.appendChild(cbDiv);
  });

  toggleCheckStatus.addEventListener('click', () => {
    const checkboxList = checkboxes.querySelectorAll('input[type="checkbox"]');
    const areAllChecked = Array.from(checkboxList).every(checkbox => checkbox.checked);

    checkboxList.forEach(checkbox => {
      checkbox.checked = !areAllChecked;
    });
    figureOutCheckStatus();
  });

  toggleOnePercent.addEventListener('click', () => toggleBadgeCheckboxes('-1.png'));
  toggleFivePercent.addEventListener('click', () => toggleBadgeCheckboxes('-5.png'));
  toggleTenPercent.addEventListener('click', () => toggleBadgeCheckboxes('-10.png'));
  toggleUnranked.addEventListener('click', () => toggleBadgeCheckboxes('-100.png'));

  filterSpot.prepend(toggleButton, toggleCheckStatus, gatherBadges, checkboxes, toggleOnePercent, toggleFivePercent, toggleTenPercent, toggleUnranked);

  const choicesObject = Array.from(choices).map(choice => choice.textContent.trim());

  const range = jsonRanges.find(range => {
    const [start, end] = range.split('-');
    return Number(id) >= Number(start) && Number(id) <= Number(end);
  });

  const getSubList = await fetch(`https://raw.githubusercontent.com/Kractero/issue-stats/master/json/${range}.json`);
  const issueSubList = await getSubList.json();
  const correspondIdx = Object.keys(issueSubList).filter(issue => issue === id);
  const issue = issueSubList[Number(correspondIdx)];
  const selections = Object.keys(issue.options).map(choice => issue.options[choice].text);
  const bestMatchArray = choicesObject.map((option) => {
    option = option.replace(/“|”/g, '"');
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
    };
  });

  let badges = JSON.parse(localStorage.getItem('badges') || '{}');
  if (!badges[nation] || badges[nation] === {}) {
    badges[nation] = await getBadgeMap(nation);
    localStorage.setItem('badges', JSON.stringify(badges));
  }

  function toggleBadgeCheckboxes(suffix) {
    let badges = JSON.parse(localStorage.getItem('badges') || '{}');
    if (badges[nation]) {
      const matchingKeys = Object.keys(badges[nation]).filter(key => badges[nation][key].endsWith(suffix));
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
      let split = issue.options[String(option.idx + 1)].results.split('\n');
      return split.map((effect) => {
        const effectContent = getEffectContent(effect);
        const censusEntry = Object.keys(badges[nation]).find(item => item === effectContent);
        if (censusEntry) {
          return [effectContent, badges[nation][effectContent], effect];
        }
      }).filter(item => item);
    }
  }).filter(json => json).map(subArray => {
    if (subArray) {
      return subArray.sort((a, b) => {
        const regex = /-(\d+)\.png$/;
        const aValue = parseInt(a[1].match(regex)[1]);
        const bValue = parseInt(b[1].match(regex)[1]);
        return aValue - bValue;
      });
    }
    return null;
  });

  const approves = document.querySelectorAll('.diloptions li');

  approves.forEach((option, index) => {
    const fatherDiv = document.createElement('div');
    fatherDiv.classList.add('effect-div');
    const goodDiv = document.createElement('div');
    const badDiv = document.createElement('div');

    let showValues = localStorage.getItem('uncheckedValues');

    if (json[index]) {
      json[index].forEach((item) => {
        const [effect, imageUrl, actual] = item;
        const effectDiv = document.createElement('div');
        const average = document.createElement('p');
        average.textContent = actual;
        average.style.margin = "0";

        const meanValue = actual.includes('mean') ? actual.split('mean')[1].trim() : actual.split(' ')[0];
        const isNegative = meanValue.startsWith('-');

        const image = document.createElement('img');
        image.src = imageUrl;

        effectDiv.append(image, average);
        effectDiv.classList.add('effect-selector', 'hidden');
        effectDiv.style.color = isNegative ? 'red' : 'green';
        isNegative ? badDiv.appendChild(effectDiv) : goodDiv.appendChild(effectDiv);

        if (showValues && JSON.parse(showValues)[nation]) {
          const shownValues = JSON.parse(showValues)[nation];
          effectDiv.classList.toggle('effect', shownValues.some(value => value === effect));
        }
      });
    } else {
      const probableBug = document.createElement('p');
      probableBug.textContent = "No census effects in the JSON, probable bug!";
      probableBug.style.margin = "0";
      badDiv.appendChild(probableBug);
    }
    fatherDiv.append(goodDiv, badDiv);
    option.appendChild(fatherDiv);
  });

})();
