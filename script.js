// Function to convert timestamp to human-readable format
function formatTimestamp(timestamp) {
  if (timestamp && timestamp.trim() !== '') {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } else {
    return '???';
  }
}

// Load quotes from quotes.json
fetch('quotes.json')
.then(response => response.json())
.then(quotes => {
  const quotesBody = document.getElementById('quotesBody');

  quotes.forEach((quote, index) => { // Added index parameter
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td> <!-- Added index number -->
      <td>${quote.quote}</td>
      <td>${quote.author}</td>
      <td>${formatTimestamp(quote.timestamp)}</td>
    `;
    quotesBody.appendChild(row);
  });
})
.catch(error => {
  console.error('Error loading quotes:', error);
});
