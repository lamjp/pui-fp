// Section imports ID and secret and uses them to produce an access token for this user session that expires in 
import { clientId, clientSecret } from './keys.js';

// get authorization token from Spotify
async function getSpotifyToken() {
  const url = 'https://accounts.spotify.com/api/token';
  const credentials = `${clientId}:${clientSecret}`;
  const base64Credentials = btoa(credentials);

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Authorization': 'Basic ' + base64Credentials,
              'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
          throw new Error(`Request failed! Status code: ${response.status} ${response.statusText}`);
      }

      const jsonResponse = await response.json();
      return jsonResponse;
  } catch (error) {
      console.error('Error fetching Spotify token:', error);
      throw error;
  }
}

getSpotifyToken();

// user entry functions
function addSliderEventListener(sliderId) {
  const slider = document.getElementById(sliderId);

  slider.addEventListener('mouseup', (event) => {
    const value = event.target.value;
    console.log(`${sliderId} value: ${value}`);
  });
}

function addGenreEntryEventListener() {
  const genresInput = document.getElementById('genres');

  genresInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      const value = genresInput.value;
      console.log(`Selected genre: ${value}`);

      alert(`Genre set to: ${value}`)
    }
  });
}

function addTextEntryEventListener() {
  const textEntryInput = document.getElementById('text-entry');

  textEntryInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();

      let value = textEntryInput.value;
      console.log(`length value: ${value}`);
      if (value > 50){
        value = 20;
        alert('Please don\'t input a value above 50');
      } else if (value < 1){
        value = 20;
        alert('Please don\'t input a value below 1');
      } else {
      // Show an alert to the user
      alert(`Playlist length set to: ${value}`);
      }
    }
  });
}

// Populate dropdown and update it
fetch('./js/suggestions.json')
  .then(response => response.json())
  .then(data => {
    const genres = data.genres;

    // Get the input and dropdown elements
    const genreInput = document.getElementById('genres');
    const genreDropdown = document.getElementById('genre-dropdown');

    // Add an input event listener to the genre field
    genreInput.addEventListener('input', function () {
      const inputValue = genreInput.value.toLowerCase();

      // Filter genres based on input value
      const filteredGenres = genres.filter(genre =>
        genre.toLowerCase().includes(inputValue)
      );

      // Limit the dropdown to 10 entries
      const maxGenreDropItems = 15;
      const slicedGenres = filteredGenres.slice(0, maxGenreDropItems);

      // Clear the dropdown
      genreDropdown.innerHTML = '';

      // Populate the dropdown with filtered genres
      slicedGenres.forEach(genre => {
        const listItem = document.createElement('li');
        listItem.className = 'dropdown-item';
        listItem.textContent = genre;
        listItem.addEventListener('click', function () {
          genreInput.value = genre;
          console.log(`Selected genre: ${genre}`);
          alert(`Genre set to: ${genre}`);
          genreDropdown.innerHTML = ''; // Clear the dropdown after selection
        });
        genreDropdown.appendChild(listItem);
      });
    });

    // Close the dropdown when clicking outside of it
    window.addEventListener('click', function (event) {
      if (!event.target.matches('#genres')) {
        genreDropdown.innerHTML = '';
      }
    });
  })
  .catch(error => console.error('Error fetching genres:', error));

// Function to build the Spotify API request URL based on user input
function buildSpotifyRequestURL() {
  // Extract values from sliders and inputs
  const acousticValue = document.getElementById('acoustic').value;
  const danceValue = document.getElementById('dance').value;
  const energyValue = document.getElementById('energy').value;
  const instrumentValue = document.getElementById('instrument').value;
  const liveValue = document.getElementById('live').value;
  const speechValue = document.getElementById('speech').value;
  const popularityValue = document.getElementById('popularity').value;
  const valenceValue = document.getElementById('valence').value;
  let playlistLengthValue = document.getElementById('text-entry').value || 20; // Default to 20 if not provided
  if (playlistLengthValue > 50 || playlistLengthValue < 1){
    playlistLengthValue = 20;
    console.log(`length-value invalid, reset to: ` + playlistLengthValue);
  }
  // Extract the selected genre
  const selectedGenre = document.getElementById('genres').value;

  // Spotify API endpoint for recommendations
  const spotifyAPIEndpoint = 'https://api.spotify.com/v1/recommendations';

  // Build the query parameters
  const queryParams = new URLSearchParams({
    seed_genres: selectedGenre,
    target_acousticness: acousticValue,
    target_danceability: danceValue,
    target_energy: energyValue,
    target_instrumentalness: instrumentValue,
    target_liveness: liveValue,
    target_speechiness: speechValue,
    target_popularity: popularityValue,
    target_valence: valenceValue,
    limit: playlistLengthValue,
  });

  // Construct the final Spotify API request URL
  const spotifyRequestURL = `${spotifyAPIEndpoint}?${queryParams.toString()}`;

  return spotifyRequestURL;
}

