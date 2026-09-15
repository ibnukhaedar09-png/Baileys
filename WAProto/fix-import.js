const { readFileSync, writeFileSync } = require('fs');
const { exit } = require('process');

const FILE = './index.js';

try {
    let content = readFileSync(FILE, 'utf8');

    content = content
        .replace(
            /import \* as (\$protobuf) from/g,
            'import $1 from'
        )
        .replace(
            /(['"])protobufjs\/minimal(['"])/g,
            '$1protobufjs/minimal.js$2'
        );

    writeFileSync(FILE, content, 'utf8');

    console.log(`
╔════════════════════════╗
║        ✅ IMPORTS PATCHED            ║
╠════════════════════════╣
║ File   : ${FILE.padEnd(26)}║
║ Status : Success                    ║
╚════════════════════════╝
`);
} catch (err) {
    console.error(`
╔════════════════════════╗
║        ❌ PATCH FAILED
╠════════════════════════╣
║ ${err.message}
╚════════════════════════╝
`);
    exit(1);
}