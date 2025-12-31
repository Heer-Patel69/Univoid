import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.MODE === "production") {
  const removeLovable = () => {
    document
      .querySelectorAll('[class*="lovable"], [id*="lovable"]')
      .forEach(el => el.remove());
  };

  removeLovable();
  setInterval(removeLovable, 500);
}