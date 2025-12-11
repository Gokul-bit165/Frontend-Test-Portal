
const html = `
<!DOCTYPE html>
<html>
<body>
  <img src="/test.png" alt="Test">
  <img src="images/banner.jpg">
  <div style="background-url: url('bg.webp')"></div>
  <img src = " spaced.png ">
</body>
</html>
`;

const regex = /(?:src=["']|url\(["']?)([^"')]+\.(?:png|jpg|jpeg|gif|svg|webp))["')]/gi;
const matches = [...html.matchAll(regex)];

console.log('--- Regex Test ---');
console.log('HTML:', html);
matches.forEach(m => {
    console.log('Match:', m[1]);
});
console.log('Total extracted:', matches.length);
