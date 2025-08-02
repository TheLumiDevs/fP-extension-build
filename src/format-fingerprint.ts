import fs from 'fs';

const input = fs.readFileSync(0, 'utf-8').trim();
const formatted = input.match(/.{1,2}/g)?.join(':') || '';
console.log(formatted);