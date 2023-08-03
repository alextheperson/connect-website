document.getElementById('width').addEventListener('input', () => {
  document.getElementById('numberToConnect').max = Math.max(
    document.getElementById('width').value,
    document.getElementById('height').value
  );
});

document.getElementById('height').addEventListener('input', () => {
  document.getElementById('numberToConnect').max = Math.max(
    document.getElementById('width').value,
    document.getElementById('height').value
  );
});
