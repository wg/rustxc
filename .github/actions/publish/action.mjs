import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { output } from './output.mjs';

async function publish(stream, endpoint, token, retries) {
    let hash = createHash('SHA256');
    let digest = new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(chunk);
            hash.update(chunk);
        }
    });

    let gzip = new CompressionStream('gzip');
    let pipe = stream().pipeThrough(digest).pipeThrough(gzip);

    let response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body:   pipe,
        duplex: 'half',
        signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
        if (retries == 0 || response.status == 401) {
            let status  = response.status;
            let message = response.statusText;
            let cause   = { status };
            throw new Error(message, { cause });
        }
        return await publish(stream, endpoint, token, retries - 1);
    }

    let result = await response.json();

    let computed = hash.digest('hex');
    let received = result.sha256;

    if (computed != received) {
        let cause = { computed, received };
        throw new Error("checksum mismatch", { cause });
    }

    return result;
}

let source = process.env.source || process.env.GITHUB_REPOSITORY;
let commit = process.env.commit || process.env.GITHUB_SHA;
let output = process.env.output;
let origin = process.env.origin;
let token  = process.env.token;
let store  = process.env.store  || "https://asset-store.quxx.workers.dev";

let path = `github/${source}!${commit}!${output}`;
let location = new URL(path, store);

let result = await publish(() => {
    let options = { highWaterMark: 64 * 1024 };
    let reader  = createReadStream(origin, options);
    return Readable.toWeb(reader);
}, location, token, 3);

await output({
    digest: result.sha256,
    location: location,
}, process.env.GITHUB_OUTPUT);
