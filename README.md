> Puppeteer script to update Polymer Codepens

This script uses Puppeteer to update the current user's Polymer Codepens, replacing [Polygit](https://polygit.org) (deprecated and no longer functional) with [`polymer-cdn`](https://github.com/Download/polymer-cdn) -- especially useful when there are hundreds of Codepens to update (which was the case for me).

**NOTE:** The script user must manually handle Codepen's CAPTCHA challenge at login before the automated updates can begin.
