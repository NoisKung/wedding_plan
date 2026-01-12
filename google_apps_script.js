/**
 * Google Apps Script for Wedding RSVP Form & Payment Slip Upload
 * 
 * This script receives form submissions from the wedding invitation website
 * and saves them to a Google Sheets spreadsheet.
 * 
 * RSVP Sheet ("Page1"):
 * Column A: Date (timestamp)
 * Column B: GuestName 
 * Column C: GuestCount
 * 
 * Payment Sheet ("Payments"):
 * Column A: Date (timestamp)
 * Column B: PayerName
 * Column C: PayerEmail
 * Column D: Amount
 * Column E: BlessingMessage
 * Column F: AccountNumber
 * Column G: SlipFileUrl
 * 
 * Deploy as Web App with:
 * - Execute as: Me
 * - Who has access: Anyone
 */

const SPREADSHEET_ID = '157lYB6x9qa86IQ4zDKcVg0B3Vrelw1kvkOMaSQw0pls';
const DRIVE_FOLDER_ID = ''; // optional: leave as '' to save to root

// ============================================
// SECURITY: Input Validation & Sanitization
// ============================================

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
function sanitizeString(str, maxLength = 500) {
  if (!str) return '';
  str = String(str).substring(0, maxLength);
  // Remove potentially dangerous characters and HTML tags
  return str.replace(/<[^>]*>/g, '')
            .replace(/[<>"'`\\]/g, '')
            .trim();
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (!email || email === 'No Email') return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 100;
}

/**
 * Validate amount is a positive number
 */
function isValidAmount(amount) {
  if (!amount) return true;
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0 && num <= 10000000; // Max 10 million
}

/**
 * Validate guest count
 */
function isValidGuestCount(count) {
  const num = parseInt(count);
  return !isNaN(num) && num >= 1 && num <= 20;
}

/**
 * Validate file MIME type for slip uploads
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'
];

function isValidMimeType(dataUrl) {
  if (!dataUrl) return true;
  const mimeMatch = dataUrl.match(/data:([^;]+);base64/);
  if (!mimeMatch) return false;
  return ALLOWED_MIME_TYPES.includes(mimeMatch[1]);
}

/**
 * Simple rate limiting using CacheService
 * Returns true if request should be allowed, false if rate limited
 */
function checkRateLimit(identifier, maxRequests = 10, windowSeconds = 60) {
  try {
    const cache = CacheService.getScriptCache();
    const key = 'ratelimit_' + identifier;
    const current = cache.get(key);
    
    if (current === null) {
      cache.put(key, '1', windowSeconds);
      return true;
    }
    
    const count = parseInt(current);
    if (count >= maxRequests) {
      return false; // Rate limited
    }
    
    cache.put(key, String(count + 1), windowSeconds);
    return true;
  } catch (e) {
    // If cache fails, allow request
    return true;
  }
}

// ============================================
// Main Entry Points
// ============================================

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({status: 'ok', message: 'Apps Script running'})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // Initialize parameters object
    let params = {};
    
    // Try to get parameters from different sources
    if (e && e.parameter) {
      params = e.parameter;
    } else if (e && e.postData) {
      // Try to parse different content types
      if (e.postData.type === 'application/x-www-form-urlencoded') {
        // Parse URL-encoded form data
        const formData = e.postData.contents;
        const pairs = formData.split('&');
        for (let pair of pairs) {
          const [key, value] = pair.split('=');
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      } else if (e.postData.type === 'application/json') {
        // Parse JSON data
        params = JSON.parse(e.postData.contents);
      }
    }
    
    // Check if this is a payment submission or RSVP submission
    const action = params.action || '';
    
    // Get active spreadsheet
    let spreadsheet;
    if (SPREADSHEET_ID && SPREADSHEET_ID !== 'REPLACE_WITH_SPREADSHEET_ID') {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    } else {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    if (action === 'payment') {
      // Handle payment submission
      return handlePaymentSubmission(params, spreadsheet);
    } else {
      // Handle RSVP submission (default)
      return handleRsvpSubmission(params, spreadsheet);
    }
    
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleRsvpSubmission(params, spreadsheet) {
  try {
    // Rate limiting by action type
    if (!checkRateLimit('rsvp', 50, 60)) {
      return ContentService
        .createTextOutput('Too many requests. Please try again later.')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
    let sheetName = "Page1";
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // Check if sheet exists, if not create it
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      
      // Add headers
      sheet.getRange(1, 1, 1, 4).setValues([['Date', 'GuestName', 'GuestEmail', 'GuestCount']]);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    }
    
    // Get the next available row
    let newRow = sheet.getLastRow() + 1;
    
    // Prepare and SANITIZE the data to insert
    let timestamp = new Date();
    let guestName = sanitizeString(params.GuestName || 'Unknown Guest', 100);
    let guestEmail = sanitizeString(params.GuestEmail || 'No Email', 100);
    let guestCount = params.GuestCount || '1';
    
    // Validate inputs
    if (!isValidEmail(guestEmail)) {
      guestEmail = 'Invalid Email';
    }
    if (!isValidGuestCount(guestCount)) {
      guestCount = '1';
    }
    
    let rowData = [timestamp, guestName, guestEmail, guestCount];
    
    // Insert the data into the sheet
    sheet.getRange(newRow, 1, 1, 4).setValues([rowData]);
    
    // Return success response
    return ContentService
      .createTextOutput('Thank you for your RSVP')
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    return ContentService
      .createTextOutput('Error: ' + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function handlePaymentSubmission(params, spreadsheet) {
  try {
    // Rate limiting for payment submissions
    if (!checkRateLimit('payment', 20, 60)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error', 
        message: 'Too many requests. Please try again later.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // SANITIZE all inputs
    const payerName = sanitizeString(params.payerName || '', 100);
    const payerEmail = sanitizeString(params.payerEmail || '', 100);
    const amount = sanitizeString(params.amount || '', 20);
    const message = sanitizeString(params.message || '', 500);
    const accountNumber = sanitizeString(params.accountNumber || '', 50);
    const slipDataUrl = params.slipDataUrl || null; // Keep as-is for processing
    const slipName = sanitizeString(params.slipName || ('slip_' + new Date().getTime()), 100);
    
    // Validate inputs
    if (!isValidEmail(payerEmail)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error', 
        message: 'Invalid email format'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!isValidAmount(amount)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error', 
        message: 'Invalid amount'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Validate file MIME type if slip is provided
    if (slipDataUrl && !isValidMimeType(slipDataUrl)) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error', 
        message: 'Invalid file type. Only images and PDF allowed.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Save slip to Drive (if provided)
    let fileUrl = '';
    if (slipDataUrl) {
      // slipDataUrl expected as data:[mime];base64,<base64data>
      const parts = slipDataUrl.split(',');
      if (parts.length === 2) {
        const meta = parts[0];
        const base64 = parts[1];
        const mimeMatch = meta.match(/data:([^;]+);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
        
        // Check decoded size (guard against extremely large files)
        const decodedBytes = Utilities.base64Decode(base64);
        if (decodedBytes.length > 5 * 1024 * 1024) { // 5MB limit
          return ContentService.createTextOutput(JSON.stringify({
            status: 'error', 
            message: 'File too large. Maximum 5MB allowed.'
          })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const blob = Utilities.newBlob(decodedBytes, mimeType, slipName);
        if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID !== 'REPLACE_WITH_DRIVE_FOLDER_ID' && DRIVE_FOLDER_ID !== '') {
          try {
            const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
            const file = folder.createFile(blob);
            fileUrl = file.getUrl();
          } catch (err) {
            // fallback to root
            const file = DriveApp.createFile(blob);
            fileUrl = file.getUrl();
          }
        } else {
          const file = DriveApp.createFile(blob);
          fileUrl = file.getUrl();
        }
      }
    }

    // Get or create Payments sheet
    let sheetName = "Payments";
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      // Add headers for payment sheet
      sheet.getRange(1, 1, 1, 7).setValues([['Date', 'PayerName', 'PayerEmail', 'Amount', 'BlessingMessage', 'AccountNumber', 'SlipFileUrl']]);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold');
    }

    // Append payment record
    const timestamp = new Date();
    sheet.appendRow([timestamp, payerName, payerEmail, amount, message, accountNumber, fileUrl]);

    return ContentService.createTextOutput(JSON.stringify({status: 'ok', fileUrl: fileUrl})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.message || String(err)})).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function to verify RSVP submission
 * Run this in the Apps Script editor to test
 */
function testRsvpSubmission() {
  // Simulate an RSVP form submission
  const testEvent = {
    parameter: {
      GuestName: 'Test User',
      GuestCount: '2'
    }
  };
  
  const result = doPost(testEvent);
  console.log('Test RSVP result:', result.getContent());
}

/**
 * Test payment submission
 */
function testPaymentSubmission() {
  // Simulate a payment submission (without file)
  const testEvent = {
    postData: {
      type: 'application/json',
      contents: JSON.stringify({
        action: 'payment',
        payerName: 'Test Payer',
        payerEmail: 'test@example.com',
        amount: '500',
        message: 'Happy wedding!',
        accountNumber: '012-3-45678-9'
      })
    }
  };
  
  const result = doPost(testEvent);
  console.log('Test payment result:', result.getContent());
}

/**
 * Function to set up the spreadsheet headers
 * Run this once to add column headers
 */
function setupHeaders() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup RSVP Sheet
  let rsvpSheet = spreadsheet.getSheetByName("Page1");
  if (!rsvpSheet) {
    rsvpSheet = spreadsheet.insertSheet("Page1");
  }
  if (rsvpSheet.getLastRow() === 0) {
    rsvpSheet.getRange(1, 1, 1, 4).setValues([['Date', 'GuestName', 'GuestEmail', 'GuestCount']]);
    const headerRange = rsvpSheet.getRange(1, 1, 1, 4);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#E8F0FE');
  }
  
  // Setup Payment Sheet
  let paymentSheet = spreadsheet.getSheetByName("Payments");
  if (!paymentSheet) {
    paymentSheet = spreadsheet.insertSheet("Payments");
  }
  if (paymentSheet.getLastRow() === 0) {
    paymentSheet.getRange(1, 1, 1, 7).setValues([['Date', 'PayerName', 'PayerEmail', 'Amount', 'BlessingMessage', 'AccountNumber', 'SlipFileUrl']]);
    const headerRange = paymentSheet.getRange(1, 1, 1, 7);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#E8F0FE');
  }
  
  console.log('Headers set up successfully');
}
