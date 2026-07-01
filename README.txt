WhiteSaffron Bills - Easy User Friendly Version

Use these files in your GitHub repo:

- index.html
- login.html
- style.css
- app.js
- config.js

Main functions:

- Home page shows Latest Bill
- Home page shows This Month total and count
- Home page shows Today total and count
- Search by vendor, bill no, location, TIN
- Filter chips: All, Today, This Month, Last 30 Days
- Add bill
- Edit bill
- Delete bill
- Detail view with Back to Home
- Automatic back to home after add/edit/delete
- Duplicate warning before saving same Vendor + Amount + Date + Bill No
- Entered By is stored in browser local storage
- Export current filtered list to CSV
- Mobile card view and desktop table view

Baserow fields expected:

- Vendor
- Amount
- Date
- Bill No
- Location
- TIN

Open config.js to change:

- API_TOKEN
- TABLE_ID
- username/password

Security note:
This is a static GitHub Pages app, so config.js is public. Use a limited Baserow token.