// event listener and function that builds the API recommendations request and sends it
document.querySelector('form').addEventListener('submit', async function (event) {
  event.preventDefault(); // Prevent the default form submission

  try {
    // Check if the genre is filled
    const selectedGenre = document.getElementById('genres').value;
    if (!selectedGenre) {
      throw new Error('Please select a genre before generating recommendations.');
    }

    // Fetch the Spotify token
    const tokenResponse = await getSpotifyToken();

    // Check if the tokenResponse has the expected properties
    if (!tokenResponse || !tokenResponse.access_token) {
      throw new Error('Invalid token response');
    }

    // Use the token to make a request to the Spotify API
    const accessToken = tokenResponse.access_token;

    // Build the Spotify API request URL
    const spotifyRequestURL = buildSpotifyRequestURL();

    // Make the actual request using fetch
    const response = await fetch(spotifyRequestURL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // Check if the request was successful (status code 200)
    if (!response.ok) {
      throw new Error(`Request failed! Status code: ${response.status} ${response.statusText}`);
    }

    // Parse the response JSON
    const responseData = await response.json();

    // Display the recommendations in a popup
    displayRecommendationsPopup(responseData);

    // Perform any additional actions or handle the response as needed
  } catch (error) {
    console.error('Error processing form submission:', error);
    alert(error.message); // Display an alert with the error message
  }
});

// Function to display recommendations in a popup
let isPopupOpen = false;

function displayRecommendationsPopup(data) {
  // Check if a popup is already open
  if (isPopupOpen) {
    console.warn('Close the existing popup before generating a new one.');
    alert('Close the existing list before generating a new one.'); // Display an alert with the warning
    return;
  }

  // Set the flag to indicate that a popup is now open
  isPopupOpen = true;

  // Create a popup container
  const popupContainer = document.createElement('div');
  popupContainer.className = 'popup-container';

  // Create an h3 element for the title
  const titleElement = document.createElement('h2');
  titleElement.textContent = "Here's your list of recommendations!";

  // Append the title to the popup container
  popupContainer.appendChild(titleElement);

  // Create a close button for the popup
  const closeButton = document.createElement('button');
  closeButton.innerHTML = 'Close';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(popupContainer);
    // Reset the flag when the popup is closed
    isPopupOpen = false;
  });

  // Loop through the recommendations and add them to the popup
  data.tracks.forEach((track, index) => {
    const recommendationItem = document.createElement('div');
    recommendationItem.className = 'recommendation-item';
    recommendationItem.innerHTML = `<p>${index + 1}. ${track.name} by ${track.artists[0].name}</p>`;
    popupContainer.appendChild(recommendationItem);
  });

  // Add the close button to the popup
  popupContainer.appendChild(closeButton);

  // Add the popup container to the body
  document.body.appendChild(popupContainer);
}

window.addEventListener('load', (event) => {
  // call function to add for genre
  addGenreEntryEventListener();
  // Add event listeners for each slider
  addSliderEventListener('acoustic');
  addSliderEventListener('dance');
  addSliderEventListener('energy');
  addSliderEventListener('instrument');
  addSliderEventListener('live');
  addSliderEventListener('speech');
  addSliderEventListener('popularity');
  addSliderEventListener('valence');
  // Call the function to add for length
  addTextEntryEventListener();
});
