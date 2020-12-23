///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// ABOUT ////////////////////////////////////
/*/////////////////////////////////////////////////////////////////////////////

Amethyst WebSocket Server

   A Project by: Adrian Gjerstad (GitHub @AdrianGjerstad, @amethystwss)

Licensing

   Copyright 2020 Adrian Gjerstad.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

File

   src/startup.js

*//////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// REQUIRE ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const fs = require('fs');
const os = require('os');

const _exit_codes = require('./exit_codes');

///////////////////////////////////////////////////////////////////////////////
/////////////////////////////////// LIBRARY ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Startup library for the Amethyst WebSocket Server.
 *
 * This module contains every method required to perform prechecks on the
 * environment, as well as read, parse, validate, and run all configuration
 * files.
 */
module.exports = {
  
  /**
   * Check the Operating System.
   *
   * This method will automatically exit the program if it detects that we
   * are running on a platform that Amethyst wasn't written for. This is
   * one of the very few locations in this codebase that absolutely must be as
   * cross-platform as possible.
   */
  validate_system: function validate_system() {
    let server_not_for_os = false;

    if(os.platform() !== 'linux') {
      server_not_for_os = true;
    } else {
      
    }

    if(server_not_for_os) {
      console.error("error: fatal: This program was not written for your operating system!");
      console.error("error: fatal: Please consider contributing if you think you can help!");
      console.error("error: fatal: ");
      console.error("error: fatal:    https://github.com/amethystwss/amethyst");
      console.error("error: fatal: ");
      console.error("error: fatal: Expected an operating system that is Debian Linux-like");
      process.exit(_exit_codes.BAD_ENVIRONMENT);
    }

    // We have now confirmed that we are running on a Debian-like system
  }

};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// END /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

