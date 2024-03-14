import { readdirSync, readFileSync } from "fs";

function findOptionsWithMissingFields(issue) {
    const missingOptions = [];
    issue.options.forEach((option, index) => {
        if (!option.text || !option.result) {
            missingOptions.push({ issueNumber: issue.number, optionIndex: index + 1, missing: !option.text ? "text" : "result" });
        }
    });
    return missingOptions;
}

const jsonFiles = readdirSync("issues").filter((file) => file.endsWith(".json"));

const allMissingOptions = [];

jsonFiles.forEach((file) => {
    const filePath = `issues/${file}`;
    const jsonData = readFileSync(filePath, "utf-8");
    const issue = JSON.parse(jsonData);
    const missingOptions = findOptionsWithMissingFields(issue);
    allMissingOptions.push(...missingOptions);
});

if (allMissingOptions.length > 0) {
    console.log("Options with missing text or result field:");
    allMissingOptions.sort((a, b) => parseInt(a.issueNumber) - parseInt(b.issueNumber)).forEach((option) => {
      console.log(`Issue: ${option.issueNumber}, Option: ${option.optionIndex}, Missing: ${option.missing}`);
  });
} else {
    console.log("No options with missing text or result field found.");
}
