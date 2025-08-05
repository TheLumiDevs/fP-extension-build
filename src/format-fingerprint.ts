import fs from 'fs';

const input = fs.readFileSync(0, 'utf-8').trim();
const fingerprint = input.split('=').pop() || '';
const formatted = fingerprint.match(/.{1,2}/g)?.join(':').toUpperCase() || '';
console.log(formatted);