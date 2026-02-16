# Concierge Admin Dashboard

Admin dashboard for managing quick action responses in the concierge bot.

## Setup

1. Install dependencies:
   ```bash
   cd admin
   npm install
   ```

2. Create a `.env` file in the `admin/` directory with:
   ```
   DATABASE_URL=postgresql://matthewmeakin@localhost:5432/mydb
   ADMIN_PASSWORD=your-secure-password
   ```

   **Important**: The `DATABASE_URL` should be the same as your main app's database URL.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

5. Log in with the password you set in `ADMIN_PASSWORD`.

## Features

- View all quick actions and their configurations
- Enable/disable actions
- Configure response types:
  - **Static Text**: Display a fixed message
  - **Database Query**: Fetch data from meals, activities, guidelines, etc.
  - **Template**: Combine static text with database data

## Available Data Sources

| Source | Description |
|--------|-------------|
| meals | Today's meal schedule |
| activities | Today's activities |
| guidelines | Facility guidelines |
| houseRules | House rules list |
| medications | User's medications (requires user context) |
| advocates | Assigned advocates (requires user context) |

