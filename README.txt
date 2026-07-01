Upload these two files to the same GitHub repo folder as index.html:

1. professional.css
2. date-fix.js

Then edit index.html:

Inside <head>, after:
<link rel="stylesheet" href="style.css">

add:
<link rel="stylesheet" href="professional.css">

At the bottom, after:
<script src="app.js"></script>

add:
<script src="date-fix.js"></script>

What this improves:
- Cleaner professional dashboard styling
- Better mobile card polish
- Better table and stat card styling
- Date fallback support for Date, Created Date, Created, Created At, created_at, Date Created, and Created On

Important:
If your Baserow table has no date field at all, add a field called "Date" or "Created Date".
