// ==UserScript==
// @name         Issue Stat Getter
// @version      3.0
// @description  Get issues results shown to you.
// @author       Kractero
// @match        https://*.nationstates.net/page=show_dilemma/dilemma=*
// @downloadURL  https://raw.githubusercontent.com/Kractero/issue-stats/main/issueStatGetter.user.js
// @updateURL    https://raw.githubusercontent.com/Kractero/issue-stats/main/issueStatGetter.user.js
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// ==/UserScript==

function levenshteinDistance(str1, str2) {
  const m = str1.length
  const n = str2.length
  const matrix = []
  for (let i = 0; i <= m; i++) {
    matrix[i] = [i]
  }
  for (let j = 1; j <= n; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1], matrix[i][j - 1], matrix[i - 1][j]) + 1
      }
    }
  }
  return 1 - matrix[m][n] / Math.max(m, n)
}

;(async function () {
  'use strict'

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
    ['88', 'Food Quality', 'foodquality'],
  ]
  async function getBadgeMap(nation) {
    const ranks = await fetch(
      `https://www.nationstates.net/cgi-bin/api.cgi?nation=${nation}&q=census;scale=all;mode=prank&userAgent=${nation} using Issue Stat Getter by Kractero`,
      {
        headers: {
          'User-Agent': `${nation}`,
        },
      }
    )
    const ranksAsText = await ranks.text()
    const parser = new DOMParser()
    const document = parser.parseFromString(ranksAsText, 'text/xml')
    const scaleElements = document.querySelectorAll('SCALE')
    const map = Array.from(scaleElements).reduce((acc, scaleElement) => {
      const id = scaleElement.getAttribute('id')
      const prank = parseInt(scaleElement.querySelector('PRANK').textContent)
      const censusEntry = census.find(item => Number(item[0]) === Number(id))
      if (censusEntry && !isNaN(prank)) {
        const [scaleName, scaleType] = censusEntry.slice(1)
        let img = `/images/trophies/${scaleType}-1.png`
        if (prank > 1) img = `/images/trophies/${scaleType}-5.png`
        if (prank > 5) img = `/images/trophies/${scaleType}-10.png`
        if (prank > 10) img = `/images/trophies/${scaleType}-100.png`
        acc[scaleName] = img
      }
      return acc
    }, {})
    return map
  }

  let stylesheet = document.createElement('style')
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
    `
  document.getElementsByTagName('head')[0].appendChild(stylesheet)

  // const eggs = ['77', '78', '80', '215', '223', '256', '266', '375', '408', '430', '471', '622', '1122', '1549']

  const nation = document.querySelector('.bannernation2')
    ? document.querySelector('.bannernation2').innerText
    : document.querySelector('#loggedin').getAttribute('data-nname')
  const choices = document.querySelectorAll('.diloptions li p:first-child')
  const filterSpot = document.querySelector('.dilemma')
  const shownValues = await GM.getValue('uncheckedValues', {})
  const showPolicies = await GM.getValue('showPolicies', true)
  const showNotabilities = await GM.getValue('showNotabilities', true)
  const checkboxes = document.createElement('div')
  const buttonLabels = [
    'Filter Categories',
    'Toggle All',
    'Regenerate Badges',
    'Hide Policies',
    'Hide Notabilities',
    'Toggle One Percent',
    'Toggle Five Percent',
    'Toggle Ten Percent',
    'Toggle Unranked',
  ]

  const [
    toggleButton,
    toggleCheckStatus,
    gatherBadges,
    hidePolicies,
    hideNotabilities,
    toggleOnePercent,
    toggleFivePercent,
    toggleTenPercent,
    toggleUnranked,
  ] = buttonLabels.map(label => {
    const button = document.createElement('button')
    button.textContent = label
    return button
  })

  const hide = [
    checkboxes,
    toggleCheckStatus,
    gatherBadges,
    hidePolicies,
    hideNotabilities,
    toggleOnePercent,
    toggleFivePercent,
    toggleTenPercent,
    toggleUnranked,
  ]
  hide.forEach(element => element.classList.add('hidden'))

  toggleButton.addEventListener('click', () => {
    checkboxes.classList.toggle('checkbox')
    hide.forEach(element => {
      element.classList.toggle('hidden')
    })
  })

  gatherBadges.addEventListener('click', async () => {
    let badges = await GM.getValue('badges', {})
    delete badges[nation]
    await GM.setValue('badges', badges)
    location.reload()
  })

  const getEffectContent = numero => {
    if (numero.includes('(')) {
      numero = numero.slice(0, numero.indexOf('('))
    }
    for (let i = numero.length - 1; i >= 0; i--) {
      const char = numero.charAt(i)
      if (!isNaN(Number(char)) && char !== ' ') {
        numero = numero.slice(i + 2)
        return numero.trim()
      }
    }
  }

  async function figureOutCheckStatus() {
    const checkboxers = checkboxes.getElementsByTagName('input')
    const uncheckedCheckboxes = Array.from(checkboxers).filter(cb => cb.checked)
    const uncheckedValues = Array.from(uncheckedCheckboxes, cb => cb.name)

    let currUncheckedObj = await GM.getValue('uncheckedValues', {})

    currUncheckedObj[nation] = uncheckedValues

    await GM.setValue('uncheckedValues', currUncheckedObj)

    Array.from(filterSpot.querySelectorAll('.effect-selector')).forEach(effect => {
      effect.classList.toggle(
        'effect',
        currUncheckedObj[nation].some(value => {
          return getEffectContent(effect.textContent) === value
        })
      )
    })
  }

  census.forEach(badge => {
    const cbDiv = document.createElement('div')
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.id = cb.name = badge[1]
    cb.checked = shownValues[nation] && shownValues[nation].includes(badge[1])
    cb.addEventListener('click', figureOutCheckStatus)
    const label = document.createElement('label')
    label.textContent = badge[1]
    label.setAttribute('for', badge[1])
    cbDiv.append(cb, label)
    checkboxes.appendChild(cbDiv)
  })

  toggleCheckStatus.addEventListener('click', () => {
    const checkboxList = checkboxes.querySelectorAll('input[type="checkbox"]')
    const areAllChecked = Array.from(checkboxList).every(checkbox => checkbox.checked)

    checkboxList.forEach(checkbox => {
      checkbox.checked = !areAllChecked
    })
    figureOutCheckStatus()
  })

  toggleOnePercent.addEventListener('click', () => toggleBadgeCheckboxes('-1.png'))
  toggleFivePercent.addEventListener('click', () => toggleBadgeCheckboxes('-5.png'))
  toggleTenPercent.addEventListener('click', () => toggleBadgeCheckboxes('-10.png'))
  toggleUnranked.addEventListener('click', () => toggleBadgeCheckboxes('-100.png'))

  filterSpot.prepend(
    toggleButton,
    toggleCheckStatus,
    gatherBadges,
    hidePolicies,
    hideNotabilities,
    checkboxes,
    toggleOnePercent,
    toggleFivePercent,
    toggleTenPercent,
    toggleUnranked
  )

  // if (eggs.includes(id)) {
  //   const header = document.createElement('h1')
  //   header.textContent = 'EASTER EGG'
  //   filterSpot.prepend(header)
  // }

  let badges = await GM.getValue('badges', {})
  if (!badges[nation] || Object.keys(badges[nation]).length === 0) {
    badges[nation] = await getBadgeMap(nation)
    await GM.setValue('badges', badges)
  }
  const choicesObject = Array.from(choices).map(choice => choice.textContent.trim())

  const num = parseInt(document.querySelector('.dpapervol').textContent.split(' ').at(-1).replace(',', ''))

  const getSubList = await fetch(`https://issues.kractero.com/issue/${num}`)
  const issue = await getSubList.json()
  const bestMatchArray = choicesObject.map(option => {
    option = option.replace(/“|”/g, '"')
    let bestMatchNum = 0
    let bestScore = 0

    issue.options.forEach((choice, i) => {
      const score = levenshteinDistance(option, choice.text)
      if (score > bestScore) {
        bestScore = score
        bestMatchNum = i
      }
    })

    issue.options[bestMatchNum].choiceEffects.forEach(item => {
      const imageUrl = badges[nation][item.stat]
      item.image = imageUrl
    })

    issue.options[bestMatchNum].choiceEffects.sort((a, b) => {
      let aValue = a
      if (aValue.image) {
        aValue = parseInt(a.image.match(/-(\d+)\.png$/)[1])
        if (b.image) {
          const bValue = parseInt(b.image.match(/-(\d+)\.png$/)[1])
          return aValue - bValue
        }
      }
      return aValue
    })

    return {
      ...issue.options[bestMatchNum],
      idx: bestMatchNum,
    }
  })

  async function toggleBadgeCheckboxes(suffix) {
    let badges = await GM.getValue('badges', {})
    if (badges[nation]) {
      const matchingKeys = Object.keys(badges[nation]).filter(key => badges[nation][key].endsWith(suffix))
      const checkboxList = checkboxes.querySelectorAll('input[type="checkbox"]')
      checkboxList.forEach(checkbox => {
        const checkboxId = checkbox.id
        const checkboxName = checkbox.name
        if (matchingKeys.includes(checkboxId) || matchingKeys.includes(checkboxName)) {
          checkbox.checked = !checkbox.checked
        }
      })
    }
    figureOutCheckStatus()
  }

  const approves = document.querySelectorAll('.diloptions li')

  for (let i = 0; i < approves.length; i++) {
    const fatherDiv = document.createElement('div')
    const policyDiv = document.createElement('div')

    fatherDiv.classList.add('effect-div')
    if (!bestMatchArray[i]) {
      const probableBug = document.createElement('p')
      probableBug.textContent = 'No census effects in the JSON, probable bug!'
      probableBug.style.margin = '0'
      badDiv.appendChild(probableBug)
    }

    bestMatchArray[i].policiesAndNotabilities.map(policies => {
      const policy = document.createElement('p')
      policy.textContent = policies.full

      const type = policies.type
      policy.classList.add(type)

      if (type === 'policy' && showPolicies === false) {
        policy.classList.add('hidden')
      }

      if (type === 'notability' && showNotabilities === false) {
        policy.classList.add('hidden')
      }
      policyDiv.append(policy)
    })

    bestMatchArray[i].leadsTo.map(lead => {
      const policy = document.createElement('p')
      policy.textContent = `Leads to #${lead}`
      policyDiv.append(policy)
    })

    const goodDiv = document.createElement('div')
    const badDiv = document.createElement('div')

    let showValues = await GM.getValue('uncheckedValues', null)

    bestMatchArray[i].choiceEffects.forEach(item => {
      const effectDiv = document.createElement('div')
      const average = document.createElement('p')
      average.textContent = `${item.min} to ${item.max > 0 ? `+${item.max}` : item.max} ${item.stat} ${
        item.mean ? `(mean ${item.mean > 0 ? `+${item.mean}` : item.mean})` : ''
      }`
      average.style.margin = '0'

      const image = document.createElement('img')
      image.src = item.image

      effectDiv.append(image, average)
      effectDiv.classList.add('effect-selector', 'hidden')
      effectDiv.style.color = item.mean < 0 ? 'red' : 'green'
      item.mean < 0 ? badDiv.appendChild(effectDiv) : goodDiv.appendChild(effectDiv)

      if (showValues && showValues[nation]) {
        const shownValues = showValues[nation]
        effectDiv.classList.toggle(
          'effect',
          shownValues.some(value => value === item.stat)
        )
      }
    })
    fatherDiv.append(goodDiv, badDiv)
    approves[i].appendChild(policyDiv)
    approves[i].appendChild(fatherDiv)
  }

  hidePolicies.addEventListener('click', async () => {
    Array.from(document.querySelectorAll('.policy')).forEach(policy => {
      policy.classList.toggle('hidden')
    })
    await GM.setValue('showPolicies', !showPolicies)
  })

  hideNotabilities.addEventListener('click', async () => {
    Array.from(document.querySelectorAll('.notability')).forEach(policy => {
      policy.classList.toggle('hidden')
    })
    await GM.setValue('showNotabilities', !showNotabilities)
  })
})()
