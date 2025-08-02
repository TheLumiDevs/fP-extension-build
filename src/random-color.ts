function getRandomColor(): number {
  return Math.floor(Math.random() * 16777215);
}

console.log('0x' + getRandomColor().toString(16).padStart(6, '0'));