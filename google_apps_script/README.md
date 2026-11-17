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

---

Guest photos (/photos) — `Photos.gs`

`Photos.gs` receives photos from `photos/index.html`
and saves them to Google Drive, one folder per guest name:

```
<parent folder>/<guest name>/Original/<shot id>.jpg        every photo, no filter or date stamp
<parent folder>/<guest name>/Film/<shot id>-film.jpg       only when the guest has film look on
```

Both copies are resized to 2048 px on the long edge,
and EXIF data such as GPS location is removed.
It is a separate Apps Script project from the RSVP/payment script,
so deploying or switching it off never touches RSVP or payments.

Deploy (about 5 minutes, once):
1. Open script.google.com > New project. Name it e.g. "Wedding Photos".
2. Replace the editor contents with `Photos.gs` and save.
3. Pick `setup` in the function menu and click Run.
   Approve the Drive permission prompt.
   The log prints the URL of the new folder "Wedding Moments - Guest Photos" in My Drive.
   (To use a folder you already have, first add a Script Property
   `PHOTOS_FOLDER_ID` = that folder's ID under Project Settings > Script Properties, then run `setup`.)
4. Optional: run `testUpload` — a "Test Guest" folder with a 1×1 image in `Original/` should appear.
   Delete that folder afterwards.
5. Deploy > New deployment > Web app.
   - Execute as: Me
   - Who has access: Anyone
6. Copy the Web app URL (ends in `/exec`) and paste it into
   `PHOTOS_SCRIPT_URL` near the top of the script in `photos/index.html`.
   Until then the page says photo upload isn't switched on yet.

Changing `Photos.gs` later: paste the new code, save,
then Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy.
This keeps the same `/exec` URL.
"New deployment" makes a new URL instead.
To check the update is live, open the `/exec` URL in a browser:
it should show the `version` set in `PHOTOS_API_VERSION` (currently 2).

Limits to know:
- One photo per request, at most 8 MB after decoding; the page sends about 0.5–1.5 MB JPEGs.
- Rate limits per 10 minutes: 240 requests per guest name, 4000 for everyone together.
  A photo taken with film look on is two requests (original + film).
- Web apps that run as "Me" share the owner's simultaneous-execution quota
  (30 at a time per the Apps Script quotas page).
  The page uploads one photo at a time per phone and retries with backoff,
  so a busy moment queues up instead of losing photos.
- Photos count against the owner's Google Drive storage.
  With film look on, each photo is stored twice (about 1–3 MB per photo in total).

Turning it off after the wedding: Deploy > Manage deployments > Archive.
