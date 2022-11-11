import { execSync } from 'node:child_process';
import { appendFileSync } from 'node:fs'
import process from 'node:process';

let target   = process.argv[2] ?? "";
let output   = process.env.GITHUB_OUTPUT;

let result   = execSync("cargo metadata --no-deps --format-version 1");
let metadata = JSON.parse(result);

for (let { name, kind } of metadata.packages[0]?.targets) {
    if (kind.includes("bin")) {
        let extension  = target.includes("windows") ? ".exe" : "";
        let artifact   = `${name}-${target}${extension}`;
        let executable = `${name}${extension}`;

        appendFileSync(process.env.GITHUB_OUTPUT, `artifact=${artifact}\n`);
        appendFileSync(process.env.GITHUB_OUTPUT, `executable=${executable}\n`);
    }
}
