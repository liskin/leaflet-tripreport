(function(){
	var osmAttr = '&copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a>';
	var mapyCzAttr = '&copy; <a href="https://www.seznam.cz/" target="_blank">Seznam.cz, a.s</a>, ' + osmAttr;
	var thunderforestAttr = osmAttr + ', Tiles courtesy of <a href="http://www.thunderforest.com/" target="_blank">Andy Allan</a>';
	var layerMapyCz =
		L.tileLayer('https://mapserver.mapy.cz/1turist-m/{z}-{x}-{y}', {
			minZoom: 2, maxZoom: 20, maxNativeZoom: 18, attribution: mapyCzAttr, id: 'mapy.cz'
		});
	var layerOpenStreetMap =
		L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 20, maxNativeZoom: 19, attribution: osmAttr, id: 'OpenStreetMap'
		});
	var layerOpenCycleMap =
		L.tileLayer('https://{s}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png', {
			maxZoom: 20, attribution: thunderforestAttr, id: 'OpenCycleMap'
		});
	var baseMaps = {
		"mapy.cz": layerMapyCz,
		"OpenStreetMap": layerOpenStreetMap,
		"OpenCycleMap": layerOpenCycleMap,
	};

	var layerPhoto = L.photo.cluster({
		spiderfyDistanceMultiplier: 2,
	});
	layerPhoto.on('click', function (evt) {
		var photo = evt.layer.photo;
		var template = '<a target="_blank" href="{url}"><img src="{preview}"/></a>';

		evt.layer.bindPopup(L.Util.template(template, photo), {
			className: 'leaflet-popup-photo',
			minWidth: 300,
		}).openPopup();
	});
	var layerGpx = L.featureGroup();
	layerGpx.on('click', function (evt) {
		var track = evt.layer.track;
		var template = '<a target="_blank" href="{link}">{name}</a>';

		evt.layer.bindPopup(L.Util.template(template, track), {
			className: 'leaflet-popup-photo',
		}).openPopup();
	});
	var overlayMaps = {
		"Photos": layerPhoto,
		"Tracks": layerGpx,
	};

	var map = L.map('map', {
		zoom: 9,
		center: [49.7437572, 15.3386383],
		maxZoom: 18,
		layers: [layerMapyCz, layerPhoto, layerGpx],
	});
	L.control.layers(baseMaps, overlayMaps).addTo(map);

	$.get('data.json', function (data) {
		layerPhoto.add(data.photos);
		data.tracks.forEach(function (track) {
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
		map.fitBounds(layerPhoto.getBounds());
	});
})();
