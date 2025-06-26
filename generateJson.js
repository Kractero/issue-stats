import { readFileSync } from 'fs'
import { parse } from 'node-html-parser'
import Database from 'better-sqlite3'

const db = new Database('./issues.db')

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS issues (
    issue_number INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    choice_effects TEXT NOT NULL
  )
`
).run()

const upsertStmt = db.prepare(`
  INSERT INTO issues (issue_number, title, choice_effects) VALUES (?, ?, ?)
  ON CONFLICT(issue_number) DO UPDATE SET choice_effects=excluded.choice_effects
`)

const EFFECTS_URL = 'http://www.mwq.dds.nl/ns/results/'

const filenames = readFileSync('repo_files.txt', 'utf-8')
  .split('\n')
  .map(name => name.replace('\r', ''))

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const allIssues = []
for (let filename of filenames) {
  const file = readFileSync(`./issue-megalist/${filename}`, 'utf-8')
  const textWithoutCarriageReturn = file
    .split('\r')
    .join('')
    .trim()
    .replace(/”|’|“/g, match => {
      if (match === '”') return '"'
      if (match === '’') return "'"
      if (match === '“') return ''
      return match
    })
  const issues = textWithoutCarriageReturn.split(/\n-{4,}\s*\n/)
  for (let i = 0; i < issues.length; i++) {
    const splitIssue = issues[i].split('\n')
    let [title, authorEditor] = splitIssue[0]
      .slice(splitIssue[0].indexOf(': ') + 2, splitIssue[0].indexOf('[/b]'))
      .split(' [')
    const interim = splitIssue[0].slice(0, splitIssue[0].lastIndexOf('[/anchor'))
    const issueNum = interim.slice(interim.lastIndexOf(']') + 1).replace('#', '')
    const debateIndex = splitIssue.indexOf('The Debate')
    const debatePortion = splitIssue.slice(debateIndex + 1).filter(str => str.trim() !== '')

    const options = []
    debatePortion.forEach(option => {
      options.push({
        text: option.slice(option.indexOf('. ') + 2),
      })
    })

    const resEffects = await fetch(`${EFFECTS_URL}${issueNum}.html`)
    const effectsText = await resEffects.text()
    const document = parse(effectsText)
    const effectLines = document.querySelectorAll('tr td:first-child')
    const results = document.querySelectorAll('tr td:nth-child(2)')
    const points = Array.from(document.querySelectorAll('tr'))
      .map(tr => {
        const td = tr.querySelector('td:nth-child(3)')
        if (td) {
          const div = td.querySelector('div')
          return div ? div.innerHTML.trim() : null
        }
        return null
      })
      .filter(value => value !== null && !isNaN(value) && value !== '')

    Array.from(effectLines).forEach((line, i) => {
      const result = results[i]
      const value = line.textContent.split('. ')[1].trim()
      const numero = line.textContent.split('. ')[0].trim().split('/')
      const indices = numero.map(num => parseInt(num))
      indices.forEach(index => {
        const resultFmt = result.textContent.split('\n').filter(res => res)
        const choiceEffects = []
        const policiesAndNotabilities = []
        const leadsTo = []

        resultFmt.forEach(result => {
          if (result.includes('policy') || result.includes('notability')) {
            policiesAndNotabilities.push({
              full: result,
              qualifier: result.includes('sometimes') ? 'sometimes' : 'definitive',
              behavior: result.includes('removes') ? 'removes' : 'adds',
              type: result.includes('policy') ? 'policy' : 'notability',
              name: result.split(': ')[1],
            })
          } else if (result.includes('leads to')) {
            leadsTo.push(result.split('#')[1])
          } else {
            let effects = {
              min: 0,
              max: 0,
              mean: 0,
              stat: '',
            }
            let [range, mean] = result.split(' (')
            if (!range.includes(' to ')) {
              let [effect, ...stat] = range.split(' ')
              effects.max = Number(effect.trim().replace('+', ''))
              effects.stat = stat.join(' ')
              effects.mean = ''
            } else {
              let [min, maxAndStat] = range.split(' to ')
              effects.min = Number(min.trim().replace('+', ''))
              let [max, ...stat] = maxAndStat.trim().split(' ')
              effects.max = Number(max.trim().replace('+', ''))
              effects.mean = mean ? Number(mean.replace('mean ', '').replace(')', '').replace('+', '')) : ''
              effects.stat = stat.join(' ')
            }
            choiceEffects.push(effects)
          }
        })

        if (options[index - 1]) {
          options[index - 1].result = value
          options[index - 1].choiceEffects = choiceEffects
          options[index - 1].policiesAndNotabilities = policiesAndNotabilities
          options[index - 1].leadsTo = leadsTo
          options[index - 1].dataPoints = points[i]
        } else {
          options.push({
            result: value,
            choiceEffects: choiceEffects,
            policiesAndNotabilities: policiesAndNotabilities,
            leadsTo: leadsTo,
            dataPoints: points[i],
          })
        }
      })
    })

    allIssues.push({ issueNum, title, options })

    await sleep(1400)
    console.log(`Done fetching ${title} - ${issueNum} from mwq`)
  }
}

const insertMany = db.transaction(allIssues => {
  for (const issue of allIssues) {
    const stringified = JSON.stringify(issue.options, null, 2)
    upsertStmt.run(issue.issueNum, issue.title, stringified)
  }
})

insertMany(allIssues)
