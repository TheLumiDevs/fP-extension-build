function getRandomColor(): number {
  // Return a random integer between 0 and 16777215 (0xFFFFFF)
  return Math.floor(Math.random() * 16777216);
}

console.log(getRandomColor());