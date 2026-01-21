# SF Airbnb Listings

CS5610 Web Development - JavaScript & DOM Self Assessment

## Live Demo

[https://kashish-219.github.io/airbnb-listings-sf/](https://kashish-219.github.io/airbnb-listings-sf/)

## About

This project loads and displays the first 50 Airbnb listings from San Francisco using JavaScript fetch/await. Built for the self-assessment assignment.

## Features

**Required stuff:**
- Loads 50 listings using AJAX (fetch + await)
- Shows listing name, description, amenities
- Shows host name and photo
- Shows price and thumbnail image

**Extra features I added:**
- Dark/light mode toggle (saves your preference)
- Favorites - click the heart to save listings you like
- Search bar to filter listings
- Sort by price, rating, or number of beds
- Filter by property type
- Price range slider
- Grid and list view options
- Click "View Details" to see full info in a popup
- Superhost badges for verified hosts

## How to Run Locally

You need to run a server because fetch doesn't work with file:// urls.

**Option 1 - Reload extension (used in class):**
- Install the Reload extension
- Run `Reload -b` to start http server of the current page
- Hard refresh with `Cmd + Shift + R` to clear cache if needed

**Option 2 - Python:**
```
cd airbnb_listings2
python3 -m http.server 8000
```
Then go to http://localhost:8000

**Option 3 - VS Code:**
Install Live Server extension, right click index.html and click "Open with Live Server"

**Option 4 - Node:**
```
npx http-server
```

## Deploy to GitHub Pages

1. Push code to GitHub
2. Go to repo Settings > Pages
3. Set source to main branch
4. Save and wait a minute
5. Your site will be at https://username.github.io/repo-name

## Tech Used

- HTML/CSS/JavaScript
- Bootstrap 5
- Bootstrap Icons
- Fetch API for loading data

## Files

```
airbnb_listings2/
├── index.html
├── css/main.css
├── js/main.js
├── airbnb_sf_listings_500.json
└── README.md
```

## Author

Kashish Rahulbhai Khatri - Northeastern University CS5610
