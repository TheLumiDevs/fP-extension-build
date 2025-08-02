function getRandomColor(): number {
  return Math.floor(Math.random() * 16777215);
}

console.log(JSON.stringify({ embeds: [{ color: getRandomColor() }] }));