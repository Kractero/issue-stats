import { readFileSync } from 'fs'
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
    const interim = splitIssue[0].slice(0, splitIssue[0].lastIndexOf('[/anchor'))
    const issueNum = interim.slice(interim.lastIndexOf(']') + 1).replace('#', '')
    const issue = readFileSync(`./issues/${issueNum}.json`, 'utf-8')
    const issueJson = JSON.parse(issue)

    allIssues.push({
      title: issueJson.title,
      number: issueJson.number,
      options: issueJson.options,
    })
    console.log(`Done ${issueNum}`)
  }
}

const insertMany = db.transaction(allIssues => {
  for (const issue of allIssues) {
    const stringified = JSON.stringify(issue.options, null, 2)
    upsertStmt.run(issue.number, issue.title, stringified)
    console.log(`Saved ${issue.title} to DB`)
  }
})

insertMany(allIssues)
