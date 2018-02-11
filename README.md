# globular
Globular is a proof assistant for higher categories. For more details, go here: https://ncatlab.org/nlab/show/Globular.

Globular is open source under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International Public License.

## To run a local copy for development:

Install prerequisites (assuming OS X, macports)
```
sudo port install npm2
sudo npm install pm2@latest -g
```

Then clone the project:
```
git clone git@github.com:jamievicary/globular.git
cd globular
```

To start a server instance:
```
pm2 restart app.js
open http://localhost:3000/
```


