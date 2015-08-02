'use strict';

var map, zoomSpan, extentsSpan,
	gridParts = [],
	defaults = {
		zoom: 3,
		maxDisplay: 10240,
		geohashPrecision: 12,
		geohashZoomScale: [
		// 00, 01, 02, 03, 04, 05, 06, 07, 08, 09, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24
			1,  1,  2,  2,  2,  3,  3,  3,  4,  4,  4,  5,  5,  5,  6,  6,  6,  7,  7,  7,  8,  8,  8,  9,  9,  9
		]
	};

function initialize() {
	zoomSpan = document.getElementById('zoom');
	extentsSpan = document.getElementById('extents');

	map = new google.maps.Map(document.getElementById('map'), {
		zoom: defaults.zoom,
		center: new google.maps.LatLng(-27.593691984693564, -48.56170233339071),
		panControl: false,
		streetViewControl: false
	});

	updateZoom();
	updateBounds();

	google.maps.event.addListener(map, 'zoom_changed', updateZoom);
	google.maps.event.addListener(map, 'bounds_changed', updateBounds);
	google.maps.event.addListener(map, 'idle', mapIdle);
}

google.maps.event.addDomListener(window, 'load', initialize);

function updateZoom() {
	zoomSpan.innerHTML =
	map.getZoom() + ' (' + defaults.geohashZoomScale[map.getZoom()] + ')'
}

function updateBounds() {
	extentsSpan.innerHTML = map.getBounds();
}

function mapIdle() {
	drawGrid();
}

function eraseGrid() {
	for (var i = 0; i < gridParts.length; i++) {
		gridParts[i].setMap(null);

	}
	gridParts.length = 0;
}

function drawGrid() {
	var level = defaults.geohashZoomScale[map.getZoom()],
		bounds = map.getBounds(),
		ne = bounds.getNorthEast(),
	    sw = bounds.getSouthWest(),
	    neHash = Geohash.encode(ne.lat(), ne.lng(), level),
	    nwHash = Geohash.encode(ne.lat(), sw.lng(), level),
	    swHash = Geohash.encode(sw.lat(), sw.lng(), level),
	    seHash = Geohash.encode(sw.lat(), ne.lng(), level),
	    current = neHash,
	    eastBound = neHash,
	    westBound = nwHash,
	    maxHash = defaults.maxDisplay;

	eraseGrid();
	while (maxHash-- > 0) {
		drawBox(current);
		do {
			current = Geohash.adjacent(current, 'w');
			drawBox(current);
		} while (maxHash-- > 0 && current != westBound);
		if (current == swHash) {
			return;
		}
		westBound = Geohash.adjacent(current, 's');
		current = eastBound = Geohash.adjacent(eastBound, 's');
	}
	alert("defaults.maxDisplay limit reached");
	eraseGrid();
}

function drawBox(hash) {
	var b = Geohash.bounds(hash),
		gb = new google.maps.LatLngBounds(
			new google.maps.LatLng(b.sw.lat, b.sw.lon),
			new google.maps.LatLng(b.ne.lat, b.ne.lon)),
		rect = new google.maps.Rectangle({
			map: map,
			bounds: gb,
			strokeColor: '#3333AA',
			strokeOpacity: 0.8,
			strokeWeight: 1,
			fillColor: '#222222',
			fillOpacity: 0.1
		}),
		labelWidth = hash.length * 6 + 4,
		marker = new MarkerWithLabel({
			map: map,
			position: gb.getCenter(),
			icon: " ",
			labelContent: hash,
			labelClass: "marker",
			labelAnchor: new google.maps.Point(labelWidth / 2 + 2, 6),
			labelStyle: { width: labelWidth + "px" },
		});
	gridParts.push(rect);
	gridParts.push(marker);
}
