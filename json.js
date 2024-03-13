import { readFileSync, writeFileSync } from "fs";
import { parse } from "node-html-parser";

const BASE_REPO_URL = "https://raw.githubusercontent.com/Clarissa-Valentine-Z/NationStates-Issue-Megathread/master/002%20-%20Issue%20Megalist%20(MAIN)/"
const EFFECTS_URL = "http://www.mwq.dds.nl/ns/results/"

const filenames = readFileSync("repo_files.txt", "utf-8").split('\n')

let issuesJson = []

for (let filename of filenames) {
    const res = await fetch(`${BASE_REPO_URL}${filename}`)
    const text = await res.text();
    const textWithoutCarriageReturn = text.split('\r').join('');
    const issues = textWithoutCarriageReturn.split(/\n-{4,}\n/);


    for (let i = 0 ; i < issues.length; i++) {
        const splitIssue = issues[i].split('\n')
        const title = splitIssue[0].slice(splitIssue[0].indexOf(": ")+2, splitIssue[0].indexOf('[/b]'))
        const authorEditor = title.includes('[') ? title.slice(title.indexOf('[')) : "Max Barry";
        const interim = splitIssue[0].slice(0, splitIssue[0].lastIndexOf('[/anchor'))
        const issueNum = interim.slice(interim.lastIndexOf(']')+1)
        const debateIndex = splitIssue.indexOf('The Debate');
        const debatePortion = splitIssue.slice(debateIndex + 1).filter(str => str.trim() !== '');
    
        const issueObject = {
            title: title,
            authorEditor: authorEditor,
            number: issueNum,
            options: []
        }
        debatePortion.forEach(option => {
            issueObject.options.push({
                "text": option.slice(option.indexOf('. ')+2)
            })
        })
    
        const resEffects = await fetch(`${EFFECTS_URL}${issueNum}.html`) 
        const effectsText = await resEffects.text()
        const document = parse(effectsText)
        const effectLines = document.querySelectorAll('tr td:first-child')
        const results = document.querySelectorAll('tr td:nth-child(2)')

        Array.from(results).forEach((item, i) => {
            const resultFmt = item.textContent.split('\n').filter(res => res);
            const choiceEffects = []
            const policiesAndNotabilities = []
            resultFmt.forEach(result => {
                if (result.includes('policy') || result.includes('notability')) {
                    policiesAndNotabilities.push({
                        type: result.includes('policy') ? "policy" : "notability",
                        name: result.split(': ')[1],
                        qualifier: result.includes('sometimes') ? "sometimes" : "definitive",
                        behavior: result.includes('removes') ? "removes" : "adds"
                    });
                } else {
                    let effects = {
                        min: 0,
                        max: 0,
                        mean: 0,
                        stat: ""
                    }
                    let [range, mean] = result.split(' (')
                    if (!range.includes('to')) {
                        let [effect, stat] = range.split(' ')
                        effects.max = Number(effect.trim().replace('+', ''))
                        effects.stat = stat.trim()
                    } else {
                        let [min, maxAndStat] = range.split('to')
                        effects.min = Number(min.trim().replace('+', ''))
                        let [max, ...stat] = maxAndStat.trim().split(' ')
                        effects.max = Number(max.trim().replace('+', ''))
                        effects.mean = Number(mean.replace('mean ', '').replace(')', '').replace('+', ''))
                        effects.min = min,
                        effects.stat = stat.join(' ')
                    }
                    choiceEffects.push(effects)
                }
                issueObject.options[i].policiesAndNotabilities = policiesAndNotabilities
                issueObject.options[i].choiceEffects = choiceEffects
            })
        });
        issuesJson.push(issueObject)
    }
}

writeFileSync('issues.json', JSON.stringify(issuesJson))