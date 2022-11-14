import { createWriteStream } from 'node:fs';
import { stdout } from 'node:process';
import { Writable } from 'node:stream';

export async function output(outputs, path) {
    let create = () => createWriteStream(path, { flags: 'a' });
    let stream = Writable.toWeb(path ? create() : stdout);

    let data = Object.entries(outputs).flatMap(([name, value]) => (
        value ? [name, value].join('=') : []
    )).join('\n');

    await stream.getWriter().write(data + '\n');
}
