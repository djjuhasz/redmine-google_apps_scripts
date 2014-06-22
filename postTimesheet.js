/*
 * Post timesheet from Google Docs to Redmine
 *
 * Copyright (c) 2014 David Juhasz
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * Author: David Juhasz <djjuhasz@gmail.com>
 *
 */

function postTimesheet() {
  timesheet = new Timesheet;

  // Parse timesheet
  timesheet.parse();

  // Combine duplicate entries for the same day
  timesheet.rollup();

  // TODO: Send to redmine
  timesheet.send();

  function Row(ssRow) {
    this.issueNum = ssRow[0];
    this.desc = ssRow[1];
    this.start = ssRow[2];
    this.end = ssRow[3];
    this.hours = parseFloat(ssRow[4]);
    this.date = ssRow[5];

    // Convert date to ISO string
    if (this.date.toString() !== '') {
      this.date = new Date(ssRow[5]);
      this.date = this.date.toISOString();

      // Truncate time
      var t = this.date.indexOf('T');
      if (t > -1) {
        this.date = this.date.substr(0,t);
      }
    }

    this.isValid = function() {
      if (this.issueNum.toString() === '' || this.hours.toString() === '' || this.date.toString() === '') {
        return false;
      }

      return true;
    }

    return this;
  }

  function Timesheet() {
    this.dates = {};
    this.issueNums = {};
    this.rows = [];

    // Add valid timesheet entries to internal array
    this.parse = function() {
      var sheet = SpreadsheetApp.getActiveSheet();
      var data = sheet.getDataRange().getValues();

      for (var i = 2; i < data.length; i++) {
        var row = new Row(data[i]);

        if (row.isValid()) {
          this.rows.push(row);
        }
      }
    }

    // Combine duplicate entries of same issue number in same day
    this.rollup = function() {

      for (var i = 0; i < this.rows.length; i++) {
        var removeRows = [];

        for (var j = i + 1; j < this.rows.length; j++) {

          // If issue # and date match
          if (this.rows[i].issueNum == this.rows[j].issueNum && this.rows[i].date == this.rows[j].date) {

            // Add hours together
            this.rows[i].hours += this.rows[j].hours;

            // Concatenate descriptions if not the same
            if (this.rows[i].desc != this.rows[j].desc) {
              this.rows[i].desc += '; ' + this.rows[j].desc;
            }

            // Mark duplicate rows for removal, but don't do it now to avoid array index problems
            removeRows.push(j);
          }
        }

        // Remove duplicate rows backwards, to avoid issues with changing indexes
        for (var j = removeRows.length - 1; j >= 0; j--) {
          this.rows.splice(removeRows[j], 1);
        }
      }
    }

    this.send = function() {
      for (var i = 0; i < this.rows.length; i++) {
        Logger.log("Added issue #" + this.rows[i].issueNum + ", Date: " + this.rows[i].date + ", hours: " + this.rows[i].hours + ", Desc: " + this.rows[i].desc);
      }
    }
  }

}
