const fs = require('fs');
const files = ['messages/pt.json', 'messages/en.json', 'messages/es.json'];

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        JSON.parse(content);
        console.log(`${file} is valid JSON`);
    } catch (e) {
        console.error(`${file} is INVALID: ${e.message}`);
        // Find line number if possible
        const pos = e.message.match(/at position (\d+)/);
        if (pos) {
            const index = parseInt(pos[1]);
            const before = fs.readFileSync(file, 'utf8').substring(0, index);
            const lines = before.split('\n');
            console.error(`Error around line ${lines.length}`);
        }
    }
});
