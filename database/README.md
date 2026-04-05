# Database Export

This folder contains sample data exports for the StudyConnect application.

## Files

- `users.json`: Sample user accounts with profiles
- `sessions.json`: Sample study sessions

## How to Import Data

### Using MongoDB Shell

1. Start MongoDB and connect to your database
2. Run the following commands:

```bash
# Import users
mongoimport --db studyconnect --collection users --file database/users.json --jsonArray

# Import sessions
mongoimport --db studyconnect --collection sessions --file database/sessions.json --jsonArray
```

### Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Select the `studyconnect` database
4. For each collection (users, sessions):
   - Right-click the collection
   - Select "Import Data"
   - Choose the corresponding JSON file
   - Select "JSON" as the input format

## Sample Data Overview

### Users
- 4 sample users with different interests and availability
- Passwords are bcrypt-hashed (these are example hashes)
- All users have completed their profiles

## Important Notes:
Login Credentials: All these mock users have the password: password123.
UI Visibility: Once imported, these students will appear in the "Students with Similar Interests" section on the dashboard when you log in with your own account.
Emails: These are @uts.edu.au mock emails for a professional look.

### Sessions
- 3 sample study sessions
- Mix of online and in-person sessions
- Different topics covering the main interest areas
- Multiple attendees per session

## Notes

- The `_id` fields use MongoDB ObjectId format
- Passwords in the export are placeholder hashes - in a real export, these would be actual hashed passwords
- Dates are in ISO format
- This data is for testing and demonstration purposes

## Export Commands (for reference)

To export your own data from a running MongoDB instance:

```bash
# Export users
mongoexport --db studyconnect --collection users --out database/users.json --jsonArray

# Export sessions
mongoexport --db studyconnect --collection sessions --out database/sessions.json --jsonArray
```