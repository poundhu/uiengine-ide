import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
// import App from "./App";
import config from "./config";
import { UIEngineRegister } from "uiengine";

import { IDEEditor } from "uiengine-ide";
import * as serviceWorker from "./serviceWorker";

import components from "./component";
import plugins from "./plugins";
UIEngineRegister.registerComponents(components);
UIEngineRegister.registerPlugins(plugins);

ReactDOM.render(
  <IDEEditor layouts={["schema/ui/simple.json"]} config={config} />,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
