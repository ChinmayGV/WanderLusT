const map = L.map("map").setView([lat, lng], 13);
// L.tileLayer(
//   "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?",
//   {
//     maxZoom: 20,
//     attribution:
//       '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
//   }
// ).addTo(map);
L.tileLayer(
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.pngapi_key=e3faff56-0e68-4355-baeb-399cbd5552ce",
  {
    maxZoom: 20,
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
  }
).addTo(map);
// L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
//   attribution:
//     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
//   subdomains: "abcd",
//   maxZoom: 20,
// }).addTo(map);

const marker = L.marker([lat, lng]).addTo(map);

const circle = L.circle([lat, lng], {
  color: "#136ca7ff", // A soft red for the thin outline
  fillColor: "#136ca7ff", // The same soft red for the fill
  fillOpacity: 0.3, // The key for the transparent look
  radius: 1000, // Adjust the size as needed
  weight: 0, // Makes the outline very thin
}).addTo(map);

marker
  .bindPopup(
    `
   <div style="width:170px;  text-align: left;">
    <img src="${listingData.image.url}" alt="${
      listingData.title
    }" style="width:100%;height:120px; border-radius:8px; margin-bottom: 5px;">
    <b>${listingData.title}</b><br>
    ₹${listingData.price.toLocaleString("en-IN")} / night
  </div>
  `
  )
  .openPopup();
