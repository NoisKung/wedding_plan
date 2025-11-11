Apps Script helper for wedding_plan

This folder contains a ready-to-use Google Apps Script to receive payment notifications (JSON POST) and save them to a Google Sheet and Drive.

Files
- Code.gs - the script to paste into Apps Script

Setup & deploy
1. Create a Google Sheet where you want to collect payment records. Note the spreadsheet ID from the URL (the long string between /d/ and /edit).
2. Create a folder in Google Drive (optional) to store uploaded slips. Note the folder ID from the URL.
3. In `google_apps_script/Code.gs`, replace the placeholders:
   - SPREADSHEET_ID -> your sheet ID
   - DRIVE_FOLDER_ID -> your drive folder ID (or leave blank to store in root)
4. Open script.google.com, create a new project, and paste the contents of `Code.gs` into the editor.
5. Save the project.
6. Deploy the script as a Web App:
   - Click "Deploy" -> "New deployment"
   - Select "Web app"
   - Description: e.g., "Wedding payment receiver"
   - Execute as: "Me"
   - Who has access: "Anyone" or "Anyone with the link" (choose based on your needs)
   - Deploy and authorize scopes requested (Drive, Spreadsheet)
7. Copy the Web App URL and set it as `scriptURL` in `wedding_card.html` (replace existing value).

Notes
- The client (wedding_card.html) sends a JSON payload with these fields:
  { action: 'payment', payerName, payerEmail, amount, message, accountNumber, slipDataUrl, slipName }
  where slipDataUrl is a data URL (data:<mime>;base64,<data>) if a file was uploaded.
- The script decodes the base64 data and saves the file to Drive, then appends a row in the first sheet with [timestamp, name, email, amount, message, account, fileUrl].
- For more security, consider restricting access to authenticated users and validating tokens.

Testing
- After deploying, open your page `wedding_card.html`, update `scriptURL` to the Web App URL, and perform a test submit with a small image. Check the spreadsheet and Drive folder for results.

If you want, I can:
- Help deploy the script step-by-step while you share the necessary IDs.
- Modify the script to validate Google Sign-In tokens (so only signed-in users can submit).
- Add email notifications on new payments.
