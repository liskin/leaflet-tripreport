function tripReport(data) {
	var osmAttr = '&copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>';
	var mapyCzAttr = '&copy; <a href="https://www.seznam.cz/" target="_blank">Seznam.cz, a.s</a>, ' + osmAttr;
	var thunderforestAttr = osmAttr + ', Tiles courtesy of <a href="http://www.thunderforest.com/" target="_blank">Andy Allan</a>';
	var layerMapyCz =
		L.tileLayer('https://mapserver.mapy.cz/turist-m/{z}-{x}-{y}', {
			minZoom: 2, maxZoom: 20, maxNativeZoom: 18, attribution: mapyCzAttr, id: 'mapy.cz'
		});
	var layerMapyCzHybrid = L.layerGroup([
		L.tileLayer('https://mapserver.mapy.cz/bing/{z}-{x}-{y}', {
			minZoom: 2, maxZoom: 20, maxNativeZoom: 18, attribution: mapyCzAttr, id: 'mapy.cz'
		}),
		L.tileLayer('https://mapserver.mapy.cz/hybrid-trail_bike-m/{z}-{x}-{y}', {
			minZoom: 2, maxZoom: 20, maxNativeZoom: 18, attribution: mapyCzAttr, id: 'mapy.cz'
		}),
	]);
	var layerOpenStreetMap =
		L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 20, maxNativeZoom: 19, attribution: osmAttr, id: 'OpenStreetMap'
		});
	var layerOpenCycleMap =
		L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
			maxZoom: 20, attribution: thunderforestAttr, id: 'OpenCycleMap'
		});

	var layerPhoto = L.photo.cluster({
		spiderfyDistanceMultiplier: 2.5,
		icon: {
			iconSize: [60, 60],
		},
	});
	layerPhoto.on('click', function (evt) {
		var photo = evt.layer.photo;
		var content = `<a target="_blank" href="${photo.url}"><img src="${photo.preview}"/></a>`;

		evt.layer.bindPopup(content, {
			className: 'leaflet-popup-photo',
			minWidth: 300,
		}).openPopup();
	});
	layerPhoto.add(data.photos ? data.photos : []);

	var layerGpx = L.featureGroup();
	layerGpx.on('click', function (evt) {
		var track = evt.layer.track;
		var content = `<a target="_blank" href="${track.link}">${track.name}</a>`;

		evt.layer.bindPopup(content, {
			className: 'leaflet-popup-photo',
		}).openPopup();
	});
	(data.tracks ? data.tracks : []).forEach(function (track) {
		var l = L.polyline(track.coords, {
			weight: 5,
			color: track.color,
		});
		l.track = {
			name: track.name,
			link: track.link,
		};
		layerGpx.addLayer(l);
	});

	var layerWpt = L.featureGroup();
	layerWpt.on('click', function (evt) {
		var point = evt.layer.point;
		var content = `<strong>${point.name}</strong>`;
		point.links.forEach(function (link) {
			content += `<br/><a target="_blank" href="${link}">${link}</a>`;
		});
		point.imgs.forEach(function (img) {
			content += `<br/><a target="_blank" href="${img}"><img src="${img}"/></a>`;
		});

		evt.layer.bindPopup(content, {
			className: 'leaflet-popup-photo',
			minWidth: 200,
		}).openPopup();
	});
	(data.points ? data.points : []).forEach(function (point) {
		var icon = L.icon({
			iconUrl: point.icon,
		});
		var l = L.marker(point.coords, {
			title: point.name,
			icon: icon,
		});
		l.point = {
			name: point.name,
			links: point.links,
			imgs: point.imgs,
		};
		layerWpt.addLayer(l);
	});

	var map = L.map('map', {
		zoom: 9,
		center: [49.7437572, 15.3386383],
		maxZoom: 18,
		layers: [layerMapyCz, layerPhoto, layerGpx, layerWpt],
	});
	var bounds = L.latLngBounds([]);
	bounds.extend(layerPhoto.getBounds());
	bounds.extend(layerGpx.getBounds());
	bounds.extend(layerWpt.getBounds());
	if (bounds.isValid()) {
		map.fitBounds(bounds);
	}

	var baseMaps = {
		"mapy.cz": layerMapyCz,
		"mapy.cz hybrid": layerMapyCzHybrid,
		"OpenStreetMap": layerOpenStreetMap,
		"OpenCycleMap": layerOpenCycleMap,
	};
	var overlayMaps = {
		"Photos": layerPhoto,
		"Tracks": layerGpx,
		"Points": layerWpt,
	};
	L.control.layers(baseMaps, overlayMaps).addTo(map);
}
