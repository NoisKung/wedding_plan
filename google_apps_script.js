/**
 * Google Apps Script for Wedding RSVP Form
 * 
 * This script receives form submissions from the wedding invitation website
 * and saves them to a Google Sheets spreadsheet.
 * 
 * Sheet Structure:
 * Column A: Date (timestamp)
 * Column B: GuestName 
 * Column C: GuestCount
 * 
 * Deploy as Web App with:
 * - Execute as: Me
 * - Who has access: Anyone
 */

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
    } else {
      // If no parameters, create test entry
      params = {
        GuestName: 'Test Entry - No Params',
        GuestCount: '1'
      };
    }
    
    // Configuration
    let sheetName = "Page1";
    let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // Check if sheet exists, if not create it
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      
      // Add headers for authenticated RSVP
      sheet.getRange(1, 1, 1, 4).setValues([['Date', 'GuestName', 'GuestEmail', 'GuestCount']]);
      sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
      sheet.getRange(1, 1, 1, 4).setBackground('#E8F0FE');
    }
    
    // Get the next available row
    let newRow = sheet.getLastRow() + 1;
    
    // Prepare the data to insert
    let timestamp = new Date();
    let guestName = params.GuestName || 'Unknown Guest';
    let guestEmail = params.GuestEmail || 'No Email';
    let guestCount = params.GuestCount || '1';
    
    // Check for duplicate email addresses to prevent multiple submissions
    if (guestEmail !== 'No Email') {
      let dataRange = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4);
      let data = dataRange.getValues();
      
      for (let i = 0; i < data.length; i++) {
        if (data[i][2] === guestEmail) { // Check email column
          // Update existing entry instead of creating new one
          sheet.getRange(i + 2, 1, 1, 4).setValues([[timestamp, guestName, guestEmail, guestCount]]);
          return ContentService
            .createTextOutput('RSVP updated successfully')
            .setMimeType(ContentService.MimeType.TEXT);
        }
      }
    }
    
    let rowData = [timestamp, guestName, guestEmail, guestCount];
    
    // Insert the data into the sheet
    sheet.getRange(newRow, 1, 1, 4).setValues([rowData]);
    
    // Return success response
    return ContentService
      .createTextOutput('Thank you for submit the invitation')
      .setMimeType(ContentService.MimeType.TEXT);
      
  } catch (error) {
    return ContentService
      .createTextOutput('Error: ' + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Test function to verify the script works
 * Run this in the Apps Script editor to test
 */
function testDoPost() {
  // Simulate a form submission
  const testEvent = {
    parameter: {
      GuestName: 'Test User',
      GuestCount: '2'
    }
  };
  
  const result = doPost(testEvent);
  console.log('Test result:', result.getContent());
}

/**
 * Function to set up the spreadsheet headers
 * Run this once to add column headers
 */
function setupHeaders() {
  let sheetName = "Page1";
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  if (!sheet) {
    // Create the sheet if it doesn't exist
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
  }
  
  // Add headers if the sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 3).setValues([['Date', 'GuestName', 'GuestCount']]);
    
    // Format the header row
    const headerRange = sheet.getRange(1, 1, 1, 3);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#E8F0FE');
  }
  
  console.log('Headers set up successfully');
}