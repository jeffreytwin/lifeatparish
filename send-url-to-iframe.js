
import wixLocationFrontend from "wix-location-frontend";

$w.onReady(function () {
    // Read the neighborhood parameter from the parent page URL
    const neighborhoodParam = wixLocationFrontend.query.neighborhood;

    // Get the iframe element
    const mapIframe = $w('#mapIframe');

    // If neighborhood parameter exists, add it to the iframe src
    if (neighborhoodParam) {
        const mapUrl = `https://lifeatparrish.web.app/?neighborhood=${encodeURIComponent(neighborhoodParam)}`;
        mapIframe.src = mapUrl;


    } else {
        // No parameter, just load the default map
        mapIframe.src = 'https://lifeatparrish.web.app/';
    }
});