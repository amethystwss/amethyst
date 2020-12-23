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

   src/exit_codes.js

*//////////////////////////////////////////////////////////////////////////////
////////////////////////////////// CONSTANTS //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Dictionary of exit codes.
 *
 * This module is a dictionary full of tokens responsible for representing
 * every exit code that this program could possibly exit with. Instead of
 * hardcoding every exit code, we want our code to be as readable as possible,
 * so we define these constants to improve that factor, as well as enable the
 * exit code's usefulness as a means of determining the reason for the death
 * of a process.
 */
module.exports = {
  
  /**
   * The operating environment will not work with this software.
   *
   * This code is thrown whenever it has been detected that there is a fatal
   * issue with the environment it is operating in. This error code typically
   * comes out as the result of the use of an operating system that Amethyst
   * was not written for.
   */
  BAD_ENVIRONMENT: 1

};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////// END /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
