<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/amethystwss/amethyst">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Amethyst WebSockets</h3>

  <p align="center">
    A full-blown, complete, specification compliant WebSocket server.
    <br />
    <a href="https://amethystwss.github.io"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://amethystwss.github.io/demo">View Demo</a>
    ·
    <a href="https://github.com/amethystwss/amethyst/issues">Report Bug</a>
    ·
    <a href="https://github.com/amethystwss/amethyst/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-amethyst">About Amethyst</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#starting-the-service">Starting the Service</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About Amethyst

[![Product Name Screen Shot][product-screenshot]](https://amethystwss.github.io)

There are a lot of articles on the Internet that attempt to teach how the WebSocket protocol works, and even how to make a server that accepts WebSocket connections! This is why I decided to make an attempt at writing the best server I possibly could, and keep less experienced people from exposing their entire network to attacks.

Here's why:
- Security tends not to be at the center of a web developer's attention while developing, and so he/she/they will make some dangerous mistakes during the process.
- I wanted a WebSocket server that was capable of hosting multiple endpoints at once, with every endpoint being represented in different files throughout a filesystem.
- There aren't many production-ready WebSocket server applications out there.

Of course, though, since this is an open source project and is therefore open for others to look around, we are grateful for any contributions and/or ideas you may have to bring to the table. You can find more information about contribution to this repository in [CONTRIBUTING.md](https://github.com/amethystwss/amethyst/blob/main/CONTRIBUTING.md).

A list of resources you can use to learn about WebSockets are listed in the [Acknowledgements](#acknowledgements) section.

### Built With

Here's the best part. We have no dependencies, and intend to remain that way.

There are plenty of Node.js WebSocket server implementations, including good ones like [websockets/ws](https://github.com/websockets/ws) or [socketio/socket.io](https://github.com/socketio/socket.io). The problem is that, due to their simplicity, they don't have much in the way of safely controlling WebSocket connections, for example, for limiting payload size. This isn't even beginning to mention the lack of dynamically loading individual endpoint scripts.

Additionally, the reason we stick with a "no dependencies" philosophy, is because we want this package to be as easy to install and use as possible. Relying on other packages to do the bulk of the work for us just won't cut it when it comes to having to install all of those extra dependencies on a brand new system.

<!-- GETTING STARTED -->
## Getting Started

To start into the world of WebSocket servers, follow these steps to install a copy of Amethyst on your Debian/Ubuntu Linux system.

### Installation

1. Download the installation script
   ```sh
   curl https://raw.githubusercontent.com/amethystwss/amethyst/main/install.sh >> install_amethyst.sh
   ```
2. Run the script to install the package (root access is required)
   ```sh
   sudo bash install_amethyst.sh
   ```

### Starting the Service

The software comes with an echo service available out-of-the-box to test with, so we should get to trying it out!

1. Start the Service
   ```sh
   sudo amethystctl start
   ```
2. Test it using whatever service you want! The endpoint should be available at `http(s)://localhost:<port>/echo`.

> **SECURITY WARNING**
>
> You should set this software up with caution, since testing it locally first is the best course of action. An improperly set up server, i.e. not behind a good firewall+HTTP proxy, that is available to the public is a risk to the integrity of your system and local network.

<!-- USAGE EXAMPLES -->
<!-- Not yet.. :(
## Usage

Use this space to show useful examples of how a project can be used. Additional screenshots, code examples and demos work well in this space. You may also link to more resources.

_For more examples, please refer to the [Documentation](https://example.com)_



<!-- ROADMAP ->
## Roadmap

See the [open issues](https://github.com/othneildrew/Best-README-Template/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING ->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

-->

<!-- LICENSE -->
## License

Distributed under the Apache-2.0 License. See `LICENSE` for more information.

<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements
* [WebSocket Specification (RFC 6455)](https://tools.ietf.org/html/rfc6455)



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/amethystwss/amethyst.svg?style=for-the-badge
[contributors-url]: https://github.com/amethystwss/amethyst/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/amethystwss/amethyst.svg?style=for-the-badge
[forks-url]: https://github.com/amethystwss/amethyst/network/members
[stars-shield]: https://img.shields.io/github/stars/amethystwss/amethyst.svg?style=for-the-badge
[stars-url]: https://github.com/amethystwss/amethyst/stargazers
[issues-shield]: https://img.shields.io/github/issues/amethystwss/amethyst.svg?style=for-the-badge
[issues-url]: https://github.com/amethystwss/amethyst/issues
[license-shield]: https://img.shields.io/github/license/amethystwss/amethyst.svg?style=for-the-badge
[license-url]: https://github.com/amethystwss/amethyst/blob/main/LICENSE.txt
[product-screenshot]: images/screenshot.png
