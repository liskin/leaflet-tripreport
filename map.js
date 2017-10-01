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

	var layerPhoto = L.photo.cluster();
	layerPhoto.on('click', function (evt) {
		var photo = evt.layer.photo;
		var template = '<a target="_blank" href="{url}"><img src="{preview}"/></a>';

		evt.layer.bindPopup(L.Util.template(template, photo), {
			className: 'leaflet-popup-photo',
			minWidth: 300
		}).openPopup();
	});
	var layerGpx = L.featureGroup();
	var overlayMaps = {
		"Photos": layerPhoto,
		"Tracks": layerGpx,
	};

	var map = L.map('map', {
		zoom: 9,
		center: [48.7259733, 16.7431633],
		maxZoom: 18,
		layers: [layerMapyCz, layerPhoto, layerGpx],
	});
	L.control.layers(baseMaps, overlayMaps).addTo(map);

	/*
	In browser that's logged in to Google:
	- create new tmp album
	- https://picasaweb.google.com/data/feed/api/user/113411333440293111262
	- find album
	- https://picasaweb.google.com/data/feed/api/user/113411333440293111262/albumid/6471621605834696945
	- save as photos.xml
	*/
	$.get('photos.xml', null, null, 'xml').then(function (data) {
		var photos = $(data).children('feed').children('entry').map(function () {
			var photo = this;
			var pos = $(photo).find('gml\\:pos').text().split(' ');
			if (pos.length != 2) {
				return [];
			}
			// TODO: brát ty pozice z gpx

			var thumbnail = $(photo).find('media\\:thumbnail[width=72],media\\:thumbnail[height=72]').attr('url');
			var preview = $(photo).find('media\\:thumbnail[width=288],media\\:thumbnail[height=288]').attr('url');
			var url = preview.replace('/s288/', '/s0/');

			return {
				lat: pos[0],
				lon: pos[1],
				thumbnail: thumbnail,
				preview: preview,
				url: url,
			};
		}).get();
		layerPhoto.add(photos);
		map.fitBounds(layerPhoto.getBounds());
	});

	function parseGpx(gpx) {
		var trk = $(gpx).children('gpx').children('trk').get(0);
		var name = $(trk).children('name').text();
		var trkpts = $(trk).children('trkseg').children('trkpt').get();
		var coords = trkpts.map(function (trkpt) {
			return [
				1 * trkpt.getAttribute('lat'),
				1 * trkpt.getAttribute('lon'),
			];
		});

		return L.polyline(coords, {
			color: name.match('spaní') ? '#0000ff' : '#ff0000',
			weight: 5,
		});

		// TODO: link na stravu
	}

	['den1a.gpx', 'den1b.gpx', 'den2a.gpx', 'den2b.gpx', 'den3.gpx'].forEach(function (name) {
		$.get(name, null, null, 'xml').then(function (data) {
			layerGpx.addLayer(parseGpx(data));
		});
	});
})();
